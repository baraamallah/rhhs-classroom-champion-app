"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Copy, Check, RefreshCw, Home, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [copied, setCopied] = useState(false)
  const [timestamp, setTimestamp] = useState("")

  useEffect(() => {
    setTimestamp(new Date().toLocaleString())
  }, [])

  const generateReport = () => {
    return [
      `### 🐛 RHHS Classroom Champion - Critical Root Error Report`,
      ``,
      `**Error Message**: ${error.message || "Unknown root error"}`,
      `**Digest ID**: ${error.digest || "None"}`,
      `**Timestamp**: ${timestamp || new Date().toISOString()}`,
      `**URL**: ${typeof window !== "undefined" ? window.location.href : "N/A"}`,
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
      console.error("Failed to copy report:", err)
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Critical Application Error
              </span>
              <h1 className="text-2xl font-bold text-white">Application Disconnected</h1>
            </div>
          </div>

          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            A critical system error occurred. You can instantly copy the full diagnostic report below and share it with the RHHS technical team.
          </p>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-6 font-mono text-xs space-y-2">
            <div className="text-red-400 font-semibold break-all">
              {error.message || "Unexpected critical error."}
            </div>
            {error.digest && (
              <div className="text-neutral-500">
                Digest: <span className="text-neutral-300">{error.digest}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Button
              onClick={() => reset()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Reloading App
            </Button>

            <Button
              onClick={handleCopyReport}
              variant="outline"
              className="w-full border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-emerald-400" /> Copied Diagnostics!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy Diagnostic Report
                </>
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <a
              href="/"
              className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" /> Return to Leaderboard Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
