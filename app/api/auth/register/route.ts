import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signToken } from '@/lib/jwt'

const registerSchema = z.object({
    email: z.email('Invalid email format'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password too long'),
    username: z.string().min(2, 'Username too short').max(50, 'Username too long'),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = registerSchema.safeParse(body)
        if (!parsed.success) {
            const message = parsed.error.issues[0].message
            return NextResponse.json({ error: message }, { status: 422 })
        }

        const { email, password, username } = parsed.data
        const normalizedEmail = email.trim().toLowerCase()

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                username,
                password: hashedPassword,
            },
        })

        const token = signToken({ id: user.id, email: user.email })

        const response = NextResponse.json({
            success: true,
            message: 'Account created and logged in successfully',
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
    } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ Register Error:', err)
        }

        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
