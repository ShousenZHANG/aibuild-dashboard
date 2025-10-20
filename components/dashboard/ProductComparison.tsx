'use client'

interface ProductSummary {
    name: string
    code: string
    revenue: number
    unitsSold: number
    avgPrice: string
    inventory: number
    netAmount: number
}

interface ProductComparisonProps {
    summaries: ProductSummary[]
}

export function ProductComparison({ summaries }: ProductComparisonProps) {
    if (!summaries || summaries.length === 0)
        return (
            <div className="flex justify-center py-10 text-gray-400">
                No products selected for comparison.
            </div>
        )

    return (
        <div className="mt-10 bg-white/90 border border-gray-100 rounded-3xl shadow-sm p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                📊 Product Comparison Overview
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2 text-sm text-gray-700">
                    <thead>
                    <tr className="text-left bg-gray-50">
                        <th className="py-3 px-4 rounded-l-lg">Product</th>
                        <th className="py-3 px-4">Revenue</th>
                        <th className="py-3 px-4">Units Sold</th>
                        <th className="py-3 px-4">Avg. Price</th>
                        <th className="py-3 px-4">Inventory</th>
                        <th className="py-3 px-4 text-right rounded-r-lg">Net Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    {summaries.map((s, i) => (
                        <tr
                            key={i}
                            className="bg-white hover:bg-blue-50 transition rounded-xl shadow-sm"
                        >
                            <td className="py-3 px-4 font-semibold">
                                <div>{s.name}</div>
                                <div className="text-gray-400 text-xs">{s.code}</div>
                            </td>
                            <td className="py-3 px-4">${s.revenue.toLocaleString()}</td>
                            <td className="py-3 px-4">{s.unitsSold}</td>
                            <td className="py-3 px-4">${s.avgPrice}</td>
                            <td className="py-3 px-4">{s.inventory}</td>
                            <td
                                className={`py-3 px-4 text-right font-semibold ${
                                    s.netAmount < 0
                                        ? 'text-red-600'
                                        : s.netAmount > 0
                                            ? 'text-green-600'
                                            : 'text-gray-500'
                                }`}
                            >
                                {s.netAmount < 0 ? '-' : '+'}${Math.abs(s.netAmount).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
