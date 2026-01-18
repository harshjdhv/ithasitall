import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import type { Viewport } from "next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { SiteHeader } from "@/components/site-header"
import { DocsSidebar } from "@/components/docs-sidebar"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="min-h-svh flex flex-col">
            <SiteHeader />
            <div className="flex-1 flex">
              <DocsSidebar />
              <main className="flex-1 w-full px-6 py-12 md:py-16">
                <div className="max-w-4xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
