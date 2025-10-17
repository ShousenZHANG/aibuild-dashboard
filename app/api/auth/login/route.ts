import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function POST(req: Request) {
    const { email, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })

    const response = NextResponse.json({ success: true })
    response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 8,
    })

    return response
}
