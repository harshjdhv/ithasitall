"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video,
    Download,
    AlertCircle,
    Loader2,
    Link as LinkIcon,
    CheckCircle,
    ArrowLeft
} from 'lucide-react'
import { cn } from "@/lib/utils"

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
                            <Video className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                            Video Downloader
                        </h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                            Download videos from direct URLs.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden p-6 md:p-8 space-y-6">

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Video URL</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                                <input
                                    type="url"
                                    placeholder="https://example.com/video.mp4"
                                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={!url || status === 'checking' || status === 'downloading'}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center gap-2"
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
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>Downloading...</span>
                                <span>{progress > 0 ? `${progress}%` : '...'}</span>
                            </div>
                            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {status === 'done' && fileInfo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{fileInfo.name}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{fileInfo.size}</p>
                                    </div>
                                </div>
                                <a
                                    href={fileInfo.blobUrl}
                                    download={fileInfo.name}
                                    className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <Download className="w-4 h-4" /> Save File
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-medium">Download Failed</p>
                                <p className="opacity-90 leading-relaxed">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    <div className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 leading-relaxed">
                        <p><strong>Note:</strong> This tool only works with direct video links (ending in .mp4, .webm, etc) served with proper CORS headers. It cannot download from streaming sites like YouTube due to browser restrictions.</p>
                    </div>

                </div>
            </div>
        </div>
    )
}
