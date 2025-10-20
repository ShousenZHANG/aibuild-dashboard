'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface Product {
    id: number
    productCode: string
    name: string
}

interface ProductSelectorProps {
    products: Product[]
    selectedProductIds: number[]
    onChange: (ids: number[]) => void
}

export function ProductSelector({
                                    products,
                                    selectedProductIds,
                                    onChange,
                                }: ProductSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const toggleProduct = (id: number) => {
        let next: number[]
        if (selectedProductIds.includes(id)) {
            next = selectedProductIds.filter((x) => x !== id)
        } else {
            if (selectedProductIds.length >= 3) {
                alert('⚠️ You can select up to 3 products.')
                return
            }
            next = [...selectedProductIds, id]
        }

        onChange(next)

        const params = new URLSearchParams(searchParams.toString())
        params.delete('productId')
        next.forEach((pid) => params.append('productId', pid.toString()))
        router.push(`/dashboard?${params.toString()}`)
    }

    return (
        <div ref={dropdownRef} className="relative w-full max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Select up to 3 products
            </label>

            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex justify-between items-center border border-gray-300 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
                {selectedProductIds.length === 0
                    ? 'Select products...'
                    : `${selectedProductIds.length} products selected`}
                <ChevronDown
                    size={16}
                    className={`ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                    {products.map((p) => {
                        const selected = selectedProductIds.includes(p.id)
                        const disabled = !selected && selectedProductIds.length >= 3
                        return (
                            <button
                                key={p.id}
                                disabled={disabled}
                                onClick={() => toggleProduct(p.id)}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition
                  ${
                                    selected
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : disabled
                                            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                                            : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                <span>
                  {p.name}{' '}
                    <span className="text-gray-400">({p.productCode})</span>
                </span>
                                {selected && <Check size={16} className="text-blue-600" />}
                            </button>
                        )
                    })}
                </div>
            )}

            {selectedProductIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {products
                        .filter((p) => selectedProductIds.includes(p.id))
                        .map((p) => (
                            <span
                                key={p.id}
                                className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-lg border border-gray-200 font-medium"
                            >
                {p.name} ({p.productCode})
              </span>
                        ))}
                </div>
            )}
        </div>
    )
}
