import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const protectedRoutes = ['/upload', '/dashboard']

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    const isProtected = protectedRoutes.some((p) => pathname.startsWith(p))

    if (!isProtected) return NextResponse.next()

    const token = req.cookies.get('auth_token')?.value

    if (!token) {
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
    }

    try {
        verify(token, JWT_SECRET)
        return NextResponse.next()
    } catch (error) {
        console.error('Invalid or expired token:', error)
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
    }
}

export const config = {
    matcher: ['/dashboard/:path*', '/upload/:path*'],
    runtime: 'nodejs',
}
