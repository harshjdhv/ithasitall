"use client"

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Scissors,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    X,
    Upload,
    ArrowLeft,
    FileText
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface PdfFile {
    file: File;
    name: string;
    size: string;
    pageCount: number;
}

export default function PdfSplitPage() {
    const [file, setFile] = useState<PdfFile | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [splitMode, setSplitMode] = useState<'all' | 'range'>('all')
    const [rangeInput, setRangeInput] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleFile = async (uploadedFile: File) => {
        setError(null)
        if (uploadedFile.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.')
            return
        }

        try {
            const arrayBuffer = await uploadedFile.arrayBuffer()
            const pdfDoc = await PDFDocument.load(arrayBuffer)

            setFile({
                file: uploadedFile,
                name: uploadedFile.name,
                size: formatSize(uploadedFile.size),
                pageCount: pdfDoc.getPageCount()
            })
        } catch (err) {
            console.error(err)
            setError('Could not load PDF. It might be corrupted or password protected.')
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const parseRange = (input: string, max: number): number[] => {
        const pages = new Set<number>()
        const parts = input.split(',')

        for (const part of parts) {
            const trimmed = part.trim()
            if (trimmed.includes('-')) {
                const rangeParts = trimmed.split('-').map(Number)
                if (rangeParts.length === 2) {
                    const start = rangeParts[0]!
                    const end = rangeParts[1]!
                    if (!isNaN(start) && !isNaN(end) && start <= end) {
                        for (let i = start; i <= end; i++) {
                            if (i >= 1 && i <= max) pages.add(i - 1)
                        }
                    }
                }
            } else {
                const num = Number(trimmed)
                if (!isNaN(num) && num >= 1 && num <= max) {
                    pages.add(num - 1)
                }
            }
        }
        return Array.from(pages).sort((a, b) => a - b)
    }

    const splitPdf = async () => {
        if (!file) return

        setIsProcessing(true)
        setError(null)

        try {
            const arrayBuffer = await file.file.arrayBuffer()
            const srcDoc = await PDFDocument.load(arrayBuffer)

            if (splitMode === 'all') {
                const JSZip = (await import('jszip')).default
                const zip = new JSZip()

                const indices = srcDoc.getPageIndices()
                for (const i of indices) {
                    const subDoc = await PDFDocument.create()
                    const [copiedPage] = await subDoc.copyPages(srcDoc, [i])
                    subDoc.addPage(copiedPage)
                    const pdfBytes = await subDoc.save()
                    zip.file(`${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`, pdfBytes)
                }

                const content = await zip.generateAsync({ type: 'blob' })
                const url = URL.createObjectURL(content)
                const link = document.createElement('a')
                link.href = url
                link.download = `${file.name.replace('.pdf', '')}_split.zip`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)

            } else {
                // Range extraction
                const pageIndices = parseRange(rangeInput, file.pageCount)

                if (pageIndices.length === 0) {
                    setError('Invalid page range or no pages selected.')
                    setIsProcessing(false)
                    return
                }

                const subDoc = await PDFDocument.create()
                const copiedPages = await subDoc.copyPages(srcDoc, pageIndices)
                copiedPages.forEach(page => subDoc.addPage(page))

                const pdfBytes = await subDoc.save()
                const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)

                const link = document.createElement('a')
                link.href = url
                link.download = `${file.name.replace('.pdf', '')}_extracted.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            }

        } catch (err) {
            console.error(err)
            setError('An error occurred while splitting the PDF.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Back Navigation */}
            <div className="max-w-3xl mx-auto mb-6">
                <Link
                    href="/tools"
                    className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tools
                </Link>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">

                {/* Navigation & Header */}
                <div className="space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 text-red-500 mb-2">
                            <Scissors className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Split PDF
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Extract pages from your PDF or save each page as a separate file.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Toolbar / Header within card */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            {file ? '1 file selected' : 'No file selected'}
                        </div>
                        {file && (
                            <button
                                onClick={() => { setFile(null); setSplitMode('all'); setRangeInput(''); }}
                                className="text-xs px-3 py-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                            >
                                Remove File
                            </button>
                        )}
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className="relative group cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-200 ease-out flex flex-col items-center justify-center gap-4 py-8 px-4"
                            >
                                <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-base font-semibold text-neutral-900 dark:text-white">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        PDF files only
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* File Info */}
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                    <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center shrink-0">
                                        <FileIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{file.name}</p>
                                        <p className="text-sm text-neutral-500">{file.pageCount} pages</p>
                                    </div>
                                </div>

                                {/* Split Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSplitMode('all')}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                                            splitMode === 'all'
                                                ? "border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                                                : "border-neutral-200 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-800"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", splitMode === 'all' ? "bg-red-200 dark:bg-red-800/30" : "bg-neutral-100 dark:bg-neutral-800")}>
                                            <Scissors className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Extract All Pages</p>
                                            <p className="text-xs opacity-70 mt-1">Save each page as a separate PDF</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setSplitMode('range')}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-center",
                                            splitMode === 'range'
                                                ? "border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                                                : "border-neutral-200 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-800"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", splitMode === 'range' ? "bg-red-200 dark:bg-red-800/30" : "bg-neutral-100 dark:bg-neutral-800")}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Select Range</p>
                                            <p className="text-xs opacity-70 mt-1">Extract specific pages (e.g. 1-5, 8)</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Range Input */}
                                <AnimatePresence>
                                    {splitMode === 'range' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    Page Range
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rangeInput}
                                                    onChange={(e) => setRangeInput(e.target.value)}
                                                    placeholder={`e.g. 1-5, 8, 11-${file.pageCount}`}
                                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                                                />
                                                <p className="text-xs text-neutral-500">
                                                    Enter page numbers and/or ranges separated by commas.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Button */}
                                <button
                                    onClick={splitPdf}
                                    disabled={isProcessing || (splitMode === 'range' && !rangeInput)}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                                        isProcessing || (splitMode === 'range' && !rangeInput)
                                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 active:scale-[0.98]"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            {splitMode === 'all' ? 'Split All Pages' : 'Extract Range'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
