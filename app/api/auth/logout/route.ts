import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        })

        response.cookies.set({
            name: 'auth_token',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        })

        return response
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ Logout Error:', err)
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET() {
    return POST()
}
