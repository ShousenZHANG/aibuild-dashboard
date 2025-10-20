import { cookies } from 'next/headers'
import { verifyToken, isTokenExpired } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
    try {
        const token = (await cookies()).get('auth_token')?.value
        if (!token) return null

        const payload = verifyToken(token)
        if (!payload || isTokenExpired(payload)) return null

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true, username: true, createdAt: true },
        })

        return user
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ getCurrentUser failed:', err)
        }
        return null
    }
}
