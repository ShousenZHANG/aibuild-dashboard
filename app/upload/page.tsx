'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { motion } from 'framer-motion'
import { UploadCloud } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // ✅ Parse Excel only for validation + row count
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setMessage(null)
    setRowCount(null)

    const f = e.target.files?.[0] || null
    setFile(f)
    if (!f) return

    try {
      const data = await f.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

      if (json.length === 0) {
        setError('❌ No data rows found in the file.')
        return
      }

      setRowCount(json.length)
      setMessage(`✅ File loaded successfully. ${json.length} rows detected.`)
    } catch (err) {
      console.error(err)
      setError('❌ Failed to parse the file. Please ensure it is a valid Excel (.xlsx/.xls).')
    }
  }

  // ✅ Upload file directly to backend (no pre-processing)
  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.')
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setMessage(`✅ Upload successful! Imported ${data.imported} rows.`)
      setTimeout(() => router.push('/dashboard'), 1000)
    } catch (err: any) {
      console.error('❌ Upload failed:', err)
      setError(err.message || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-6 md:p-10">
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto space-y-8"
        >
          {/* ------------------ Upload Section ------------------ */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-100">
            <h1 className="text-xl font-semibold text-gray-800 mb-4">Excel File Upload</h1>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <UploadCloud className="mx-auto text-blue-500 mb-3" size={48} />
              <p className="text-gray-700 font-medium">Drop your Excel file here</p>
              <p className="text-gray-500 text-sm mt-1">.xlsx or .xls • Max ~50MB</p>

              <div className="mt-5">
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="fileInput"
                />
                <label
                    htmlFor="fileInput"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium cursor-pointer transition"
                >
                  Choose File
                </label>
              </div>
            </div>

            <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Uploading…' : 'Upload File'}
            </button>

            {rowCount !== null && (
                <div className="mt-3 text-sm text-gray-600">
                  Detected <strong>{rowCount}</strong> rows in your file.
                </div>
            )}

            {error && <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            {message && <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{message}</div>}
          </div>

          {/* ------------------ File Format Guide ------------------ */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Expected File Format</h2>
            <p className="text-gray-600 text-sm mb-4">
              Your Excel file should contain the following columns:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Required Columns:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>ID (Product Code)</li>
                  <li>Product Name</li>
                  <li>Opening Inventory</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Daily Columns (Day 1, 2, 3...):</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Procurement Qty (Day X)</li>
                  <li>Procurement Price (Day X)</li>
                  <li>Sales Qty (Day X)</li>
                  <li>Sales Price (Day X)</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
  )
}
