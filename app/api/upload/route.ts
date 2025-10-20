import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

/* -------------------------------------------------------------------------- */
/*                                Utility Helpers                             */
/* -------------------------------------------------------------------------- */

function parseMoney(v: unknown): number {
    if (v == null || v === '') return 0
    if (typeof v === 'number') return v
    const s = String(v).replace(/[^0-9.\-]/g, '').trim()
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : 0
}

function toDecimal(v?: number | null): string | null {
    if (v == null || Number.isNaN(v)) return null
    return (Math.round(v * 100) / 100).toFixed(2)
}

function detectMaxDay(row: Record<string, unknown>): number {
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
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null }) as Record<string, unknown>[]
        if (!rows.length)
            return NextResponse.json({ error: 'No rows found in worksheet' }, { status: 400 })

        /* -------------------------- 3️⃣ Data Extraction -------------------------- */
        interface FactRow {
            code: string
            date: Date
            openingInventory: number
            procurementQty: number
            procurementPrice: string | null
            procurementAmount: string | null
            salesQty: number
            salesPrice: string | null
            salesAmount: string | null
        }

        const products: { code: string; name: string }[] = []
        const facts: FactRow[] = []

        for (const r of rows) {
            const code = String(r['ID'] ?? '').trim()
            const name = String(r['Product Name'] ?? '').trim()
            if (!code || !name) continue

            const maxDay = detectMaxDay(r)
            if (maxDay === 0) continue

            products.push({ code, name })

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const startDate = new Date(today)
            startDate.setDate(today.getDate() - (maxDay - 1))

            let currentInventory = parseFloat(String(r['Opening Inventory'] ?? '0')) || 0

            for (let d = 1; d <= maxDay; d++) {
                const pQty = parseFloat(String(r[`Procurement Qty (Day ${d})`] ?? '0')) || 0
                const pPrice = parseMoney(r[`Procurement Price (Day ${d})`])
                const sQty = parseFloat(String(r[`Sales Qty (Day ${d})`] ?? '0')) || 0
                const sPrice = parseMoney(r[`Sales Price (Day ${d})`])

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

                currentInventory = currentInventory + pQty - sQty
            }
        }

        if (!facts.length)
            return NextResponse.json({ error: 'No valid daily data found' }, { status: 400 })

        /* --------------------------- 4️⃣ Database Operations --------------------------- */
        // Step 1: Create batch (single query)
        const batch = await prisma.importBatch.create({
            data: { filename, userId: payload.id },
            select: { id: true },
        })

        // Step 2: Resolve all product IDs
        const uniqueCodes = Array.from(new Set(products.map((p) => p.code)))
        const existingProducts = await prisma.product.findMany({
            where: { productCode: { in: uniqueCodes } },
            select: { id: true, productCode: true },
        })

        const codeToId = new Map(existingProducts.map((p) => [p.productCode, p.id]))

        // Step 3: Insert missing products
        for (const p of products) {
            if (!codeToId.has(p.code)) {
                const newP = await prisma.product.create({
                    data: { productCode: p.code, name: p.name, uploadedBy: payload.id },
                    select: { id: true, productCode: true },
                })
                codeToId.set(newP.productCode, newP.id)
            }
        }

        // Step 4: Insert or update daily facts (independent atomic upserts)
        let imported = 0
        for (const f of facts) {
            const pid = codeToId.get(f.code)
            if (!pid) continue

            await prisma.dailyFact.upsert({
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

        /* --------------------------- 5️⃣ Response --------------------------- */
        return NextResponse.json({
            success: true,
            message: `✅ Imported ${imported} records successfully.`,
            imported,
            batchId: batch.id,
        })
    } catch (err) {
        console.error('❌ [UPLOAD ERROR]:', (err as Error).message)
        return NextResponse.json(
            { error: 'Internal server error', details: (err as Error).message },
            { status: 500 }
        )
    }
}
