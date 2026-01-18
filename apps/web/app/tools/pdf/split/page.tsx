"use client"

import React, { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Scissors,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    X
} from 'lucide-react'

interface PdfFile {
    file: File;
    name: string;
    size: string;
    pageCount: number;
}

export default function PdfSplitPage() {
    const [file, setFile] = useState<PdfFile | null>(null)
    const [isDragging, setIsDragging] = useState(false)
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
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
                // Create a Zip (need JSZip, assuming global or dynamic import if strictly no other lib allowed but user has pdf-lib)
                // Wait, the user has jszip installed now.
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
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Split PDF
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Extract pages from your PDF files or split them into individual documents.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Upload Area */}
                    <div className="space-y-4">
                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                  relative group cursor-pointer
                  border border-dashed rounded-lg h-64
                  flex flex-col items-center justify-center gap-4
                  transition-colors duration-200 ease-out
                  ${isDragging
                                        ? 'border-primary bg-muted'
                                        : 'border-border hover:border-sidebar-ring bg-transparent hover:bg-muted/50'
                                    }
                `}
                            >
                                <div className={`
                  p-3 rounded-md transition-colors duration-200
                  ${isDragging ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'}
                `}>
                                    <Scissors className="w-5 h-5" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-medium text-foreground">Click or drop specific PDF here</p>
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
                            <div className="p-6 rounded-lg border border-border bg-muted/20 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded text-foreground">
                                            <FileIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{file.pageCount} pages • {file.size}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFile(null); setRangeInput('') }}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/10 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Options & Actions */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Split Options</h3>

                            <div className="grid gap-4">
                                <label className={`
                    flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all
                    ${splitMode === 'all'
                                        ? 'bg-muted border-primary/50'
                                        : 'bg-transparent border-border hover:border-sidebar-ring'
                                    }
                 `}>
                                    <input
                                        type="radio"
                                        name="splitMode"
                                        className="hidden"
                                        checked={splitMode === 'all'}
                                        onChange={() => setSplitMode('all')}
                                    />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${splitMode === 'all' ? 'border-primary' : 'border-muted-foreground'}`}>
                                        {splitMode === 'all' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-foreground">Extract every page</span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">Save each page as a separate PDF file (ZIP)</span>
                                    </div>
                                </label>

                                <label className={`
                    flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all
                    ${splitMode === 'range'
                                        ? 'bg-muted border-primary/50'
                                        : 'bg-transparent border-border hover:border-sidebar-ring'
                                    }
                 `}>
                                    <input
                                        type="radio"
                                        name="splitMode"
                                        className="hidden"
                                        checked={splitMode === 'range'}
                                        onChange={() => setSplitMode('range')}
                                    />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${splitMode === 'range' ? 'border-primary' : 'border-muted-foreground'}`}>
                                        {splitMode === 'range' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-foreground">Select pages</span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">Extract specific pages or ranges to a new PDF</span>
                                    </div>
                                </label>
                            </div>

                            {splitMode === 'range' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-2"
                                >
                                    <label className="block text-xs text-muted-foreground mb-2">Pages to extract (e.g. 1, 3-5, 8)</label>
                                    <input
                                        type="text"
                                        value={rangeInput}
                                        onChange={(e) => setRangeInput(e.target.value)}
                                        placeholder={`1-${file?.pageCount || 5}`}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border">
                            <button
                                onClick={splitPdf}
                                disabled={!file || isProcessing || (splitMode === 'range' && !rangeInput)}
                                className={`
                    w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2
                    transition-all duration-200
                    ${!file || isProcessing || (splitMode === 'range' && !rangeInput)
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    }
                  `}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        {splitMode === 'all' ? 'Download ZIP' : 'Download PDF'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
