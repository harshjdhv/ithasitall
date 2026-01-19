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
    Lock,
    Unlock
} from 'lucide-react'

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

        const validFiles: Promise<ImageFile>[] = Array.from(newFiles)
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

        Promise.all(validFiles).then(res => {
            setFiles(prev => [...prev, ...res])
        })
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
        const newFiles = [...files]
        for (let i = 0; i < newFiles.length; i++) {
            if (newFiles[i].status !== 'done') {
                newFiles[i].status = 'processing'
                setFiles([...newFiles])
                newFiles[i] = await resizeImage(newFiles[i])
                setFiles([...newFiles])
            }
        }
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
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Image Resize
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Resize images while maintaining aspect ratio.
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
                                <p className="text-sm font-medium text-foreground">Set Dimensions for All</p>
                                <div className="flex items-end gap-2">
                                    <div className="space-y-1 flex-1">
                                        <label className="text-xs text-muted-foreground">Width</label>
                                        <input
                                            type="number"
                                            placeholder="Width"
                                            className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                                            value={globalWidth || ''}
                                            onChange={e => setGlobalWidth(parseInt(e.target.value) || undefined)}
                                        />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <label className="text-xs text-muted-foreground">Height</label>
                                        <input
                                            type="number"
                                            placeholder="Height"
                                            className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                                            value={globalHeight || ''}
                                            onChange={e => setGlobalHeight(parseInt(e.target.value) || undefined)}
                                        />
                                    </div>
                                    <button
                                        onClick={applyGlobalDimensions}
                                        className="h-[30px] px-3 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/80 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                                <button onClick={processAll} className="w-full py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors mt-2">
                                    Resize All
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
                                                            Original: {file.originalWidth} x {file.originalHeight}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={file.targetWidth}
                                                            onChange={(e) => updateDimensions(file.id, parseInt(e.target.value) || 0, file.targetHeight, file.maintainAspect)}
                                                            className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary"
                                                            placeholder="W"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground">px</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setFiles(prev => prev.map(f => f.id === file.id ? { ...f, maintainAspect: !f.maintainAspect } : f))}
                                                        className={`p-1.5 rounded transition-colors ${file.maintainAspect ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                                                    >
                                                        {file.maintainAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                    </button>
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={file.targetHeight}
                                                            onChange={(e) => updateDimensions(file.id, file.targetWidth, parseInt(e.target.value) || 0, file.maintainAspect)}
                                                            className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary"
                                                            placeholder="H"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground">px</span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex justify-end">
                                                    {file.status === 'done' && file.resizedUrl ? (
                                                        <a
                                                            href={file.resizedUrl}
                                                            download={`resized-${file.name}`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Download
                                                        </a>
                                                    ) : (
                                                        file.status !== 'processing' ? (
                                                            <button
                                                                onClick={() => {
                                                                    const idx = files.findIndex(f => f.id === file.id);
                                                                    const newFiles = [...files];
                                                                    newFiles[idx].status = 'processing';
                                                                    setFiles(newFiles);
                                                                    resizeImage(newFiles[idx]).then(res => {
                                                                        const final = [...files];
                                                                        const i = final.findIndex(f => f.id === file.id);
                                                                        if (i !== -1) {
                                                                            final[i] = res;
                                                                            setFiles(final);
                                                                        }
                                                                    })
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" /> Resize
                                                            </button>
                                                        ) : (
                                                            <div className="text-xs text-blue-500 flex items-center gap-1">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
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
