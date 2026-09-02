"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { AlertTriangle, Copy, Check, RefreshCw, Home, Mail, ChevronDown, ChevronUp, Bug, Terminal, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false)
  const [showStack, setShowStack] = useState(false)
  const [clientInfo, setClientInfo] = useState<{
    url: string
    timestamp: string
    userAgent: string
    screenSize: string
  }>({
    url: "",
    timestamp: "",
    userAgent: "",
    screenSize: "",
  })

  useEffect(() => {
    // Collect client-side diagnostic data for instant reporting
    if (typeof window !== "undefined") {
      setClientInfo({
        url: window.location.href,
        timestamp: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      })
    }
  }, [])

  // Construct structured diagnostic report
  const generateReport = () => {
    return [
      `### 🐛 RHHS Classroom Champion - Bug Report`,
      ``,
      `**Error Message**: ${error.message || "Unknown error"}`,
      `**Error Name**: ${error.name || "Error"}`,
      `**Digest ID**: ${error.digest || "None"}`,
      `**Timestamp**: ${clientInfo.timestamp || new Date().toISOString()}`,
      `**Page URL**: ${clientInfo.url || "N/A"}`,
      `**Screen Size**: ${clientInfo.screenSize || "N/A"}`,
      `**User Agent**: ${clientInfo.userAgent || "N/A"}`,
      ``,
      `#### Stack Trace:`,
      "```",
      error.stack || "No stack trace available",
      "```",
    ].join("\n")
  }

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReport())
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Failed to copy report to clipboard:", err)
    }
  }

  const getMailtoLink = () => {
    const subject = encodeURIComponent(`[Bug Report] RHHS Classroom Champion - ${error.name || "App Error"}`)
    const body = encodeURIComponent(
      `Hello RHHS Dev Team,\n\nI encountered the following issue while using the application:\n\n${generateReport()}\n\nAdditional Details:\n[Please describe what you clicked or were trying to do here]`
    )
    return `mailto:baraa.elmallah@rhhs.edu.lb?subject=${subject}&body=${body}`
  }

  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-destructive/5 flex flex-col relative overflow-hidden">
        <Header />

        <main id="main-content" className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center relative z-10">
          <m.div
            className="w-full max-w-2xl bg-card border border-destructive/30 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header / Error Icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Runtime Exception Caught
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Something Wilted Unexpectedly
                </h1>
              </div>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
              The application encountered an unexpected issue while processing your request. You don't need to open the browser console — all developer diagnostic details are captured below.
            </p>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              <Button
                onClick={() => reset()}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>

              <Button
                onClick={handleCopyReport}
                variant="outline"
                className="w-full rounded-xl border-border hover:bg-muted font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-emerald-500" /> Copied Report!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" /> Copy Error Info
                  </>
                )}
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-border hover:bg-muted font-medium"
              >
                <a href={getMailtoLink()} target="_blank" rel="noopener noreferrer">
                  <Mail className="mr-2 h-4 w-4 text-blue-500" /> Report Issue
                </a>
              </Button>
            </div>

            {/* Structured Error Details Card */}
            <div className="bg-muted/50 border border-border/80 rounded-xl p-4 mb-4 space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/50">
                <span className="text-muted-foreground font-semibold">Error Message:</span>
                <span className="text-destructive font-bold break-all text-left sm:text-right">
                  {error.message || "An unknown exception occurred."}
                </span>
              </div>

              {error.digest && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-semibold">Digest Reference:</span>
                  <span className="text-foreground bg-background px-2 py-0.5 rounded border border-border/50">
                    {error.digest}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/50">
                <span className="text-muted-foreground font-semibold">Request Location:</span>
                <span className="text-foreground truncate max-w-xs">{clientInfo.url || "/"}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-muted-foreground font-semibold">Timestamp:</span>
                <span className="text-muted-foreground">{clientInfo.timestamp || "Just now"}</span>
              </div>
            </div>

            {/* Collapsible Stack Trace */}
            {error.stack && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowStack(!showStack)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground py-2 px-1 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" /> Technical Stack Trace
                  </span>
                  {showStack ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showStack && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 p-3 bg-zinc-950 text-zinc-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-border/40 max-h-56 scrollbar-thin"
                  >
                    <pre className="whitespace-pre-wrap break-all">{error.stack}</pre>
                  </m.div>
                )}
              </div>
            )}

            {/* Bottom Return Action */}
            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5" /> Report goes to Technical Team
              </span>
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link href="/">
                  <Home className="mr-1.5 h-4 w-4" /> Back to Home
                </Link>
              </Button>
            </div>
          </m.div>
        </main>
      </div>
    </LazyMotionProvider>
  )
}
