"use client"

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { Reorder } from 'framer-motion'
import { PDFDocument } from 'pdf-lib'
import {
    ArrowLeftRight,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    GripVertical,
    Upload,
    ArrowLeft,
    RotateCw,
    Trash2
} from 'lucide-react'
import { cn } from "@/lib/utils"

// Helper to get pdfjs-dist dynamically (client-side only)
const getPdfJs = async () => {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    return pdfjsLib
}

interface PageItem {
    id: string;
    originalIndex: number;
    thumbnail: string;
}

export default function PdfReorderPage() {
    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<PageItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFile = async (uploadedFile: File) => {
        setError(null)
        setPages([])
        if (uploadedFile.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.')
            return
        }

        setFile(uploadedFile)
        setIsProcessing(true)

        try {
            const pdfjsLib = await getPdfJs()
            const arrayBuffer = await uploadedFile.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise

            const newPages: PageItem[] = []

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale: 0.2 }) // Low scale for thumbnail
                const canvas = document.createElement('canvas')
                const context = canvas.getContext('2d')

                canvas.height = viewport.height
                canvas.width = viewport.width

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    } as any).promise

                    newPages.push({
                        id: `page-${i}`,
                        originalIndex: i - 1,
                        thumbnail: canvas.toDataURL()
                    })
                }
            }
            setPages(newPages)
        } catch (err) {
            console.error(err)
            setError('Could not load PDF pages. The file might be corrupted.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const savePdf = async () => {
        if (!file || pages.length === 0) return

        setIsProcessing(true)
        setError(null)

        try {
            const arrayBuffer = await file.arrayBuffer()
            const srcDoc = await PDFDocument.load(arrayBuffer)
            const newDoc = await PDFDocument.create()

            const copyIndices = pages.map(p => p.originalIndex)
            const copiedPages = await newDoc.copyPages(srcDoc, copyIndices)

            copiedPages.forEach(page => newDoc.addPage(page))

            const pdfBytes = await newDoc.save()
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `${file.name.replace('.pdf', '')}_reordered.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

        } catch (err) {
            console.error(err)
            setError('An error occurred while saving the PDF.')
        } finally {
            setIsProcessing(false)
        }
    }

    // Custom CSS for reorder grid which needs to break out of flex/grid standard slightly for Reorder to work smoothly
    // We'll use a flex wrap approach for the list

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
                            <ArrowLeftRight className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Reorder PDF Pages
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Drag and drop thumbnails to rearrange pages in your PDF document.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Toolbar / Header within card */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            {file ? `${pages.length} pages loaded` : 'No file selected'}
                        </div>
                        {file && (
                            <button
                                onClick={() => { setFile(null); setPages([]); }}
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
                                {/* Grid */}
                                {pages.length > 0 && (
                                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        <Reorder.Group
                                            axis="y"
                                            onReorder={setPages}
                                            values={pages}
                                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                                            as="ul"
                                        >
                                            {pages.map((page, index) => (
                                                <Reorder.Item
                                                    key={page.id}
                                                    value={page}
                                                    className="relative group cursor-grab active:cursor-grabbing list-none"
                                                >
                                                    <div className="aspect-[1/1.4] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden relative shadow-sm group-hover:border-red-400 group-hover:shadow-md transition-all">
                                                        <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-black/50 text-white text-xs rounded-full z-10 font-bold backdrop-blur-sm">
                                                            {index + 1}
                                                        </span>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={page.thumbnail} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain p-2" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <div className="p-2 bg-white rounded-full shadow-lg">
                                                                <GripVertical className="text-neutral-600 w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    </div>
                                )}

                                {isProcessing && pages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-neutral-500 gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                                        <p>Rendering pages...</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={savePdf}
                                        disabled={isProcessing || pages.length === 0}
                                        className={cn(
                                            "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                                            isProcessing || pages.length === 0
                                                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 active:scale-[0.98]"
                                        )}
                                    >
                                        {isProcessing && pages.length > 0 ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Save Reordered PDF
                                            </>
                                        )}
                                    </button>
                                </div>
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
