'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const isEmail = identifier.includes('@')
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password }),
        })

        const data = await res.json()
        if (!res.ok) {
            setError(data.error || 'Login failed')
            setLoading(false)
            return
        }

        router.push('/dashboard')
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg transition hover:shadow-xl">
                <h1 className="text-3xl font-semibold text-center mb-2 text-gray-800">Welcome Back</h1>
                <p className="text-center text-gray-500 mb-8">Sign in with your email or username</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email or Username
                        </label>
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className={`w-full border rounded-lg p-2.5 outline-none transition duration-150 ${
                                identifier
                                    ? isEmail
                                        ? validEmail
                                            ? 'border-green-400 focus:ring-green-400'
                                            : 'border-red-400 focus:ring-red-400'
                                        : 'border-blue-400 focus:ring-blue-400'
                                    : 'border-gray-300 focus:ring-blue-400'
                            }`}
                            placeholder="you@example.com or username"
                        />
                        {identifier && (
                            <p
                                className={`text-xs mt-1 transition ${
                                    isEmail
                                        ? validEmail
                                            ? 'text-green-600'
                                            : 'text-red-500'
                                        : 'text-blue-600'
                                }`}
                            >
                                {isEmail
                                    ? validEmail
                                        ? '✔ Valid email format'
                                        : '✖ Invalid email address'
                                    : 'Username login detected'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div
                            className="text-sm text-center text-red-500 bg-red-50 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4"/> Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600 mt-4">
                    Don’t have an account?{' '}
                    <Link href="/register" className="text-blue-600 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </main>
    )
}
