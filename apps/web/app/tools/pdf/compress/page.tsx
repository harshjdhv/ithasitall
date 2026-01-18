"use client"

import React, { useState, useRef } from 'react'
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
    ArrowRight
} from 'lucide-react'

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
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Compress PDF
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Optimize your PDF file structure and remove unnecessary metadata to reduce file size.
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Source */}
                        <div
                            className={`
                 relative border rounded-lg h-64 flex flex-col items-center justify-center gap-4 transition-all duration-300
                 ${!file ? 'border-dashed border-border hover:border-sidebar-ring bg-transparent hover:bg-muted/50 cursor-pointer group' : 'border-solid border-border bg-muted/20'}
               `}
                            onClick={() => !file && fileInputRef.current?.click()}
                            onDragOver={(e) => !file && e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {!file ? (
                                <>
                                    <div className="p-3 rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-foreground">Click or drop PDF here</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute top-4 right-4">
                                        <button onClick={(e) => { e.stopPropagation(); setFile(null); setProcessedFile(null); }} className="text-muted-foreground hover:text-foreground">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <FileIcon className="w-12 h-12 text-muted-foreground" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">Original: {file.formattedSize}</p>
                                    </div>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                        </div>

                        {/* Action / Result */}
                        <div className="flex flex-col items-center justify-center gap-6 h-64">
                            {!processedFile ? (
                                <>
                                    <ArrowRight className={`w-8 h-8 text-muted-foreground ${file ? 'text-foreground' : ''}`} />
                                    <button
                                        onClick={compressPdf}
                                        disabled={!file || isProcessing}
                                        className={`
                           px-8 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2
                           transition-all duration-200
                           ${!file || isProcessing
                                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-black/5'
                                            }
                        `}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Optimizing...
                                            </>
                                        ) : (
                                            <>
                                                <Minimize2 className="w-4 h-4" />
                                                Compress PDF
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full border border-green-500/20 bg-green-500/5 rounded-lg flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-green-400">Ready for download</p>
                                        <p className="text-xs text-green-500/70 mt-1">
                                            New size: {processedFile.formattedSize}
                                            {file && processedFile.size < file.size && (
                                                <span className="ml-1 bg-green-500/20 px-1.5 py-0.5 rounded text-[10px]">
                                                    -{Math.round((1 - processedFile.size / file.size) * 100)}%
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={downloadFile}
                                        className="mt-2 px-6 py-2 bg-green-500 text-black font-medium text-sm rounded-md hover:bg-green-400 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            Note: This tool optimizes the PDF structure and removes unused assets.
                            It may not significantly reduce the size of files that are already compressed or contain mostly images.
                        </p>
                    </div>

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
