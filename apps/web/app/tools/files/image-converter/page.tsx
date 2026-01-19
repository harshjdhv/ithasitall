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
    RefreshCw,
    ArrowRight
} from 'lucide-react'

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

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return
        setError(null)

        const validFiles: ImageFile[] = []

        Array.from(newFiles).forEach(file => {
            if (file.type.startsWith('image/')) {
                // Determine a default target that is different if possible, or just global
                validFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    originalSize: file.size,
                    previewUrl: URL.createObjectURL(file),
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
        const newFiles = [...files]
        for (let i = 0; i < newFiles.length; i++) {
            if (newFiles[i].status !== 'done') {
                newFiles[i].status = 'processing'
                setFiles([...newFiles])
                newFiles[i] = await convertImage(newFiles[i])
                setFiles([...newFiles])
            }
        }
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
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Image Format Converter
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Convert images between PNG, JPG, and WEBP formats.
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

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
                                <label className="text-sm font-medium text-foreground">Convert All To:</label>
                                <div className="flex gap-2">
                                    {(['image/png', 'image/jpeg', 'image/webp'] as ImageFormat[]).map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => applyGlobalFormat(fmt)}
                                            className={`flex-1 py-1.5 text-xs rounded border transition-colors ${globalFormat === fmt ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}
                                        >
                                            {getExtension(fmt).toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={processAll} className="w-full py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors mt-2">
                                    Convert All
                                </button>
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
                                                        <div className="text-xs text-muted-foreground">
                                                            Original: {getExtension(file.file.type).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                        <select
                                                            value={file.targetFormat}
                                                            onChange={(e) => updateFormat(file.id, e.target.value as ImageFormat)}
                                                            className="text-xs bg-background border border-border rounded px-2 py-1"
                                                        >
                                                            <option value="image/png">PNG</option>
                                                            <option value="image/jpeg">JPG</option>
                                                            <option value="image/webp">WEBP</option>
                                                        </select>
                                                    </div>

                                                    {file.status === 'done' && file.convertedUrl ? (
                                                        <a
                                                            href={file.convertedUrl}
                                                            download={`converted-${file.name.split('.')[0]}.${getExtension(file.targetFormat)}`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Download
                                                        </a>
                                                    ) : (
                                                        file.status !== 'processing' ? (
                                                            <button
                                                                onClick={() => {
                                                                    const idx = files.findIndex(f => f.id === file.id)
                                                                    const newFiles = [...files]
                                                                    newFiles[idx].status = 'processing'
                                                                    setFiles(newFiles)
                                                                    convertImage(newFiles[idx]).then(res => {
                                                                        const final = [...files]
                                                                        const i = final.findIndex(f => f.id === file.id);
                                                                        if (i !== -1) {
                                                                            final[i] = res;
                                                                            setFiles(final);
                                                                        }
                                                                    })
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" /> Convert
                                                            </button>
                                                        ) : (
                                                            <div className="text-xs text-blue-500 flex items-center gap-1">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Converting...
                                                            </div>
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
