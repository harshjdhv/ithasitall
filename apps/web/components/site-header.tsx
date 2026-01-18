"use client"

import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"

export function SiteHeader() {
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
                            href="/docs"
                            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                            Docs
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1">
                        {/* Placeholder for Search/Command */}
                        <button className="hidden md:flex items-center justify-center h-8 px-3 rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground border border-border/50">
                            Search...
                        </button>
                        {/* Placeholder for Theme Toggle */}
                        <button className="h-8 w-8 rounded-md hover:bg-accent transition-colors flex items-center justify-center">
                            <div className="h-4 w-4 bg-muted-foreground/20 rounded-full" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
