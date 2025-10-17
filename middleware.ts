import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function middleware(req: { nextUrl: { pathname: string }; cookies: { get: (arg0: string) => { (): any; new(): any; value: any } }; url: string | URL | undefined }) {
    const protectedRoutes = ['/upload', '/dashboard']
    const isProtected = protectedRoutes.some((p) => req.nextUrl.pathname.startsWith(p))

    if (!isProtected) return NextResponse.next()

    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    try {
        verify(token, JWT_SECRET)
        return NextResponse.next()
    } catch {
        return NextResponse.redirect(new URL('/login', req.url))
    }
}
