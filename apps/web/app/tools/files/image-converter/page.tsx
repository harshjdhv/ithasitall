"use client"

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ImageIcon,
    Upload,
    X,
    Download,
    AlertCircle,
    Loader2,
    RefreshCw,
    ArrowLeft,
    ArrowRight
} from 'lucide-react'
import { cn } from "@/lib/utils"

type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ImageFile {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    previewUrl: string;
    convertedUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    targetFormat: ImageFormat;
}

export default function ImageConverterPage() {
    const [files, setFiles] = useState<ImageFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [globalFormat, setGlobalFormat] = useState<ImageFormat>('image/png')
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getExtension = (mime: string) => {
        switch (mime) {
            case 'image/png': return 'png'
            case 'image/jpeg': return 'jpg'
            case 'image/webp': return 'webp'
            default: return 'img'
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
        handleFiles(e.dataTransfer.files)
    }

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return
        setError(null)

        const validFiles: ImageFile[] = []

        Array.from(newFiles).forEach(file => {
            if (file.type.startsWith('image/')) {
                validFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    originalSize: file.size,
                    previewUrl: URL.createObjectURL(file), // Browsers can play local blobs
                    status: 'pending',
                    targetFormat: globalFormat
                })
            } else {
                setError('Some files were skipped because they are not images.')
            }
        })

        setFiles(prev => [...prev, ...validFiles])
    }

    const convertImage = async (imageFile: ImageFile) => {
        return new Promise<ImageFile>((resolve) => {
            const img = new Image()
            img.src = imageFile.previewUrl
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    resolve({ ...imageFile, status: 'error' })
                    return
                }

                // Fill white background for JPEG/WEBP if transparency exists (optional, but good for PNG->JPG)
                if (imageFile.targetFormat === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                }

                ctx.drawImage(img, 0, 0)

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve({ ...imageFile, status: 'error' })
                        return
                    }
                    resolve({
                        ...imageFile,
                        convertedUrl: URL.createObjectURL(blob),
                        status: 'done'
                    })
                }, imageFile.targetFormat, 0.9)
            }
            img.onerror = () => {
                resolve({ ...imageFile, status: 'error' })
            }
        })
    }

    const processAll = async () => {
        setIsProcessing(true)
        const newFiles = [...files]
        for (let i = 0; i < newFiles.length; i++) {
            if (newFiles[i]!.status !== 'done') {
                newFiles[i]!.status = 'processing'
                setFiles([...newFiles])
                newFiles[i] = await convertImage(newFiles[i]!)
                setFiles([...newFiles])
            }
        }
        setIsProcessing(false)
    }

    const updateFormat = (id: string, format: ImageFormat) => {
        setFiles(files.map(f => f.id === id ? { ...f, targetFormat: format, status: 'pending' } : f))
    }

    const applyGlobalFormat = (format: ImageFormat) => {
        setGlobalFormat(format)
        setFiles(files.map(f => ({ ...f, targetFormat: format, status: 'pending' })))
    }

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id))
    }

    useEffect(() => {
        return () => {
            files.forEach(f => {
                URL.revokeObjectURL(f.previewUrl)
                if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl)
            })
        }
    }, [])

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

                {/* Header */}
                <div className="space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 text-blue-500 mb-2">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Image Format Converter
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Convert images between PNG, JPG, and WEBP formats.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                                {files.length} {files.length === 1 ? 'image' : 'images'}
                            </div>

                            {/* Global Format Selector */}
                            {files.length > 0 && (
                                <div className="hidden sm:flex items-center gap-2 p-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <span className="text-xs text-neutral-500 px-2">Convert All:</span>
                                    {(['image/png', 'image/jpeg', 'image/webp'] as ImageFormat[]).map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => applyGlobalFormat(fmt)}
                                            className={cn(
                                                "px-2 py-1 text-xs rounded-md transition-all",
                                                globalFormat === fmt
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                                                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            {getExtension(fmt).toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
                                <Upload className="w-4 h-4" />
                                Add Images
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
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                                    : "border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                            )}
                        >
                            <div className={cn(
                                "p-4 rounded-full transition-colors duration-200",
                                isDragging ? "bg-blue-100 text-blue-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
                            )}>
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-base font-semibold text-neutral-900 dark:text-white">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    JPG, PNG, WEBP supported
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
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
                                {files.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                                                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
                                                    {file.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                                    <span>{formatSize(file.originalSize)}</span>
                                                    <span>•</span>
                                                    <span>{getExtension(file.file.type).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">

                                            {/* Format Selection per item */}
                                            <div className="flex items-center gap-2">
                                                <ArrowRight className="w-3 h-3 text-neutral-400" />
                                                <select
                                                    value={file.targetFormat}
                                                    onChange={(e) => updateFormat(file.id, e.target.value as ImageFormat)}
                                                    className="text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="image/png">PNG</option>
                                                    <option value="image/jpeg">JPG</option>
                                                    <option value="image/webp">WEBP</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {file.status === 'done' && file.convertedUrl ? (
                                                    <a
                                                        href={file.convertedUrl}
                                                        download={`converted-${file.name.split('.')[0]}.${getExtension(file.targetFormat)}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 text-xs font-medium transition-colors"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        Download
                                                    </a>
                                                ) : null}

                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                            <button
                                onClick={processAll}
                                disabled={files.length === 0 || isProcessing}
                                className={cn(
                                    "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                                    files.length === 0 || isProcessing
                                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98]"
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Converting Images...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Convert All Images
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
