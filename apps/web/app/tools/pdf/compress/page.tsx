"use client"

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'
import {
    Minimize2,
    Upload,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    X,
    CheckCircle,
    ArrowRight,
    ArrowLeft
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface PdfFile {
    file: File;
    name: string;
    size: number;
    formattedSize: string;
}

export default function PdfCompressPage() {
    const [file, setFile] = useState<PdfFile | null>(null)
    const [processedFile, setProcessedFile] = useState<PdfFile | null>(null)
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleFile = (uploadedFile: File) => {
        setError(null)
        setProcessedFile(null)
        if (uploadedFile.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.')
            return
        }

        setFile({
            file: uploadedFile,
            name: uploadedFile.name,
            size: uploadedFile.size,
            formattedSize: formatSize(uploadedFile.size)
        })
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const compressPdf = async () => {
        if (!file) return

        setIsProcessing(true)
        setError(null)

        try {
            const arrayBuffer = await file.file.arrayBuffer()
            const srcDoc = await PDFDocument.load(arrayBuffer)

            // Strategy: Create a new document and copy pages. 
            // This often removes unused objects, metadata, and history.
            const newDoc = await PDFDocument.create()
            const indices = srcDoc.getPageIndices()
            const copiedPages = await newDoc.copyPages(srcDoc, indices)

            copiedPages.forEach(page => newDoc.addPage(page))

            // Strip metadata
            newDoc.setTitle('')
            newDoc.setAuthor('')
            newDoc.setSubject('')
            newDoc.setKeywords([])
            newDoc.setProducer('')
            newDoc.setCreator('')

            const pdfBytes = await newDoc.save()
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)

            setBlobUrl(url)
            setProcessedFile({
                file: new File([blob], file.name, { type: 'application/pdf' }),
                name: file.name,
                size: pdfBytes.byteLength,
                formattedSize: formatSize(pdfBytes.byteLength)
            })

        } catch (err) {
            console.error(err)
            setError('An error occurred while optimising the PDF.')
        } finally {
            setIsProcessing(false)
        }
    }

    const downloadFile = () => {
        if (!blobUrl || !processedFile) return
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = processedFile.name.replace('.pdf', '_optimized.pdf')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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
                            <Minimize2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Compress PDF
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Optimize your PDF file structure and remove unnecessary metadata to reduce file size.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {!processedFile ? (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                                <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                    {file ? '1 file selected' : 'No file selected'}
                                </div>

                                {file && (
                                    <button
                                        onClick={() => { setFile(null); setProcessedFile(null); }}
                                        className="text-xs px-3 py-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                                    >
                                        Remove File
                                    </button>
                                )}
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                {/* Drop Zone or File Preview */}
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
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center shrink-0">
                                                <FileIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{file.name}</p>
                                                <p className="text-sm text-neutral-500">{file.formattedSize}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={compressPdf}
                                            disabled={isProcessing}
                                            className={cn(
                                                "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                                                isProcessing
                                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                                    : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 active:scale-[0.98]"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Compressing...
                                                </>
                                            ) : (
                                                <>
                                                    <Minimize2 className="w-5 h-5" />
                                                    Compress PDF
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
                        </>
                    ) : (
                        <div className="p-8 md:p-12 text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 mx-auto flex items-center justify-center animate-in zoom-in-50 duration-300">
                                <CheckCircle className="w-8 h-8" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Compression Complete!</h3>
                                <p className="text-neutral-500 dark:text-neutral-400">
                                    Your file has been optimized.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-4 text-sm">
                                <span className="text-neutral-500 line-through">{file?.formattedSize}</span>
                                <ArrowRight className="w-4 h-4 text-neutral-400" />
                                <span className="font-semibold text-green-600">{processedFile.formattedSize}</span>
                                {file && (
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                                        -{Math.round((1 - processedFile.size / file.size) * 100)}%
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
                                <button
                                    onClick={downloadFile}
                                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Compressed PDF
                                </button>
                                <button
                                    onClick={() => { setFile(null); setProcessedFile(null); }}
                                    className="w-full py-3 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium"
                                >
                                    Compress Another File
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
