import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { signToken } from '@/lib/jwt'

const loginSchema = z.object({
    identifier: z
        .string()
        .min(3, 'Enter your email or username'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = loginSchema.safeParse(body)

        if (!parsed.success) {
            const message = parsed.error.issues[0].message
            return NextResponse.json({ error: message }, { status: 422 })
        }

        const { identifier, password } = parsed.data
        const isEmail = identifier.includes('@')

        const user = await prisma.user.findFirst({
            where: isEmail
                ? { email: identifier.trim().toLowerCase() }
                : { username: identifier.trim() },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const token = signToken({ id: user.id, email: user.email })

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        })

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 8,
        })

        return response
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ Login Error:', err)
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
