"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { CommandMenu } from "@workspace/ui/components/ui/command-menu"
import { toolsConfig } from "@/config/tools"
import { FileText, Github } from "lucide-react"

export function SiteHeader() {
    const router = useRouter()

    const groups = toolsConfig.nav.map(group => ({
        title: group.title,
        items: group.items.map(item => ({
            id: item.href,
            title: item.title,
            icon: <FileText className="h-4 w-4" />,
            onSelect: () => router.push(item.href)
        }))
    }))

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-4 md:gap-6">
                    <MobileNav />
                    <Link
                        href="/"
                        className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <div className="h-5 w-5 bg-foreground rounded-sm" />
                        <span className="hidden sm:inline-block">Ithasitall</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/tools"
                            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                            Tools
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <CommandMenu
                        groups={groups}
                        placeholder="Search tools..."
                        brandName="Ithasitall"
                    />
                    <div className="flex items-center gap-1">
                        <Link
                            href="https://github.com/harshjdhv/ithasitall"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-md hover:bg-accent transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                            <Github className="h-4 w-4" />
                            <span className="sr-only">GitHub</span>
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    )
}
