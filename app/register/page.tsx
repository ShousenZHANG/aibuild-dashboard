'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('')

    useEffect(() => {
        if (!password) return setPasswordStrength('')
        if (password.length < 6) return setPasswordStrength('weak')
        if (/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return setPasswordStrength('strong')
        setPasswordStrength('medium')
    }, [password])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Invalid email format')
            setLoading(false)
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password }),
        })

        const data = await res.json()
        if (!res.ok) {
            setError(data.error || 'Registration failed')
            setLoading(false)
            return
        }

        router.push('/dashboard')
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg transition hover:shadow-xl">
                <h1 className="text-3xl font-semibold text-center mb-2 text-gray-800">
                    Create Your Account
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Join us and start exploring your dashboard
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full border rounded-lg p-2.5 outline-none transition ${
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                                    ? 'border-green-400 focus:ring-green-400'
                                    : 'border-gray-300 focus:ring-blue-400'
                            }`}
                            placeholder="you@example.com"
                        />
                        {email && (
                            <p
                                className={`text-xs mt-1 flex items-center gap-1 ${
                                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                                        ? 'text-green-600'
                                        : 'text-red-500'
                                }`}
                            >
                                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                                    ? (
                                        <>
                                            <CheckCircle2 size={14}/> Valid email format
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={14}/> Invalid email address
                                        </>
                                    )}
                            </p>
                        )}
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            minLength={2}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full border rounded-lg p-2.5 outline-none transition ${
                                username.length >= 2
                                    ? 'border-green-400 focus:ring-green-400'
                                    : 'border-gray-300 focus:ring-blue-400'
                            }`}
                            placeholder="Your username"
                        />
                        {username && (
                            <p
                                className={`text-xs mt-1 ${
                                    username.length >= 2 ? 'text-green-600' : 'text-red-500'
                                }`}
                            >
                                {username.length >= 2
                                    ? 'Username looks good ✅'
                                    : 'Must be at least 2 characters'}
                            </p>
                        )}
                    </div>

                    {/* Password */}
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

                        {password && (
                            <p
                                className={`text-xs mt-1 ${
                                    passwordStrength === 'weak'
                                        ? 'text-red-500'
                                        : passwordStrength === 'medium'
                                            ? 'text-yellow-500'
                                            : 'text-green-600'
                                }`}
                            >
                                {passwordStrength === 'weak'
                                    ? 'Weak password (min 6 characters)'
                                    : passwordStrength === 'medium'
                                        ? 'Medium strength (add numbers or uppercase letters)'
                                        : 'Strong password ✅'}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full border rounded-lg p-2.5 outline-none pr-10 ${
                                    confirmPassword
                                        ? password === confirmPassword
                                            ? 'border-green-400 focus:ring-green-400'
                                            : 'border-red-400 focus:ring-red-400'
                                        : 'border-gray-300 focus:ring-blue-400'
                                }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>

                        {confirmPassword && (
                            <p
                                className={`text-xs mt-1 ${
                                    password === confirmPassword ? 'text-green-600' : 'text-red-500'
                                }`}
                            >
                                {password === confirmPassword
                                    ? 'Passwords match ✅'
                                    : 'Passwords do not match'}
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="text-sm text-center text-red-500 bg-red-50 py-2 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4"/> Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600 mt-6">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="text-blue-600 hover:underline hover:text-blue-800 font-medium"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </main>
    )
}
