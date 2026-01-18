"use client"

import React, { useState, useRef } from 'react'
import { Reorder } from 'framer-motion'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import {
    ArrowLeftRight,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    GripVertical
} from 'lucide-react'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

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

    return (
        <div className="min-h-screen bg-background text-foreground p-8 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Reorder PDF Pages
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Drag and drop thumbnails to rearrange pages in your PDF document.
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8 min-h-[60vh]">

                    {/* Upload Area (Top if empty) */}
                    {!file && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="relative group cursor-pointer border border-dashed border-border hover:border-sidebar-ring bg-transparent hover:bg-muted/50 rounded-lg h-64 flex flex-col items-center justify-center gap-4 transition-colors duration-200 ease-out"
                        >
                            <div className="p-3 rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                <ArrowLeftRight className="w-5 h-5" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-foreground">Click or drop PDF here to reorder</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                        </div>
                    )}

                    {/* Toolbar */}
                    {file && (
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded text-foreground">
                                    <FileIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{pages.length} pages</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setFile(null); setPages([]); }}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={savePdf}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Save PDF
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grid */}
                    {file && pages.length > 0 && (
                        <Reorder.Group
                            axis="y"
                            onReorder={setPages}
                            values={pages}
                            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                            as="ul"
                        >
                            {pages.map((page, index) => (
                                <Reorder.Item
                                    key={page.id}
                                    value={page}
                                    className="relative group cursor-grab active:cursor-grabbing"
                                >
                                    <div className="aspect-[1/1.4] bg-muted border border-border rounded-lg overflow-hidden relative shadow-sm group-hover:border-sidebar-ring transition-colors">
                                        <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground text-xs rounded-full z-10 font-medium shadow-sm">
                                            {index + 1}
                                        </span>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={page.thumbnail} alt={`Page ${page.originalIndex + 1}`} className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <GripVertical className="text-foreground drop-shadow-md" />
                                        </div>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    )}

                    {isProcessing && file && pages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Rendering pages...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/10 text-red-400 text-sm flex items-center gap-2 mx-auto max-w-lg">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
