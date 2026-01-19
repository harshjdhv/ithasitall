"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video,
    Download,
    AlertCircle,
    Loader2,
    Link as LinkIcon,
    CheckCircle
} from 'lucide-react'

export default function VideoDownloaderPage() {
    const [url, setUrl] = useState('')
    const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'done' | 'error'>('idle')
    const [progress, setProgress] = useState(0)
    const [fileInfo, setFileInfo] = useState<{ name: string, size: string, blobUrl: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDownload = async () => {
        if (!url) return
        setStatus('checking')
        setError(null)
        setProgress(0)

        try {
            // Attempt to fetch the head first to check content type/CORS
            const response = await fetch(url, { method: 'GET' }) // GET usually required for actual download

            if (!response.ok) {
                throw new Error(`Failed to access URL (${response.status})`)
            }

            const type = response.headers.get('content-type')
            if (!type?.startsWith('video/') && !type?.startsWith('application/octet-stream')) {
                // Warning but proceed potentially
            }

            const contentLength = response.headers.get('content-length')
            const total = contentLength ? parseInt(contentLength, 10) : 0

            const reader = response.body?.getReader()
            if (!reader) throw new Error('Cannot read stream')

            setStatus('downloading')

            const chunks = []
            let received = 0

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                chunks.push(value)
                received += value.length

                if (total) {
                    setProgress(Math.round((received / total) * 100))
                }
            }

            const blob = new Blob(chunks)
            const blobUrl = URL.createObjectURL(blob)

            // Try to extract name from url
            let filename = 'video.mp4'
            try {
                const urlObj = new URL(url)
                const parts = urlObj.pathname.split('/')
                const last = parts[parts.length - 1]
                if (last && last.includes('.')) filename = last
            } catch (e) { }

            setFileInfo({
                name: filename,
                size: (received / (1024 * 1024)).toFixed(2) + ' MB',
                blobUrl
            })
            setStatus('done')

        } catch (err: any) {
            console.error(err)
            if (err.message.includes('Failed to fetch')) {
                setError('CORS Error: The server hosting the video does not allow direct browser downloads. This tool currently only supports direct links with CORS headers enabled.')
            } else {
                setError(err.message || 'An error occurred')
            }
            setStatus('error')
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-1 md:p-12 font-sans selection:bg-muted">
            <div className="max-w-[800px] mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-medium tracking-tight text-foreground">
                        Video Downloader
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Download videos from direct URLs.
                    </p>
                </div>

                {/* Main Input */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Video URL</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="url"
                                    placeholder="https://example.com/video.mp4"
                                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={!url || status === 'checking' || status === 'downloading'}
                                className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {status === 'checking' || status === 'downloading' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {status === 'checking' ? 'Checking...' : status === 'downloading' ? 'Downloading...' : 'Download'}
                            </button>
                        </div>
                    </div>

                    {status === 'downloading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Downloading...</span>
                                <span>{progress > 0 ? `${progress}%` : '...'}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {status === 'done' && fileInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{fileInfo.name}</p>
                                    <p className="text-xs text-muted-foreground">{fileInfo.size}</p>
                                </div>
                            </div>
                            <a
                                href={fileInfo.blobUrl}
                                download={fileInfo.name}
                                className="px-4 py-2 bg-background border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Save File
                            </a>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-red-500/10 border border-red-500/10 text-red-400 text-sm flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-medium">Download Failed</p>
                                <p className="opacity-90">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">
                        <p><strong>Note:</strong> This tool only works with direct video links (ending in .mp4, .webm, etc) served with proper CORS headers. It cannot download from streaming sites like YouTube due to browser restrictions.</p>
                    </div>

                </div>

            </div>
        </div>
    )
}
