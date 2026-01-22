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
    Lock,
    Unlock,
    ArrowLeft
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface ImageFile {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    originalWidth: number;
    originalHeight: number;
    previewUrl: string;
    resizedUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    targetWidth: number;
    targetHeight: number;
    maintainAspect: boolean;
}

export default function ImageResizePage() {
    const [files, setFiles] = useState<ImageFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [globalWidth, setGlobalWidth] = useState<number | undefined>(undefined)
    const [globalHeight, setGlobalHeight] = useState<number | undefined>(undefined)
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

        const validFilesPromises: Promise<ImageFile>[] = Array.from(newFiles)
            .filter(file => file.type.startsWith('image/'))
            .map(file => {
                return new Promise<ImageFile>((resolve) => {
                    const img = new Image()
                    const url = URL.createObjectURL(file)
                    img.src = url
                    img.onload = () => {
                        resolve({
                            id: Math.random().toString(36).substr(2, 9),
                            file,
                            name: file.name,
                            originalSize: file.size,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            previewUrl: url,
                            status: 'pending',
                            targetWidth: img.width,
                            targetHeight: img.height,
                            maintainAspect: true
                        })
                    }
                    img.onerror = () => {
                        // fallback if image load fails
                        resolve({
                            id: Math.random().toString(36).substr(2, 9),
                            file,
                            name: file.name,
                            originalSize: file.size,
                            originalWidth: 0,
                            originalHeight: 0,
                            previewUrl: url,
                            status: 'error',
                            targetWidth: 0,
                            targetHeight: 0,
                            maintainAspect: true
                        })
                    }
                })
            })

        Promise.all(validFilesPromises).then(res => {
            setFiles(prev => [...prev, ...res])
        })
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

    const resizeImage = async (imageFile: ImageFile) => {
        return new Promise<ImageFile>((resolve) => {
            const img = new Image()
            img.src = imageFile.previewUrl
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = imageFile.targetWidth
                canvas.height = imageFile.targetHeight
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    resolve({ ...imageFile, status: 'error' })
                    return
                }

                // Better quality resizing step-down could be implemented here, but simple draw for now
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve({ ...imageFile, status: 'error' })
                        return
                    }
                    resolve({
                        ...imageFile,
                        resizedUrl: URL.createObjectURL(blob),
                        status: 'done'
                    })
                }, imageFile.file.type, 0.9)
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
                newFiles[i] = await resizeImage(newFiles[i]!)
                setFiles([...newFiles])
            }
        }
        setIsProcessing(false)
    }

    const updateDimensions = (id: string, width: number, height: number, locked: boolean) => {
        setFiles(files.map(f => {
            if (f.id !== id) return f;

            let newW = width;
            let newH = height;

            // If locked and width changed, update height
            if (locked && f.originalWidth > 0 && f.originalHeight > 0) {
                const ratio = f.originalWidth / f.originalHeight;
                if (width !== f.targetWidth) {
                    newH = Math.round(width / ratio);
                } else if (height !== f.targetHeight) {
                    newW = Math.round(height * ratio);
                }
            }

            return { ...f, targetWidth: newW, targetHeight: newH, maintainAspect: locked, status: 'pending' };
        }))
    }

    const applyGlobalDimensions = () => {
        if (!globalWidth && !globalHeight) return;

        setFiles(files.map(f => {
            let newW = globalWidth || f.targetWidth;
            let newH = globalHeight || f.targetHeight;

            if (f.maintainAspect && f.originalWidth > 0 && f.originalHeight > 0) {
                const ratio = f.originalWidth / f.originalHeight;
                if (globalWidth) {
                    newH = Math.round(globalWidth / ratio);
                } else if (globalHeight) {
                    newW = Math.round(globalHeight * ratio);
                }
            }

            return { ...f, targetWidth: newW, targetHeight: newH, status: 'pending' }
        }))
    }

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id))
    }

    useEffect(() => {
        return () => {
            files.forEach(f => {
                URL.revokeObjectURL(f.previewUrl)
                if (f.resizedUrl) URL.revokeObjectURL(f.resizedUrl)
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
                            Image Resize
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Resize images while maintaining aspect ratio.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                                {files.length} {files.length === 1 ? 'image' : 'images'}
                            </div>

                            {/* Global Resize Controls */}
                            {files.length > 0 && (
                                <div className="flex items-center gap-2 p-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <input
                                        type="number"
                                        placeholder="W"
                                        className="w-16 h-7 text-xs px-2 bg-transparent border-r border-neutral-200 dark:border-neutral-700 focus:outline-none"
                                        value={globalWidth || ''}
                                        onChange={e => setGlobalWidth(parseInt(e.target.value) || undefined)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="H"
                                        className="w-16 h-7 text-xs px-2 bg-transparent focus:outline-none"
                                        value={globalHeight || ''}
                                        onChange={e => setGlobalHeight(parseInt(e.target.value) || undefined)}
                                    />
                                    <button
                                        onClick={applyGlobalDimensions}
                                        className="h-7 px-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                    >
                                        Apply
                                    </button>
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
                                                    <span>{file.originalWidth}x{file.originalHeight}</span>
                                                    {file.status === 'done' && (
                                                        <>
                                                            <span>→</span>
                                                            <span className="text-green-600 dark:text-green-400 font-medium">{file.targetWidth}x{file.targetHeight}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">

                                            {/* Resize Inputs per item */}
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={file.targetWidth}
                                                        onChange={(e) => updateDimensions(file.id, parseInt(e.target.value) || 0, file.targetHeight, file.maintainAspect)}
                                                        className="w-16 h-7 text-xs px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="W"
                                                    />
                                                    <span className="absolute right-1 top-1.5 text-[8px] text-neutral-400">px</span>
                                                </div>
                                                <button
                                                    onClick={() => setFiles(prev => prev.map(f => f.id === file.id ? { ...f, maintainAspect: !f.maintainAspect } : f))}
                                                    className={`p-1.5 rounded transition-colors ${file.maintainAspect ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                                    title={file.maintainAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                                                >
                                                    {file.maintainAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                </button>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={file.targetHeight}
                                                        onChange={(e) => updateDimensions(file.id, file.targetWidth, parseInt(e.target.value) || 0, file.maintainAspect)}
                                                        className="w-16 h-7 text-xs px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="H"
                                                    />
                                                    <span className="absolute right-1 top-1.5 text-[8px] text-neutral-400">px</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {file.status === 'done' && file.resizedUrl ? (
                                                    <a
                                                        href={file.resizedUrl}
                                                        download={`resized-${file.name}`}
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
                                        Resizing Images...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Resize All Images
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
