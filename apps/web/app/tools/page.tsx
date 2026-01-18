import React from 'react'
import Link from 'next/link'
import {
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    FileJson,
    FileDiff,
    Search,
    Binary,
    Eye,
    Type,
    AlignLeft,
    Key,
    Fingerprint,
    Calendar,
    Clock,
    Code2,
    Globe,
    FileCode,
    ScrollText,
    BookOpen,
    PenTool,
    Hash,
    ShieldCheck,
    Scissors
} from 'lucide-react'

const ToolGroup = ({ title, tools }: { title: string; tools: { name: string; icon: React.ReactNode; href?: string }[] }) => (
    <div className="mb-12">
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-200 mb-4">{title}</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
                <li
                    key={tool.name}
                    className="group"
                >
                    {tool.href ? (
                        <Link
                            href={tool.href}
                            className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex items-center gap-3 cursor-pointer"
                        >
                            <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{tool.icon}</span>
                            {tool.name}
                        </Link>
                    ) : (
                        <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-sm opacity-60 flex items-center gap-3 cursor-not-allowed">
                            <span className="text-neutral-400 dark:text-neutral-500">{tool.icon}</span>
                            {tool.name}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    </div>
)

const ToolsPage = () => {
    const iconProps = { className: "w-4 h-4" };

    const toolCategories = [
        {
            title: "PDF Tools",
            tools: [
                { name: "PDF Merge", icon: <FileText {...iconProps} />, href: "/tools/pdf/merge" },
                { name: "PDF Compress", icon: <FileText {...iconProps} />, href: "/tools/pdf/compress" },
                { name: "PDF Split", icon: <Scissors {...iconProps} />, href: "/tools/pdf/split" },
                { name: "Images → PDF", icon: <ImageIcon {...iconProps} />, href: "/tools/pdf/images-to-pdf" },
                { name: "PDF → Images", icon: <FileText {...iconProps} />, href: "/tools/pdf/pdf-to-images" },
                { name: "PDF Page Reorder", icon: <FileText {...iconProps} />, href: "/tools/pdf/reorder" }
            ]
        },
        {
            title: "File & Media Utilities",
            tools: [
                { name: "Image Compress", icon: <ImageIcon {...iconProps} /> },
                { name: "Image Resize", icon: <ImageIcon {...iconProps} /> },
                { name: "Image Format Converter", icon: <ImageIcon {...iconProps} /> },
                { name: "Video Downloader", icon: <Video {...iconProps} /> },
                { name: "Audio Extract from Video", icon: <Music {...iconProps} /> }
            ]
        },
        {
            title: "Text & Data",
            tools: [
                { name: "JSON Formatter / Validator", icon: <FileJson {...iconProps} /> },
                { name: "JSON ↔ CSV", icon: <FileJson {...iconProps} /> },
                { name: "Diff Checker", icon: <FileDiff {...iconProps} /> },
                { name: "Regex Tester", icon: <Search {...iconProps} /> },
                { name: "Base64 Encode / Decode", icon: <Binary {...iconProps} /> }
            ]
        },
        {
            title: "General Utilities",
            tools: [
                { name: "Markdown Preview", icon: <Eye {...iconProps} /> },
                { name: "Case Converter", icon: <Type {...iconProps} /> },
                { name: "Word / Character Counter", icon: <AlignLeft {...iconProps} /> }
            ]
        },
        {
            title: "Developer-Specific Tools",
            tools: [
                { name: "JWT Decoder", icon: <Key {...iconProps} /> },
                { name: "UUID Generator", icon: <Fingerprint {...iconProps} /> },
                { name: "Timestamp ↔ Date Converter", icon: <Calendar {...iconProps} /> },
                { name: "Cron Expression Explainer", icon: <Clock {...iconProps} /> },
                { name: "Headers Formatter", icon: <Code2 {...iconProps} /> },
                { name: "User-Agent Parser", icon: <Globe {...iconProps} /> }
            ]
        },
        {
            title: "Nice-to-Have & Productivity",
            tools: [
                { name: "Gitignore Generator", icon: <FileCode {...iconProps} /> },
                { name: "License Generator", icon: <ScrollText {...iconProps} /> },
                { name: "README Generator", icon: <BookOpen {...iconProps} /> },
                { name: "Lorem Ipsum Generator", icon: <Type {...iconProps} /> },
                { name: "Commit Message Helper", icon: <PenTool {...iconProps} /> }
            ]
        },
        {
            title: "Advanced / Niche",
            tools: [
                { name: "Hash Tools (SHA256, Keccak)", icon: <Hash {...iconProps} /> },
                { name: "Address Checksum Validator", icon: <ShieldCheck {...iconProps} /> },
                { name: "Base58 Encode / Decode", icon: <Binary {...iconProps} /> },
                { name: "ABI Formatter", icon: <Code2 {...iconProps} /> },
                { name: "Video Trimmer", icon: <Video {...iconProps} /> },
                { name: "Audio Converter", icon: <Music {...iconProps} /> }
            ]
        }
    ];

    return (
        <div className="max-w-[1100px] mx-auto py-12 px-1 md:px-6">
            <div className="mb-16">
                <h1 className="text-3xl font-medium text-neutral-900 dark:text-white mb-4">Overview</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl leading-relaxed">
                    A clean, client-side toolbox of essential developer utilities. <br />
                    Fast. Private. Calm.
                </p>
            </div>

            <div className="space-y-4">
                {toolCategories.map((category) => (
                    <ToolGroup key={category.title} title={category.title} tools={category.tools} />
                ))}
            </div>
        </div>
    )
}

export default ToolsPage