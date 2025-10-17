import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { email, password, username } = await req.json()
    const hash = await bcrypt.hash(password, 10)

    try {
        await prisma.user.create({
            data: { email, password: hash, username },
        })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
}
