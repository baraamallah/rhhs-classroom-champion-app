"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, Settings, Check, Lock, Info } from "lucide-react"
import { useConsent } from "@/components/providers/consent-provider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function PrivacyConsentBanner() {
  const {
    consent,
    hasDecided,
    isModalOpen,
    openModal,
    closeModal,
    updateConsent,
    acceptAll,
    rejectNonEssential,
  } = useConsent()

  // Modal switches state (defaults to current consent or false for non-essential)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [functionalEnabled, setFunctionalEnabled] = useState(false)

  useEffect(() => {
    if (consent) {
      setAnalyticsEnabled(consent.analytics)
      setFunctionalEnabled(consent.functional)
    } else {
      // Affirmative consent requirement: Non-essential defaults to OFF
      setAnalyticsEnabled(false)
      setFunctionalEnabled(false)
    }
  }, [consent, isModalOpen])

  const handleSaveCustom = () => {
    updateConsent({
      analytics: analyticsEnabled,
      functional: functionalEnabled,
    })
  }

  return (
    <>
      {/* 1. First-Layer Floating Consent Banner */}
      {!hasDecided && (
        <aside
          aria-label="Privacy and Cookie Consent"
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-background/95 dark:bg-card/95 backdrop-blur-md border-t border-border/70 shadow-2xl animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3 max-w-3xl">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mt-0.5">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    Privacy & Storage Preferences
                  </p>
                  <p>
                    We use strictly necessary session cookies and terminal storage to operate the RHHS Classroom Champion platform under Lebanese Law No. 81/2018. With your affirmative consent, we also collect anonymized performance telemetry to optimize loading speeds on school networks.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <Link
                      href="/privacy"
                      className="underline text-primary hover:text-primary/80 font-medium min-h-11 inline-flex items-center"
                    >
                      Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link
                      href="/cookies"
                      className="underline text-primary hover:text-primary/80 font-medium min-h-11 inline-flex items-center"
                    >
                      Cookie & Telemetry Policy
                    </Link>
                  </div>
                </div>
              </div>

              {/* First-Layer Actions with Equal Prominence */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={rejectNonEssential}
                  className="flex-1 sm:flex-none min-h-11 text-xs font-semibold px-4 border-border hover:bg-muted"
                >
                  Essential Only
                </Button>
                <Button
                  variant="outline"
                  onClick={openModal}
                  className="flex-1 sm:flex-none min-h-11 text-xs font-medium px-4 gap-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Customize
                </Button>
                <Button
                  onClick={acceptAll}
                  className="flex-1 sm:flex-none min-h-11 text-xs font-semibold px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Granular Personalization Dialog (Modal) */}
      <Dialog open={isModalOpen} onOpenChange={(open) => (!open ? closeModal() : openModal())}>
        <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-foreground">
                Privacy & Storage Preferences
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Customize which categories of terminal storage and telemetry you allow. You can update your choices at any time via the Cookie Settings link in the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border/60 my-4 space-y-4">
            {/* Category 1: Strictly Necessary */}
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    Strictly Necessary Cookies & Storage
                  </span>
                </div>
                <Badge variant="secondary" className="text-[11px] font-semibold bg-muted text-muted-foreground">
                  Always Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Essential for core site functions, secure supervisor and administrative login sessions (<code className="text-xs bg-muted px-1 rounded">rhhs_session</code>), database write consistency (<code className="text-xs bg-muted px-1 rounded">rhhs_recent_mutation</code>), and interface theme preference (<code className="text-xs bg-muted px-1 rounded">theme</code>). These cannot be disabled.
              </p>
            </div>

            {/* Category 2: Performance & Analytics Telemetry */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Performance & Analytics Telemetry
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Cookie-free, aggregated Web Vitals and route latency diagnostics
                  </p>
                </div>
                <Switch
                  id="analytics-toggle"
                  checked={analyticsEnabled}
                  onCheckedChange={setAnalyticsEnabled}
                  aria-label="Toggle Performance and Analytics Telemetry"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Measures page loading speeds and aggregated stability across Lebanese telecom and school Wi-Fi networks using Vercel Web Analytics and Speed Insights. It does not track individual students, student IDs, or personal IP addresses.
              </p>
            </div>

            {/* Category 3: Functional Preferences */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Functional Experience Preferences
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Client-side terminal storage for state persistence
                  </p>
                </div>
                <Switch
                  id="functional-toggle"
                  checked={functionalEnabled}
                  onCheckedChange={setFunctionalEnabled}
                  aria-label="Toggle Functional Experience Preferences"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Remembers user interface preferences locally in your browser to avoid repetitive promptings and maintain smooth workflow during inspections.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>
              Rafic Hariri High School complies with Lebanese Law No. 81/2018. Student data is processed solely for school educational stewardship without commercial monetization.
            </span>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={rejectNonEssential}
              className="w-full sm:w-auto min-h-11 text-xs"
            >
              Reject Non-Essential
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleSaveCustom}
                className="flex-1 sm:flex-none min-h-11 text-xs font-medium"
              >
                Save Preferences
              </Button>
              <Button
                onClick={acceptAll}
                className="flex-1 sm:flex-none min-h-11 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Accept All
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
