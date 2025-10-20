'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Upload, Database, Clock } from 'lucide-react'
import { ChartPanel } from '@/components/dashboard/ChartPanel'
import { ProductSelector } from '@/components/dashboard/ProductSelector'
import { ProductComparison } from '@/components/dashboard/ProductComparison'

/* ------------------------------- Interfaces ------------------------------- */
interface Product {
    id: number
    productCode: string
    name: string
}

interface ChartDataPoint {
    date: string
    inventory: number
    procurementAmount: number
    salesAmount: number
    salesQty: number
}

interface ProductSeries {
    productId: number
    productName: string
    productCode: string
    data: ChartDataPoint[]
}

/* ----------------------------- Main Component ----------------------------- */
export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ products: 0, imports: 0, lastImport: null })
    const [products, setProducts] = useState<Product[]>([])
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [productSeries, setProductSeries] = useState<ProductSeries[]>([])

    /* --------------------------------------------------------------------------
     * 1️⃣ Fetch current user info & dashboard statistics
     * -------------------------------------------------------------------------- */
    useEffect(() => {
        const fetchUserAndStats = async () => {
            try {
                const res = await fetch('/api/auth/me')
                if (!res.ok) return router.push('/login')

                const data = await res.json()
                setUser(data.user)
                setStats({
                    products: data.stats?.productCount || 0,
                    imports: data.stats?.importCount || 0,
                    lastImport: data.stats?.lastImport || null,
                })
            } catch {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }
        fetchUserAndStats()
    }, [router])

    /* --------------------------------------------------------------------------
     * 2️⃣ Load all available products and default data (only once on mount)
     * -------------------------------------------------------------------------- */
    useEffect(() => {
        const loadAllData = async () => {
            const res = await fetch('/api/data')
            if (!res.ok) return
            const json = await res.json()
            setProducts(json.products)
            setProductSeries(buildSeries(json.products, json.data, selectedIds))
        }
        loadAllData()
    }, [])

    /* --------------------------------------------------------------------------
     * 3️⃣ Fetch and rebuild chart data dynamically when product selection changes
     *    (no page reload → smoother UX)
     * -------------------------------------------------------------------------- */
    useEffect(() => {
        const fetchData = async () => {
            if (selectedIds.length === 0) {
                setProductSeries([])
                return
            }

            const params = new URLSearchParams()
            selectedIds.forEach((id) => params.append('productId', id.toString()))
            const res = await fetch(`/api/data?${params.toString()}`)
            if (!res.ok) return

            const json = await res.json()
            const series = buildSeries(json.products, json.data, selectedIds)
            setProductSeries(series)
        }
        fetchData()
    }, [selectedIds])

    /* --------------------------------------------------------------------------
     * 4️⃣ Utility: Build structured data for chart rendering
     * -------------------------------------------------------------------------- */
    const buildSeries = (products: Product[], data: any[], ids: number[]): ProductSeries[] => {
        const map = new Map(products.map((p) => [p.id, p]))
        return ids.map((id) => {
            const product = map.get(id)
            const records = data.filter((d) => d.productId === id)
            return {
                productId: id,
                productName: product?.name || `Product ${id}`,
                productCode: product?.productCode || `P${id}`,
                data: records.map((d) => ({
                    date: new Date(d.date).toLocaleDateString('en-AU', {
                        month: 'short',
                        day: 'numeric',
                    }),
                    inventory: d.openingInventory ?? 0,
                    procurementAmount: d.procurementAmount ?? 0,
                    salesAmount: d.salesAmount ?? 0,
                    salesQty: d.salesQty ?? 0,
                })),
            }
        })
    }

    /* --------------------------------------------------------------------------
     * 5️⃣ Build summary comparison data using real salesQty field
     *     - Revenue = Σ salesAmount
     *     - Units Sold = Σ salesQty
     *     - Avg Price = Revenue / Units Sold
     *     - Net Amount = Revenue - Procurement
     * -------------------------------------------------------------------------- */
    const buildComparisonData = () => {
        return productSeries.map((p) => {
            const totalRevenue = p.data.reduce((sum, d) => sum + (d.salesAmount || 0), 0)
            const totalProcurement = p.data.reduce((sum, d) => sum + (d.procurementAmount || 0), 0)
            const totalUnits = p.data.reduce((sum, d) => sum + (d.salesQty || 0), 0)
            const avgPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0
            const lastInventory = p.data[p.data.length - 1]?.inventory ?? 0
            const netAmount = totalRevenue - totalProcurement

            return {
                name: p.productName,
                code: p.productCode,
                revenue: totalRevenue,
                unitsSold: totalUnits,
                avgPrice: avgPrice.toFixed(2),
                inventory: lastInventory,
                netAmount,
            }
        })
    }

    /* --------------------------------------------------------------------------
     * 6️⃣ Logout handler
     * -------------------------------------------------------------------------- */
    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    /* --------------------------------------------------------------------------
     * 7️⃣ Loading state
     * -------------------------------------------------------------------------- */
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Loading...
            </div>
        )

    const greeting =
        new Date().getHours() < 12
            ? 'Good morning'
            : new Date().getHours() < 18
                ? 'Good afternoon'
                : 'Good evening'

    /* --------------------------------------------------------------------------
     * 8️⃣ Render dashboard layout
     * -------------------------------------------------------------------------- */
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 p-6 md:p-10">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="max-w-7xl mx-auto"
            >
                {/* ------------------------- Header Section ------------------------- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
                            {greeting},{' '}
                            <span className="text-blue-600 font-semibold">{user?.username}</span> 👋
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Here’s a summary of your recent uploads and data trends.
                        </p>
                    </div>

                    {/* ----------------------- Action Buttons ------------------------ */}
                    <div className="flex flex-wrap justify-end gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/upload')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg font-medium"
                        >
                            <Upload size={18} /> Import Excel Data
                        </motion.button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm active:scale-[0.97]"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>

                {/* ---------------------- Statistic Overview ----------------------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-700">
                    <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                        <div className="flex items-center gap-2 text-blue-600 font-semibold">
                            <Database size={18} /> Total Products
                        </div>
                        <p className="text-2xl font-bold mt-1">{stats.products}</p>
                    </div>

                    <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <Upload size={18} /> Import Batches
                        </div>
                        <p className="text-2xl font-bold mt-1">{stats.imports}</p>
                    </div>

                    <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                            <Clock size={18} /> Last Import
                        </div>
                        <p className="text-base mt-1">
                            {stats.lastImport
                                ? new Date(stats.lastImport).toLocaleString('en-AU', {
                                    timeZone: 'Australia/Sydney',
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })
                                : 'No imports yet'}
                        </p>
                    </div>
                </div>

                {/* --------------------- Product Selector -------------------------- */}
                <div className="mt-10 bg-white/80 border border-gray-100 rounded-2xl shadow-sm p-6">
                    <ProductSelector
                        products={products}
                        selectedProductIds={selectedIds}
                        onChange={setSelectedIds}
                    />
                </div>

                {/* --------------------- Chart Visualization ----------------------- */}
                <ChartPanel productSeries={productSeries} />

                {/* ---------------------- Product Comparison ----------------------- */}
                <ProductComparison summaries={buildComparisonData()} />
            </motion.div>
        </main>
    )
}
