"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ImageIcon,
    Upload,
    X,
    Download,
    AlertCircle,
    Loader2,
    FileIcon,
    Settings,
    RefreshCw
} from 'lucide-react'

interface ImageFile {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    compressedSize?: number;
    previewUrl: string;
    compressedUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    quality: number; // 0.1 to 1.0
}

export default function ImageCompressPage() {
    const [files, setFiles] = useState<ImageFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [globalQuality, setGlobalQuality] = useState(0.8)
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
            if (file.type.startsWith('image/')) {
                validFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    originalSize: file.size,
                    previewUrl: URL.createObjectURL(file),
                    status: 'pending',
                    quality: globalQuality
                })
            } else {
                setError('Some files were skipped because they are not images.')
            }
        })

        setFiles(prev => [...prev, ...validFiles])
    }

    const compressImage = async (imageFile: ImageFile) => {
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
                ctx.drawImage(img, 0, 0)

                // Determine output format (keep original if supported, else jpeg)
                let mimeType = imageFile.file.type
                if (mimeType === 'image/png') {
                    // PNG compression is lossless in canvas usually, strictly generally ignores quality param in toBlob
                    // but some browsers support it or we fallback to jpeg/webp if user wants heavy compression
                    // For this tool, let's treat PNG as needing conversion to JPEG/WEBP for real compression or accept simple re-encoding
                    // Actually, let's switch to image/jpeg for compression if it's not transparent, or image/webp
                    if (imageFile.quality < 1) {
                        mimeType = 'image/jpeg' // Force jpeg for visible compression
                    }
                }

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve({ ...imageFile, status: 'error' })
                        return
                    }
                    resolve({
                        ...imageFile,
                        compressedSize: blob.size,
                        compressedUrl: URL.createObjectURL(blob),
                        status: 'done'
                    })
                }, mimeType, imageFile.quality)
            }
            img.onerror = () => {
                resolve({ ...imageFile, status: 'error' })
            }
        })
    }

    const processAll = async () => {
        const newFiles = [...files]
        for (let i = 0; i < newFiles.length; i++) {
            if (newFiles[i]!.status !== 'done') {
                newFiles[i]!.status = 'processing'
                setFiles([...newFiles]) // trigger update
                newFiles[i] = await compressImage(newFiles[i]!)
                setFiles([...newFiles])
            }
        }
    }

    const updateQuality = (id: string, newQuality: number) => {
        setFiles(files.map(f => f.id === id ? { ...f, quality: newQuality, status: 'pending' } : f))
    }

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id))
    }

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            files.forEach(f => {
                URL.revokeObjectURL(f.previewUrl)
                if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl)
            })
        }
    }, [])

    return (
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Image Compress
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Reduce image file size while maintaining quality.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Upload Area */}
                    <div className="space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                handleFiles(e.dataTransfer.files);
                            }}
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
                                <p className="text-sm font-medium text-foreground">Click or drop Images here</p>
                                <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP</p>
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

                        {/* Global Controls */}
                        {files.length > 0 && (
                            <div className="p-4 border border-border rounded-lg bg-card space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-foreground">Global Quality: {Math.round(globalQuality * 100)}%</label>
                                    <button onClick={processAll} className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                                        Compress All
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={globalQuality}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value)
                                        setGlobalQuality(v)
                                        setFiles(prev => prev.map(f => ({ ...f, quality: v, status: 'pending' })))
                                    }}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/10 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* File List */}
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
                                            <ImageIcon className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">No images selected</p>
                                        </div>
                                    ) : (
                                        files.map((file) => (
                                            <motion.div
                                                key={file.id}
                                                layout
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="group p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 rounded bg-muted/50 overflow-hidden flex-shrink-0 border border-border">
                                                        <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                                                            <button
                                                                onClick={() => removeFile(file.id)}
                                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{formatSize(file.originalSize)}</span>
                                                            {file.status === 'done' && file.compressedSize && (
                                                                <>
                                                                    <span>→</span>
                                                                    <span className="text-green-500 font-medium">{formatSize(file.compressedSize)}</span>
                                                                    <span className="text-green-500">(-{Math.round((1 - file.compressedSize / file.originalSize) * 100)}%)</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {file.status === 'processing' && (
                                                            <div className="text-xs text-blue-500 flex items-center gap-1">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Compressing...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">Quality: {Math.round(file.quality * 100)}%</span>
                                                        <input
                                                            type="range"
                                                            min="0.1"
                                                            max="1.0"
                                                            step="0.05"
                                                            value={file.quality}
                                                            onChange={(e) => updateQuality(file.id, parseFloat(e.target.value))}
                                                            className="w-24 h-1.5"
                                                        />
                                                    </div>

                                                    {file.status === 'done' && file.compressedUrl ? (
                                                        <a
                                                            href={file.compressedUrl}
                                                            download={`compressed-${file.name}`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Download
                                                        </a>
                                                    ) : (
                                                        file.status !== 'processing' && (
                                                            <button
                                                                onClick={() => {
                                                                    const idx = files.findIndex(f => f.id === file.id)
                                                                    const newFiles = [...files]
                                                                    if (newFiles[idx]) {
                                                                        newFiles[idx]!.status = 'processing'
                                                                        setFiles(newFiles)
                                                                        compressImage(newFiles[idx]!).then(res => {
                                                                            const finalFiles = [...files]
                                                                            const fIdx = finalFiles.findIndex(f => f.id === file.id)
                                                                            if (fIdx !== -1) {
                                                                                finalFiles[fIdx] = res
                                                                                setFiles(finalFiles)
                                                                            }
                                                                        })
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" /> Compress
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
