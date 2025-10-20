import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ProgressBar from '@/components/progress-bar'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
    display: 'swap',
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        default: 'Data Dashboard',
        template: '%s | Data Dashboard',
    },
    description: 'Visualize procurement, sales, and inventory data intuitively.',
    icons: { icon: '/favicon.ico' },
    authors: [{ name: 'Data Team' }],
    keywords: ['Next.js', 'Prisma', 'Data Visualization', 'Dashboard', 'Data', 'Retail Analytics'],
    openGraph: {
        title: 'Data Dashboard',
        description: 'Smart data visualization platform for procurement and sales insights.',
        url: 'https://Data-dashboard.vercel.app',
        siteName: 'Data Dashboard',
        locale: 'en_US',
        type: 'website',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-gray-800`}>
        <ProgressBar />

        <div className="flex flex-col min-h-screen">{children}</div>

        <footer className="mt-auto text-center py-4 text-xs text-gray-500">
            © {new Date().getFullYear()} Data Pty Ltd — All rights reserved.
        </footer>
        </body>
        </html>
    )
}
