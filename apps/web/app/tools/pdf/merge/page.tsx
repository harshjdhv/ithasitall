"use client"

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText,
    Upload,
    X,
    ArrowUp,
    ArrowDown,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    ArrowLeft,
    Trash2,
    Plus
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface PdfFile {
    id: string;
    file: File;
    name: string;
    size: string;
}

export default function PdfMergePage() {
    const [files, setFiles] = useState<PdfFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isMerging, setIsMerging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return
        setError(null)

        const validFiles: PdfFile[] = []

        Array.from(newFiles).forEach(file => {
            if (file.type === 'application/pdf') {
                validFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    size: formatSize(file.size)
                })
            } else {
                setError('Some files were skipped because they are not PDFs.')
            }
        })

        setFiles(prev => [...prev, ...validFiles])
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
        handleFiles(e.dataTransfer.files)
    }

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id))
    }

    const moveFile = (index: number, direction: 'up' | 'down') => {
        const newFiles = [...files]
        if (direction === 'up' && index > 0) {
            const temp = newFiles[index]!
            newFiles[index] = newFiles[index - 1]!
            newFiles[index - 1] = temp
        } else if (direction === 'down' && index < newFiles.length - 1) {
            const temp = newFiles[index]!
            newFiles[index] = newFiles[index + 1]!
            newFiles[index + 1] = temp
        }
        setFiles(newFiles)
    }

    const mergePdfs = async () => {
        if (files.length < 2) {
            setError('Please select at least 2 PDF files to merge.')
            return
        }

        setIsMerging(true)
        setError(null)

        try {
            const mergedPdf = await PDFDocument.create()

            for (const pdfFile of files) {
                const fileBuffer = await pdfFile.file.arrayBuffer()
                const pdf = await PDFDocument.load(fileBuffer)
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
                copiedPages.forEach((page) => mergedPdf.addPage(page))
            }

            const mergedPdfBytes = await mergedPdf.save()
            const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `merged-${new Date().toISOString().slice(0, 10)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

        } catch (err) {
            console.error(err)
            setError('An error occurred while merging the PDFs. Please try again.')
        } finally {
            setIsMerging(false)
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
                            <FileText className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Merge PDF
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Combine multiple PDF files into a single document. Drag and drop to reorder.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            {files.length} {files.length === 1 ? 'file' : 'files'} selected
                        </div>

                        <div className="flex items-center gap-2">
                            {files.length > 0 && (
                                <button
                                    onClick={() => setFiles([])}
                                    className="text-xs px-3 py-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Files
                            </button>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        {/* Drop Zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "relative group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ease-out flex flex-col items-center justify-center gap-4 py-8 px-4",
                                isDragging
                                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                    : "border-neutral-200 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                            )}
                        >
                            <div className={cn(
                                "p-4 rounded-full transition-colors duration-200",
                                isDragging ? "bg-red-100 text-red-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
                            )}>
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
                                multiple
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => handleFiles(e.target.files)}
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* File List */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence initial={false} mode='popLayout'>
                                {files.map((file, index) => (
                                    <motion.div
                                        key={file.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group relative flex items-center gap-4 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-sm transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-500 flex items-center justify-center shrink-0">
                                            <FileIcon className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {file.size}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveFile(index, 'up') }}
                                                disabled={index === 0}
                                                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                                                title="Move Up"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveFile(index, 'down') }}
                                                disabled={index === files.length - 1}
                                                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                                                title="Move Down"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(file.id) }}
                                                className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Merge Button */}
                        <div className="pt-2">
                            <button
                                onClick={mergePdfs}
                                disabled={files.length < 2 || isMerging}
                                className={cn(
                                    "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                                    files.length < 2 || isMerging
                                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                        : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 active:scale-[0.98]"
                                )}
                            >
                                {isMerging ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Merging PDFs...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Merge PDFs
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
