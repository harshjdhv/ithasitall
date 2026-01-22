"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Scissors,
  Wrench,
} from "lucide-react";

const categoryColors = {
  pdf: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "hover:border-red-300 dark:hover:border-red-700",
  },
  media: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  text: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  general: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "hover:border-amber-300 dark:hover:border-amber-700",
  },
  dev: {
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    border: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  productivity: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
    border: "hover:border-cyan-300 dark:hover:border-cyan-700",
  },
  advanced: {
    bg: "bg-pink-500/10",
    text: "text-pink-500",
    border: "hover:border-pink-300 dark:hover:border-pink-700",
  },
};

const categoryIcons = {
  pdf: <FileText className="w-8 h-8" />,
  media: <ImageIcon className="w-8 h-8" />,
  text: <FileJson className="w-8 h-8" />,
  general: <Wrench className="w-8 h-8" />,
  dev: <Code2 className="w-8 h-8" />,
  productivity: <PenTool className="w-8 h-8" />,
  advanced: <Hash className="w-8 h-8" />,
};

const ToolCard = ({
  tool,
  colorClass,
}: {
  tool: { name: string; icon: React.ReactNode; href?: string };
  colorClass: string;
}) => {
  const colors = categoryColors[colorClass as keyof typeof categoryColors];

  if (tool.href) {
    return (
      <motion.li
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href={tool.href}
          className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-sm hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all duration-200 flex items-center gap-3 cursor-pointer group"
        >
          <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            {tool.icon}
          </span>
          {tool.name}
        </Link>
      </motion.li>
    );
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-400 dark:text-neutral-500 text-sm flex items-center gap-3 cursor-not-allowed">
        <span className="opacity-50">{tool.icon}</span>
        {tool.name}
      </div>
    </motion.li>
  );
};

const CategorySection = ({
  category,
  icon,
  colorKey,
  tools,
}: {
  category: string;
  icon: React.ReactNode;
  colorKey: keyof typeof categoryColors;
  tools: { name: string; icon: React.ReactNode; href?: string }[];
}) => {
  const colors = categoryColors[colorKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="mb-10"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`${colors.bg} ${colors.text} rounded-xl p-2`}>
          {icon}
        </span>
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
          {category}
        </h2>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map((tool, index) => (
          <ToolCard key={tool.name} tool={tool} colorClass={colorKey} />
        ))}
      </ul>
    </motion.div>
  );
};

const ToolsPage = () => {
  const iconProps = { className: "w-4 h-4" };

  const toolCategories = [
    {
      category: "PDF Tools",
      icon: categoryIcons.pdf,
      colorKey: "pdf" as const,
      tools: [
        {
          name: "PDF Merge",
          icon: <FileText {...iconProps} />,
          href: "/tools/pdf/merge",
        },
        {
          name: "PDF Compress",
          icon: <FileText {...iconProps} />,
          href: "/tools/pdf/compress",
        },
        {
          name: "PDF Split",
          icon: <Scissors {...iconProps} />,
          href: "/tools/pdf/split",
        },
        {
          name: "Images → PDF",
          icon: <ImageIcon {...iconProps} />,
          href: "/tools/pdf/images-to-pdf",
        },
        {
          name: "PDF → Images",
          icon: <FileText {...iconProps} />,
          href: "/tools/pdf/pdf-to-images",
        },
        {
          name: "PDF Page Reorder",
          icon: <FileText {...iconProps} />,
          href: "/tools/pdf/reorder",
        },
      ],
    },
    {
      category: "File & Media Utilities",
      icon: categoryIcons.media,
      colorKey: "media" as const,
      tools: [
        {
          name: "Image Compress",
          icon: <ImageIcon {...iconProps} />,
          href: "/tools/files/image-compress",
        },
        {
          name: "Image Resize",
          icon: <ImageIcon {...iconProps} />,
          href: "/tools/files/image-resize",
        },
        {
          name: "Image Format Converter",
          icon: <ImageIcon {...iconProps} />,
          href: "/tools/files/image-converter",
        },
        {
          name: "Video Downloader",
          icon: <Video {...iconProps} />,
          href: "/tools/files/video-downloader",
        },
        {
          name: "Audio Extract from Video",
          icon: <Music {...iconProps} />,
          href: "/tools/files/audio-extract",
        },
      ],
    },
    {
      category: "Text & Data",
      icon: categoryIcons.text,
      colorKey: "text" as const,
      tools: [
        {
          name: "JSON Formatter / Validator",
          icon: <FileJson {...iconProps} />,
        },
        { name: "JSON ↔ CSV", icon: <FileJson {...iconProps} /> },
        { name: "Diff Checker", icon: <FileDiff {...iconProps} /> },
        { name: "Regex Tester", icon: <Search {...iconProps} /> },
        { name: "Base64 Encode / Decode", icon: <Binary {...iconProps} /> },
      ],
    },
    {
      category: "General Utilities",
      icon: categoryIcons.general,
      colorKey: "general" as const,
      tools: [
        { name: "Markdown Preview", icon: <Eye {...iconProps} /> },
        { name: "Case Converter", icon: <Type {...iconProps} /> },
        {
          name: "Word / Character Counter",
          icon: <AlignLeft {...iconProps} />,
        },
      ],
    },
    {
      category: "Developer-Specific Tools",
      icon: categoryIcons.dev,
      colorKey: "dev" as const,
      tools: [
        { name: "JWT Decoder", icon: <Key {...iconProps} /> },
        { name: "UUID Generator", icon: <Fingerprint {...iconProps} /> },
        {
          name: "Timestamp ↔ Date Converter",
          icon: <Calendar {...iconProps} />,
        },
        { name: "Cron Expression Explainer", icon: <Clock {...iconProps} /> },
        { name: "Headers Formatter", icon: <Code2 {...iconProps} /> },
        { name: "User-Agent Parser", icon: <Globe {...iconProps} /> },
      ],
    },
    {
      category: "Nice-to-Have & Productivity",
      icon: categoryIcons.productivity,
      colorKey: "productivity" as const,
      tools: [
        { name: "Gitignore Generator", icon: <FileCode {...iconProps} /> },
        { name: "License Generator", icon: <ScrollText {...iconProps} /> },
        { name: "README Generator", icon: <BookOpen {...iconProps} /> },
        { name: "Lorem Ipsum Generator", icon: <Type {...iconProps} /> },
        { name: "Commit Message Helper", icon: <PenTool {...iconProps} /> },
      ],
    },
    {
      category: "Advanced / Niche",
      icon: categoryIcons.advanced,
      colorKey: "advanced" as const,
      tools: [
        { name: "Hash Tools (SHA256, Keccak)", icon: <Hash {...iconProps} /> },
        {
          name: "Address Checksum Validator",
          icon: <ShieldCheck {...iconProps} />,
        },
        { name: "Base58 Encode / Decode", icon: <Binary {...iconProps} /> },
        { name: "ABI Formatter", icon: <Code2 {...iconProps} /> },
        { name: "Video Trimmer", icon: <Video {...iconProps} /> },
        { name: "Audio Converter", icon: <Music {...iconProps} /> },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-1 px-1 md:py-12 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <div className="inline-flex bg-blue-500/10 text-blue-500 rounded-2xl p-3 mb-4">
          <Wrench className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-3">
          Developer Tools
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
          A collection of practical tools for developers, designers, and power
          users.
        </p>
      </motion.div>

      <div className="space-y-4">
        {toolCategories.map((category) => (
          <CategorySection
            key={category.category}
            category={category.category}
            icon={category.icon}
            colorKey={category.colorKey}
            tools={category.tools}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
