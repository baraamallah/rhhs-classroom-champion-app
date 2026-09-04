"use client"

import React, { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { Download, Share2, PlusSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const PWA_DISMISSED_KEY = "pwa_install_dismissed"
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) {
      return
    }

    // 2. Check dismissal cooldown
    try {
      const dismissedTimestamp = localStorage.getItem(PWA_DISMISSED_KEY)
      if (dismissedTimestamp) {
        const timeElapsed = Date.now() - parseInt(dismissedTimestamp, 10)
        if (timeElapsed < DISMISS_DURATION_MS) {
          return // User explicitly chose "Not Now" within the past 7 days
        }
      }
    } catch {
      // Ignore storage errors
    }

    // 3. Detect iOS / iPadOS (Safari & iOS 16.4+ modern browsers)
    const ua = window.navigator.userAgent
    const isIosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))

    if (isIosDevice) {
      startTransition(() => {
        setIsIos(true)
        setIsVisible(true)
      })
    }

    // 4. Listen for Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      startTransition(() => {
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setIsVisible(true)
      })
    }

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      startTransition(() => {
        setDeferredPrompt(null)
        setIsVisible(false)
      })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setIsVisible(false)
      }
    } catch {
      // Prompt error or unsupported
    } finally {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString())
    } catch {
      // Ignore storage errors
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <aside
      aria-label="Install App Banner"
      className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3.5">
        <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center p-1">
          <Image
            src="/Eco Champ.png"
            alt="RHHS Eco Champion Logo"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Install RHHS Eco Champion
            </h2>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
              PWA
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Install the web app for instant access, offline rankings, and full-screen experience.
          </p>

          {isIos ? (
            <div className="mt-3">
              {showIosGuide ? (
                <div className="p-2.5 rounded-lg bg-muted/60 border border-border/60 text-xs text-foreground space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Share2 className="h-4 w-4 shrink-0" />
                    <span>1. Tap Share in your browser bar</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <PlusSquare className="h-4 w-4 shrink-0" />
                    <span>2. Select &apos;Add to Home Screen&apos;</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 text-primary font-medium"
                    onClick={() => setShowIosGuide(true)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    How to Install on iOS
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-11 text-xs text-muted-foreground"
                    onClick={handleDismiss}
                  >
                    Not Now
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="min-h-11 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                onClick={handleInstallClick}
              >
                <Download className="h-3.5 w-3.5" />
                Install App
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="min-h-11 text-xs text-muted-foreground"
                onClick={handleDismiss}
              >
                Not Now
              </Button>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1.5 min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Dismiss installation prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
