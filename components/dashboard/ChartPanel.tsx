'use client'

import React, { useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Layers, Package, ShoppingCart } from 'lucide-react'

interface ChartDataPoint {
    date: string
    inventory: number
    procurementAmount: number
    salesAmount: number
}

interface ProductSeries {
    productId: number
    productName: string
    productCode: string
    data: ChartDataPoint[]
}

interface ChartPanelProps {
    productSeries: ProductSeries[]
}

const PALETTE = [
    '#2563EB', '#16A34A', '#F97316', '#8B5CF6', '#EC4899', '#0EA5E9'
]

function CustomTooltip({
                           active,
                           payload,
                           label,
                       }: {
    active?: boolean
    payload?: any[]
    label?: string
}) {
    if (!active || !payload || payload.length === 0) return null

    const grouped: Record<string, any[]> = {}
    payload.forEach((item) => {
        const productName = item.name.split(' - ')[0] // e.g. "BLACK RASPBERRY WINE 375ML"
        if (!grouped[productName]) grouped[productName] = []
        grouped[productName].push(item)
    })

    const metricOrder = ['Inventory', 'Procurement', 'Sales']

    return (
        <div className="rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg min-w-[240px]">
            <div className="mb-2 text-sm font-semibold text-gray-800">{label}</div>
            <div className="space-y-3">
                {Object.entries(grouped).map(([product, items], idx) => {
                    const color = items[0]?.color ?? '#2563eb'

                    const sortedItems = items.sort((a, b) => {
                        const aType = a.name.split(' - ')[1]
                        const bType = b.name.split(' - ')[1]
                        return metricOrder.indexOf(aType) - metricOrder.indexOf(bType)
                    })

                    return (
                        <div key={idx} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                            <div className="flex items-center gap-2 mb-1">
                <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                />
                                <span className="font-medium text-gray-800 text-sm">{product}</span>
                            </div>

                            <div className="ml-5 space-y-0.5 text-sm">
                                {sortedItems.map((item, i) => {
                                    const type = item.name.split(' - ')[1]
                                    const isAmount =
                                        type.toLowerCase().includes('procurement') ||
                                        type.toLowerCase().includes('sales')
                                    const formatted = isAmount
                                        ? `$${Number(item.value ?? 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}`
                                        : `${item.value?.toLocaleString() ?? 0} units`

                                    return (
                                        <div key={i} className="flex justify-between text-gray-700">
                                            <span className="text-gray-600">{type}:</span>
                                            <span className="font-medium text-gray-900">{formatted}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function ChartPanel({ productSeries }: ChartPanelProps) {
    const [activeMetrics, setActiveMetrics] = useState<string[]>([
        'Inventory',
        'Procurement',
        'Sales',
    ])

    if (!productSeries || productSeries.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-gray-400">
                No chart data available
            </div>
        )
    }

    const allDates = new Set<string>()
    productSeries.forEach((s) => s.data.forEach((d) => allDates.add(d.date)))
    const sortedDates = Array.from(allDates).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )

    const unifiedData = sortedDates.map((date) => {
        const row: Record<string, any> = { date }
        productSeries.forEach((series) => {
            const point = series.data.find((p) => p.date === date)
            row[`${series.productCode}_inventory`] = point?.inventory ?? null
            row[`${series.productCode}_procurement`] = point?.procurementAmount ?? null
            row[`${series.productCode}_sales`] = point?.salesAmount ?? null
        })
        return row
    })

    const toggleMetric = (metric: string) => {
        setActiveMetrics((prev) =>
            prev.includes(metric)
                ? prev.filter((m) => m !== metric)
                : [...prev, metric]
        )
    }

    const colorForProduct = (index: number) => PALETTE[index % PALETTE.length]

    return (
        <div className="w-full mt-10 rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-md p-6 shadow-lg transition hover:shadow-xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-800 flex items-center gap-2">
                📊 Product Data Comparison
            </h2>

            <div className="flex justify-center gap-3 mb-8 flex-wrap">
                {[
                    { name: 'Inventory', icon: Layers },
                    { name: 'Procurement', icon: Package },
                    { name: 'Sales', icon: ShoppingCart },
                ].map(({ name, icon: Icon }) => {
                    const active = activeMetrics.includes(name)
                    const colorClass =
                        name === 'Inventory'
                            ? 'blue'
                            : name === 'Procurement'
                                ? 'green'
                                : 'orange'
                    return (
                        <button
                            key={name}
                            onClick={() => toggleMetric(name)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border shadow-sm transition-all duration-200
              ${
                                active
                                    ? `bg-${colorClass}-100 text-${colorClass}-700 border-${colorClass}-300`
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Icon size={14} />
                            {name === 'Procurement'
                                ? 'Procurement Amount'
                                : name === 'Sales'
                                    ? 'Sales Amount'
                                    : name}
                        </button>
                    )
                })}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white via-gray-50 to-gray-100 p-4 shadow-inner">
                <ResponsiveContainer width="100%" height={420}>
                    <LineChart
                        data={unifiedData}
                        margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={false}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} />

                        <Tooltip content={<CustomTooltip />} />

                        {productSeries.map((series, i) => {
                            const color = colorForProduct(i)
                            return (
                                <React.Fragment key={series.productCode}>
                                    {activeMetrics.includes('Inventory') && (
                                        <Line
                                            type="monotone"
                                            dataKey={`${series.productCode}_inventory`}
                                            name={`${series.productName} - Inventory`}
                                            stroke={color}
                                            strokeWidth={2.2}
                                            dot={false}
                                        />
                                    )}
                                    {activeMetrics.includes('Procurement') && (
                                        <Line
                                            type="linear"
                                            dataKey={`${series.productCode}_procurement`}
                                            name={`${series.productName} - Procurement`}
                                            stroke={color}
                                            strokeDasharray="6 4"
                                            strokeWidth={2.5}
                                            dot={false}
                                        />
                                    )}
                                    {activeMetrics.includes('Sales') && (
                                        <Line
                                            type="natural"
                                            dataKey={`${series.productCode}_sales`}
                                            name={`${series.productName} - Sales`}
                                            stroke={color}
                                            strokeWidth={2.8}
                                            dot={{ r: 3.5, strokeWidth: 1 }}
                                            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {productSeries.map((series, i) => {
                    const color = colorForProduct(i)
                    return (
                        <div
                            key={series.productCode}
                            className="border border-gray-200 rounded-2xl p-4 bg-white/90 shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex justify-between text-sm font-semibold text-gray-800 mb-3">
                                <span>{series.productName}</span>
                                <span className="text-gray-400">{series.productCode}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-gray-600">
                                {activeMetrics.includes('Inventory') && (
                                    <div className="flex items-center gap-2">
                    <span
                        className="h-[3px] w-5 rounded-full"
                        style={{ backgroundColor: color }}
                    ></span>
                                        Inventory
                                    </div>
                                )}
                                {activeMetrics.includes('Procurement') && (
                                    <div className="flex items-center gap-2">
                    <span
                        className="h-[3px] w-5 rounded-full border-t-2 border-dashed"
                        style={{ borderColor: color }}
                    ></span>
                                        Procurement Amount
                                    </div>
                                )}
                                {activeMetrics.includes('Sales') && (
                                    <div className="flex items-center gap-2">
                    <span
                        className="h-[5px] w-5 rounded-full"
                        style={{ backgroundColor: color }}
                    ></span>
                                        Sales Amount
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
