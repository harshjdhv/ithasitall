"use client"

import React, { useState, useRef } from 'react'
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
    FileIcon
} from 'lucide-react'

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
        <div className="min-h-screen bg-background text-foreground p-8 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Merge PDFs
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Combine multiple PDF files into a single document.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Upload Area */}
                    <div className="space-y-4">
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
                                <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-foreground">Click or drop PDFs here</p>
                                <p className="text-xs text-muted-foreground">Supports multiple files</p>
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
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/10 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* File List & Actions */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">Files ({files.length})</h3>
                            {files.length > 0 && (
                                <button
                                    onClick={() => setFiles([])}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="min-h-[200px] rounded-lg border border-border bg-transparent p-0 overflow-hidden">
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                <AnimatePresence initial={false} mode='popLayout'>
                                    {files.length === 0 ? (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                            <FileIcon className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">No files selected</p>
                                        </div>
                                    ) : (
                                        files.map((file, index) => (
                                            <motion.div
                                                key={file.id}
                                                layout
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="group flex items-center gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="text-muted-foreground">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{file.size}</p>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => moveFile(index, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-0"
                                                    >
                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveFile(index, 'down')}
                                                        disabled={index === files.length - 1}
                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-0"
                                                    >
                                                        <ArrowDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="w-px h-3 bg-border mx-1" />
                                                    <button
                                                        onClick={() => removeFile(file.id)}
                                                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={mergePdfs}
                                disabled={files.length < 2 || isMerging}
                                className={`
                    w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2
                    transition-all duration-200
                    ${files.length < 2
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    }
                `}
                            >
                                {isMerging ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Merge PDF
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
