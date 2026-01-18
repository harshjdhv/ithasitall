"use client"

import React, { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ImageIcon,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react'

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: string;
    preview: string;
}

export default function ImagesToPdfPage() {
    const [files, setFiles] = useState<ImageFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isConverting, setIsConverting] = useState(false)
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

        const validFiles: ImageFile[] = []

        Array.from(newFiles).forEach(file => {
            if (file.type === 'image/jpeg' || file.type === 'image/png') {
                validFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    size: formatSize(file.size),
                    preview: URL.createObjectURL(file)
                })
            } else {
                setError('Some files were skipped. Only JPG and PNG images are supported.')
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

    const convertToPdf = async () => {
        if (files.length === 0) {
            setError('Please select at least 1 image to convert.')
            return
        }

        setIsConverting(true)
        setError(null)

        try {
            const pdfDoc = await PDFDocument.create()

            for (const imgFile of files) {
                const imageBytes = await imgFile.file.arrayBuffer()
                let image

                if (imgFile.file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(imageBytes)
                } else {
                    image = await pdfDoc.embedPng(imageBytes)
                }

                const page = pdfDoc.addPage([image.width, image.height])
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                })
            }

            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `images-to-pdf-${new Date().toISOString().slice(0, 10)}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

        } catch (err) {
            console.error(err)
            setError('An error occurred while creating the PDF. Please try again.')
        } finally {
            setIsConverting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Images to PDF
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Convert JPG and PNG images into a single PDF document.
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
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-foreground">Click or drop images here</p>
                                <p className="text-xs text-muted-foreground">Supports JPG, PNG</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg, image/png"
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
                            <h3 className="text-sm font-medium text-muted-foreground">Images ({files.length})</h3>
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
                                            <p className="text-sm">No images selected</p>
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
                                                <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex-shrink-0 border border-border">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
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
                                onClick={convertToPdf}
                                disabled={files.length === 0 || isConverting}
                                className={`
                    w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2
                    transition-all duration-200
                    ${files.length === 0
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    }
                  `}
                            >
                                {isConverting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Convert to PDF
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
