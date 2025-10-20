import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

/* -------------------------------------------------------------------------- */
/*                                Utility Helpers                             */
/* -------------------------------------------------------------------------- */

/**
 * Parse currency-like strings into numeric values.
 * e.g. "$1,234.50" → 1234.5
 */
function parseMoney(v: any): number {
    if (v == null || v === '') return 0
    if (typeof v === 'number') return v
    const s = String(v).replace(/[^0-9.\-]/g, '').trim()
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : 0
}

/**
 * Convert a number into a fixed 2-decimal string for Prisma.Decimal compatibility.
 */
function toDecimal(v?: number | null): string | null {
    if (v == null || Number.isNaN(v)) return null
    return (Math.round(v * 100) / 100).toFixed(2)
}

/**
 * Detect the maximum "Day N" column index in the uploaded Excel row.
 * Example: Day 1, Day 2, Day 3 → returns 3
 */
function detectMaxDay(row: Record<string, any>): number {
    let max = 0
    for (const key of Object.keys(row)) {
        const m = key.match(/Day\s*(\d+)/i)
        if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return max
}

/* -------------------------------------------------------------------------- */
/*                              Main Business Logic                           */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    try {
        /* ---------------------------- 1️⃣ Authentication ---------------------------- */
        const token = (await cookies()).get('auth_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        /* ---------------------------- 2️⃣ File Parsing ---------------------------- */
        const form = await req.formData()
        const file = form.get('file') as File | null
        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

        const filename = file.name
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        if (!wb.SheetNames.length)
            return NextResponse.json({ error: 'Empty workbook' }, { status: 400 })

        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null }) as Record<string, any>[]
        if (!rows.length)
            return NextResponse.json({ error: 'No rows found in worksheet' }, { status: 400 })

        /* -------------------------- 3️⃣ Data Extraction -------------------------- */
        const products: { code: string; name: string }[] = []
        const facts: any[] = []

        for (const r of rows) {
            // Skip empty lines
            if (!r['ID'] && !r['Product Name']) continue

            const code = String(r['ID'] ?? '').trim()
            const name = String(r['Product Name'] ?? '').trim()
            if (!code || !name) continue

            const maxDay = detectMaxDay(r)
            if (maxDay === 0) continue

            products.push({ code, name })

            // Calculate date range (from N days ago up to today)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const startDate = new Date(today)
            startDate.setDate(today.getDate() - (maxDay - 1))

            // Dynamic inventory tracking
            let currentInventory = parseFloat(r['Opening Inventory'] ?? '0') || 0

            for (let d = 1; d <= maxDay; d++) {
                const pQty = parseFloat(r[`Procurement Qty (Day ${d})`] ?? '0') || 0
                const pPrice = parseMoney(r[`Procurement Price (Day ${d})`])
                const sQty = parseFloat(r[`Sales Qty (Day ${d})`] ?? '0') || 0
                const sPrice = parseMoney(r[`Sales Price (Day ${d})`])

                // Skip if all fields are empty or zero
                if (pQty === 0 && sQty === 0 && pPrice === 0 && sPrice === 0) continue

                const date = new Date(startDate)
                date.setDate(startDate.getDate() + (d - 1))

                const procurementAmount = pQty * pPrice
                const salesAmount = sQty * sPrice

                facts.push({
                    code,
                    date,
                    openingInventory: currentInventory,
                    procurementQty: pQty,
                    procurementPrice: toDecimal(pPrice),
                    procurementAmount: toDecimal(procurementAmount),
                    salesQty: sQty,
                    salesPrice: toDecimal(sPrice),
                    salesAmount: toDecimal(salesAmount),
                })

                // Update running inventory: Opening + Purchases − Sales
                currentInventory = currentInventory + pQty - sQty
            }
        }

        if (!facts.length) {
            return NextResponse.json({ error: 'No valid daily data found' }, { status: 400 })
        }

        /* --------------------------- 4️⃣ Database Operations --------------------------- */
        const result = await prisma.$transaction(async (tx) => {
            // Create import batch record
            const batch = await tx.importBatch.create({
                data: { filename, userId: payload.id },
                select: { id: true },
            })

            // Find existing products by code
            const uniqueCodes = Array.from(new Set(products.map((p) => p.code)))
            const existing = await tx.product.findMany({
                where: { productCode: { in: uniqueCodes } },
                select: { id: true, productCode: true },
            })
            const codeToId = new Map(existing.map((p) => [p.productCode, p.id]))

            // Insert any missing products
            const newProducts = await Promise.all(
                products
                    .filter((p) => !codeToId.has(p.code))
                    .map((p) =>
                        tx.product.create({
                            data: { productCode: p.code, name: p.name, uploadedBy: payload.id },
                            select: { id: true, productCode: true },
                        })
                    )
            )
            newProducts.forEach((p) => codeToId.set(p.productCode, p.id))

            // Upsert DailyFact records
            let imported = 0
            for (const f of facts) {
                const pid = codeToId.get(f.code)
                if (!pid) continue

                await tx.dailyFact.upsert({
                    where: { productIdRef_date: { productIdRef: pid, date: f.date } },
                    update: {
                        openingInventory: f.openingInventory,
                        procurementQty: f.procurementQty,
                        procurementPrice: f.procurementPrice,
                        procurementAmount: f.procurementAmount,
                        salesQty: f.salesQty,
                        salesPrice: f.salesPrice,
                        salesAmount: f.salesAmount,
                        importBatchId: batch.id,
                    },
                    create: {
                        productIdRef: pid,
                        date: f.date,
                        openingInventory: f.openingInventory,
                        procurementQty: f.procurementQty,
                        procurementPrice: f.procurementPrice,
                        procurementAmount: f.procurementAmount,
                        salesQty: f.salesQty,
                        salesPrice: f.salesPrice,
                        salesAmount: f.salesAmount,
                        importBatchId: batch.id,
                    },
                })
                imported++
            }

            return { batchId: batch.id, imported }
        })

        /* --------------------------- 5️⃣ Response --------------------------- */
        return NextResponse.json({
            success: true,
            message: `Imported ${result.imported} records successfully.`,
            imported: result.imported,
            batchId: result.batchId,
        })
    } catch (err: any) {
        console.error('❌ [UPLOAD ERROR]:', err?.message || err)
        return NextResponse.json(
            { error: 'Internal server error', details: err?.message },
            { status: 500 }
        )
    }
}
