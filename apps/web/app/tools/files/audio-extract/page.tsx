"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Music,
    Upload,
    X,
    Download,
    AlertCircle,
    Loader2,
    RefreshCw,
    FileVideo
} from 'lucide-react'

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
        const newFiles = [...files]
        for (let i = 0; i < newFiles.length; i++) {
            if (newFiles[i]!.status !== 'done') {
                newFiles[i]!.status = 'processing'
                setFiles([...newFiles])
                newFiles[i] = await extractAudio(newFiles[i]!)
                setFiles([...newFiles])
            }
        }
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
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[1100px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Extract Audio
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Extract high-quality audio (WAV) from video files.
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
                                <p className="text-sm font-medium text-foreground">Click or drop Videos here</p>
                                <p className="text-xs text-muted-foreground">Supports MP4, WebM, MKV</p>
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

                        {files.length > 0 && (
                            <button onClick={processAll} className="w-full py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors mt-2">
                                Extract All Audio
                            </button>
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
                            <h3 className="text-sm font-medium text-muted-foreground">Videos ({files.length})</h3>
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
                                            <FileVideo className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">No videos selected</p>
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
                                                    <div className="w-12 h-12 rounded bg-muted/50 overflow-hidden flex-shrink-0 border border-border flex items-center justify-center text-muted-foreground">
                                                        <FileVideo className="w-6 h-6" />
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
                                                            {formatSize(file.size)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex justify-end">
                                                    {file.status === 'done' && file.audioUrl ? (
                                                        <a
                                                            href={file.audioUrl}
                                                            download={`audio-${file.name.split('.')[0]}.wav`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Download WAV
                                                        </a>
                                                    ) : (
                                                        file.status !== 'processing' ? (
                                                            <button
                                                                onClick={() => {
                                                                    const idx = files.findIndex(f => f.id === file.id);
                                                                    const newFiles = [...files];
                                                                    if (newFiles[idx]) {
                                                                        newFiles[idx]!.status = 'processing';
                                                                        setFiles(newFiles);
                                                                        extractAudio(newFiles[idx]!).then(res => {
                                                                            const final = [...files];
                                                                            const i = final.findIndex(f => f.id === file.id);
                                                                            if (i !== -1) {
                                                                                final[i] = res;
                                                                                setFiles(final);
                                                                            }
                                                                        })
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors"
                                                            >
                                                                <Music className="w-3.5 h-3.5" /> Extract
                                                            </button>
                                                        ) : (
                                                            <div className="text-xs text-blue-500 flex items-center gap-1">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Extracting...
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
