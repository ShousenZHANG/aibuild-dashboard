import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const token = (await cookies()).get('auth_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true, username: true },
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const [productCount, importCount, lastImport] = await Promise.all([
            prisma.product.count({ where: { uploadedBy: user.id } }),
            prisma.importBatch.count({ where: { userId: user.id } }),
            prisma.importBatch.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            }),
        ])

        return NextResponse.json({
            user,
            stats: {
                productCount,
                importCount,
                lastImport: lastImport?.createdAt ?? null,
            },
        })
    } catch (err) {
        console.error('❌ Error fetching user info:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
