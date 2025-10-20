import jwt, {
    JwtPayload as DefaultJwtPayload,
    Secret,
    SignOptions,
    TokenExpiredError,
    JsonWebTokenError,
} from 'jsonwebtoken'

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret'

export interface JwtPayload extends DefaultJwtPayload {
    id: number
    email: string
}

export function signToken(
    payload: JwtPayload,
    expiresIn: SignOptions['expiresIn'] = '8h',
): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            console.warn('⚠️ Token expired.')
        } else if (err instanceof JsonWebTokenError) {
            console.warn('⚠️ Invalid token.')
        } else {
            console.error('❌ Unknown JWT error:', err)
        }
        return null
    }
}

export function isTokenExpired(payload: JwtPayload): boolean {
    if (!payload?.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
}
