"use client"

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Music,
    Upload,
    X,
    Download,
    AlertCircle,
    Loader2,
    RefreshCw,
    FileVideo,
    ArrowLeft
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface VideoFile {
    id: string;
    file: File;
    name: string;
    size: number;
    previewUrl?: string; // Video thumbnail or just use icon
    audioUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    duration?: number;
}

export default function AudioExtractPage() {
    const [files, setFiles] = useState<VideoFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
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

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return
        setError(null)

        const validFiles: VideoFile[] = []

        Array.from(newFiles).forEach(file => {
            if (file.type.startsWith('video/')) {
                validFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    size: file.size,
                    previewUrl: URL.createObjectURL(file), // Browsers can play local blobs
                    status: 'pending'
                })
            } else {
                setError('Some files were skipped because they are not videos.')
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

    // WAV Encoder helper
    const audioBufferToWav = (buffer: AudioBuffer) => {
        const numOfChan = buffer.numberOfChannels
        const length = buffer.length * numOfChan * 2 + 44
        const out = new ArrayBuffer(length)
        const view = new DataView(out)
        const channels = []
        let i
        let sample
        let offset = 0
        let pos = 0

        // write WAVE header
        setUint32(0x46464952) // "RIFF"
        setUint32(length - 8) // file length - 8
        setUint32(0x45564157) // "WAVE"

        setUint32(0x20746d66) // "fmt " chunk
        setUint32(16) // length = 16
        setUint16(1) // PCM (uncompressed)
        setUint16(numOfChan)
        setUint32(buffer.sampleRate)
        setUint32(buffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
        setUint16(numOfChan * 2) // block-align
        setUint16(16) // 16-bit (hardcoded in this loop)

        setUint32(0x61746164) // "data" - chunk
        setUint32(length - pos - 4) // chunk length

        // write interleaved data
        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i))

        while (pos < buffer.length) {
            for (i = 0; i < numOfChan; i++) {
                // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i]![pos] ?? 0)) // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0 // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true)
                offset += 2
            }
            pos++
        }

        return new Blob([out], { type: 'audio/wav' })

        function setUint16(data: number) {
            view.setUint16(pos, data, true)
            pos += 2
        }

        function setUint32(data: number) {
            view.setUint32(pos, data, true)
            pos += 4
        }
    }

    const extractAudio = async (videoFile: VideoFile) => {
        return new Promise<VideoFile>(async (resolve) => {
            try {
                const arrayBuffer = await videoFile.file.arrayBuffer()
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

                const wavBlob = audioBufferToWav(audioBuffer)

                resolve({
                    ...videoFile,
                    audioUrl: URL.createObjectURL(wavBlob),
                    status: 'done'
                })
            } catch (err) {
                console.error(err);
                resolve({ ...videoFile, status: 'error' })
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
                newFiles[i] = await extractAudio(newFiles[i]!)
                setFiles([...newFiles])
            }
        }
        setIsProcessing(false)
    }

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id))
    }

    useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
                if (f.audioUrl) URL.revokeObjectURL(f.audioUrl)
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
                            <Music className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Extract Audio
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Extract high-quality audio (WAV) from video files.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            {files.length} {files.length === 1 ? 'video' : 'videos'} selected
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
                                <Upload className="w-4 h-4" />
                                Add Videos
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
                                <FileVideo className="w-8 h-8" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-base font-semibold text-neutral-900 dark:text-white">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    MP4, WebM, MKV supported
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="video/*"
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
                                        className="group relative flex items-center gap-4 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-sm transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-500 flex items-center justify-center shrink-0">
                                            {file.status === 'processing' ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : file.status === 'done' ? (
                                                <Music className="w-5 h-5" />
                                            ) : (
                                                <FileVideo className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {formatSize(file.size)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {file.status === 'done' && file.audioUrl ? (
                                                <a
                                                    href={file.audioUrl}
                                                    download={`audio-${file.name.split('.')[0]}.wav`}
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
                                        Extracting Audio...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Extract All Audio
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
