import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

/**
 * GET /api/data
 * Fetch full product data (daily facts) for the authenticated user.
 * Supports optional filtering by product IDs.
 *
 * Query parameters:
 *   - productId (repeatable): one or more product IDs to filter by
 */
export async function GET(req: Request) {
  try {
    /* -------------------------- 1️⃣ Authentication -------------------------- */
    const token = (await cookies()).get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    /* -------------------------- 2️⃣ Parse query params -------------------------- */
    const url = new URL(req.url)
    const productIds = url.searchParams
        .getAll('productId')
        .map(Number)
        .filter(Number.isFinite)

    /* -------------------------- 3️⃣ Fetch user's uploaded products -------------------------- */
    const products = await prisma.product.findMany({
      where: {
        uploadedBy: payload.id,
        ...(productIds.length ? { id: { in: productIds } } : {}),
      },
      select: { id: true, name: true, productCode: true },
      orderBy: { name: 'asc' },
    })

    if (!products.length) {
      return NextResponse.json({ products: [], data: [] })
    }

    const productIdsToQuery = products.map((p) => p.id)

    /* -------------------------- 4️⃣ Fetch ALL daily facts -------------------------- */
    const facts = await prisma.dailyFact.findMany({
      where: {
        productIdRef: { in: productIdsToQuery },
      },
      orderBy: [{ date: 'asc' }, { productIdRef: 'asc' }],
      select: {
        productIdRef: true,
        date: true,
        openingInventory: true,
        procurementQty: true,
        procurementPrice: true,
        procurementAmount: true,
        salesQty: true,
        salesPrice: true,
        salesAmount: true,
      },
    })

    /* -------------------------- 5️⃣ Transform result for chart -------------------------- */
    const nameMap = new Map(products.map((p) => [p.id, p.name]))

    const data = facts.map((f) => ({
      productId: f.productIdRef,
      productName: nameMap.get(f.productIdRef) ?? `Product ${f.productIdRef}`,
      date: f.date,
      openingInventory: f.openingInventory ?? 0,
      procurementQty: f.procurementQty ?? 0,
      procurementPrice: Number(f.procurementPrice ?? 0),
      procurementAmount:
          f.procurementAmount != null
              ? Number(f.procurementAmount)
              : (f.procurementQty ?? 0) * Number(f.procurementPrice ?? 0),
      salesQty: f.salesQty ?? 0,
      salesPrice: Number(f.salesPrice ?? 0),
      salesAmount:
          f.salesAmount != null
              ? Number(f.salesAmount)
              : (f.salesQty ?? 0) * Number(f.salesPrice ?? 0),
    }))

    /* -------------------------- 6️⃣ Return response -------------------------- */
    return NextResponse.json({ products, data })
  } catch (err: any) {
    console.error('❌ [DATA] Error:', err?.message || err)
    return NextResponse.json(
        { error: 'Internal server error', details: err?.message },
        { status: 500 }
    )
  }
}
