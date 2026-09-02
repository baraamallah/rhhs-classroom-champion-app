"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Sliders,
  Trophy,
  BarChart3,
  Calculator,
  PartyPopper,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  Flame,
} from "lucide-react"
import {
  getAdminSettings,
  setWinnersPageVisibility,
  setLeaderboardPointsSetting,
  setCalculationMode,
  setWinnerRevealMode,
  type AdminSettings,
} from "@/app/actions/winners-page-actions"
import {
  getEvaluationsStatus,
  setEvaluationsStatus,
} from "@/app/actions/evaluation-settings-actions"

interface GlobalSystemControlsProps {
  initialSettings?: AdminSettings
  onSettingsChange?: (settings: AdminSettings) => void
}

export function GlobalSystemControls({
  initialSettings,
  onSettingsChange,
}: GlobalSystemControlsProps) {
  const { toast } = useToast()

  // Master settings state
  const [settings, setSettings] = useState<AdminSettings>(
    initialSettings || {
      winners_page_visible: true,
      leaderboard_show_monthly: true,
      calculation_mode: false,
      winner_reveal_mode: false,
      evaluations_enabled: true,
      winners_display_month: null,
      leaderboard_display_month: null,
    }
  )

  const [loading, setLoading] = useState(initialSettings === undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const hasLoaded = useRef(false)

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings)
      return
    }
    if (hasLoaded.current) return
    hasLoaded.current = true
    loadAllSettings()
  }, [initialSettings])

  const loadAllSettings = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [adminResult, evalResult] = await Promise.all([
        getAdminSettings(),
        getEvaluationsStatus(),
      ])

      const updated: AdminSettings = {
        winners_page_visible: adminResult.settings?.winners_page_visible ?? true,
        leaderboard_show_monthly: adminResult.settings?.leaderboard_show_monthly ?? true,
        calculation_mode: adminResult.settings?.calculation_mode ?? false,
        winner_reveal_mode: adminResult.settings?.winner_reveal_mode ?? false,
        evaluations_enabled: evalResult.success
          ? (evalResult.enabled ?? true)
          : (adminResult.settings?.evaluations_enabled ?? true),
        winners_display_month: adminResult.settings?.winners_display_month ?? null,
        leaderboard_display_month: adminResult.settings?.leaderboard_display_month ?? null,
      }

      setSettings(updated)
      if (onSettingsChange) onSettingsChange(updated)

      if (isManualRefresh) {
        toast({
          title: "System Synced",
          description: "All control parameters reloaded successfully.",
        })
      }
    } catch (error: any) {
      console.error("[GlobalSystemControls] Load error:", error)
      toast({
        title: "Sync Error",
        description: "Failed to reload system settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Toggle handlers
  const handleToggleSubmissions = async () => {
    const nextVal = !settings.evaluations_enabled
    setSavingKey("evaluations_enabled")
    try {
      const res = await setEvaluationsStatus(nextVal)
      if (res.success) {
        setSettings((prev) => ({ ...prev, evaluations_enabled: nextVal }))
        toast({
          title: nextVal ? "Evaluations Opened" : "Evaluations Closed",
          description: nextVal
            ? "Supervisors can now submit new classroom evaluations."
            : "Evaluation submissions are now locked for all supervisors.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Could not update submission status.",
          variant: "destructive",
        })
      }
    } finally {
      setSavingKey(null)
    }
  }

  const handleToggleWinnersVisibility = async () => {
    const nextVal = !settings.winners_page_visible
    setSavingKey("winners_page_visible")
    try {
      const res = await setWinnersPageVisibility(nextVal)
      if (res.success) {
        setSettings((prev) => ({ ...prev, winners_page_visible: nextVal }))
        toast({
          title: nextVal ? "Winners Page Public" : "Winners Page Hidden",
          description: nextVal
            ? "The animated winners showcase is now accessible to all users at /winners."
            : "The winners showcase is now hidden from public navigation.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Could not update visibility.",
          variant: "destructive",
        })
      }
    } finally {
      setSavingKey(null)
    }
  }

  const handleToggleLeaderboardMode = async (showMonthly: boolean) => {
    if (settings.leaderboard_show_monthly === showMonthly) return
    setSavingKey("leaderboard_show_monthly")
    try {
      const res = await setLeaderboardPointsSetting(showMonthly)
      if (res.success) {
        setSettings((prev) => ({ ...prev, leaderboard_show_monthly: showMonthly }))
        toast({
          title: showMonthly ? "Monthly Scoring Active" : "All-Time Scoring Active",
          description: showMonthly
            ? "Homepage leaderboard is now filtering scores for the current calendar month only."
            : "Homepage leaderboard is now computing cumulative points across the entire year.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Could not update points mode.",
          variant: "destructive",
        })
      }
    } finally {
      setSavingKey(null)
    }
  }

  const handleToggleCalculationMode = async (enabled: boolean) => {
    setSavingKey("calculation_mode")
    try {
      const res = await setCalculationMode(enabled)
      if (res.success) {
        setSettings((prev) => ({ ...prev, calculation_mode: enabled }))
        toast({
          title: enabled ? "Calculation Animation Activated" : "Calculation Mode Disabled",
          description: enabled
            ? "Public homepage is now showing the calculation animation instead of scores."
            : "Standard leaderboard view restored on homepage.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Could not update calculation mode.",
          variant: "destructive",
        })
      }
    } finally {
      setSavingKey(null)
    }
  }

  const handleToggleWinnerRevealMode = async (enabled: boolean) => {
    setSavingKey("winner_reveal_mode")
    try {
      const res = await setWinnerRevealMode(enabled)
      if (res.success) {
        setSettings((prev) => ({ ...prev, winner_reveal_mode: enabled }))
        toast({
          title: enabled ? "Winner Reveal Mode Activated" : "Winner Reveal Mode Disabled",
          description: enabled
            ? "Public homepage is now showing the interactive 'Check Winner' reveal button."
            : "Standard leaderboard view restored on homepage.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Could not update winner reveal mode.",
          variant: "destructive",
        })
      }
    } finally {
      setSavingKey(null)
    }
  }

  const handleCopyWinnersUrl = async () => {
    if (typeof window === "undefined") return
    const url = `${window.location.origin}/winners`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      toast({
        title: "Link Copied",
        description: "Direct URL to /winners copied to clipboard.",
      })
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please manually copy /winners.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-card via-card/70 to-muted/20 p-5 sm:p-7 shadow-lg shadow-black/5 backdrop-blur-md space-y-6">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ============================================================ */}
      {/* 1. EXECUTIVE COMMAND HEADER & LIVE STATUS STRIP */}
      {/* ============================================================ */}
      <div className="relative flex flex-col gap-4 border-b border-border/50 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25 shadow-inner">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Global System Controls
              </h2>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5"
              >
                Runtime Engine
              </Badge>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Master control center for public display, scoring aggregation, and supervisor submission workflows.
            </p>
          </div>
        </div>

        {/* Live system state indicators bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Submissions Indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              settings.evaluations_enabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                settings.evaluations_enabled
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span>{settings.evaluations_enabled ? "Intake: Open" : "Intake: Locked"}</span>
          </div>

          {/* Homepage Indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              settings.calculation_mode
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : settings.winner_reveal_mode
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                : "bg-primary/10 text-primary border-primary/30"
            }`}
          >
            {settings.calculation_mode ? (
              <>
                <Calculator className="h-3.5 w-3.5 text-amber-500" />
                <span>HP: Calculating</span>
              </>
            ) : settings.winner_reveal_mode ? (
              <>
                <PartyPopper className="h-3.5 w-3.5 text-purple-500" />
                <span>HP: Winner Reveal</span>
              </>
            ) : (
              <>
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span>HP: Live Ranks</span>
              </>
            )}
          </div>

          {/* Scoring Mode Indicator */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-muted/60 text-muted-foreground border-border/80">
            <span>
              Mode: {settings.leaderboard_show_monthly ? "Monthly" : "All-Time"}
            </span>
          </div>

          {/* Manual Refresh Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAllSettings(true)}
            disabled={refreshing || loading}
            className="h-7.5 rounded-full px-3 text-xs gap-1.5 font-medium border-border/70 hover:bg-muted/80 shadow-xs"
            title="Sync settings with database"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing || loading ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CONTEXTUAL HOMEPAGE OVERRIDE ALERT BANNER */}
      {/* ============================================================ */}
      {settings.calculation_mode ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Calculator className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold flex items-center gap-2">
              <span>Homepage Override Active: Calculation Mode</span>
              <Badge variant="outline" className="border-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px]">
                High Priority
              </Badge>
            </p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Visitors to the homepage will see the animated calculating screen with falling leaves instead of the leaderboard. Disable this toggle when you are ready to display live scores or trigger the winner reveal.
            </p>
          </div>
        </div>
      ) : settings.winner_reveal_mode ? (
        <div className="flex items-start gap-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-4 text-purple-900 dark:text-purple-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
            <PartyPopper className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold flex items-center gap-2">
              <span>Homepage Override Active: Winner Reveal Mode</span>
              <Badge variant="outline" className="border-purple-500/50 bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px]">
                Ceremonial
              </Badge>
            </p>
            <p className="mt-0.5 text-purple-800/90 dark:text-purple-300/80 leading-relaxed">
              The public leaderboard is masked behind an interactive "Check Winner" button. When visitors click it, confetti animates and the champions are unveiled.
            </p>
          </div>
        </div>
      ) : null}

      {/* ============================================================ */}
      {/* 3. PRIMARY SYSTEM ACCESS (ROW 1 - 2 LARGE CARDS) */}
      {/* ============================================================ */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          System Intake & Public Access
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
          {/* CARD 1: SUBMISSIONS CONTROL */}
          <Card className={`relative overflow-hidden border transition-all duration-200 hover:shadow-md ${
            settings.evaluations_enabled
              ? "border-emerald-500/30 bg-card/90"
              : "border-rose-500/30 bg-card/90"
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              settings.evaluations_enabled ? "bg-emerald-500" : "bg-rose-500"
            }`} />
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    settings.evaluations_enabled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  }`}>
                    {settings.evaluations_enabled ? (
                      <Unlock className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">
                        Evaluation Intake
                      </h4>
                      <Badge
                        variant="outline"
                        className={
                          settings.evaluations_enabled
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px]"
                        }
                      >
                        {settings.evaluations_enabled ? "OPEN" : "LOCKED"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Open or close the system for new supervisor evaluations.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleToggleSubmissions}
                  disabled={savingKey === "evaluations_enabled"}
                  size="sm"
                  variant={settings.evaluations_enabled ? "destructive" : "default"}
                  className="rounded-xl shrink-0 font-bold px-3.5 shadow-xs"
                >
                  {savingKey === "evaluations_enabled" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : settings.evaluations_enabled ? (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      Lock System
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5 mr-1.5" />
                      Open System
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                {settings.evaluations_enabled ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Supervisors can actively submit new evaluations and rubrics.
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    System is locked. Supervisors attempting to submit will receive a closed notice.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: WINNERS PAGE ACCESS */}
          <Card className={`relative overflow-hidden border transition-all duration-200 hover:shadow-md ${
            settings.winners_page_visible
              ? "border-primary/30 bg-card/90"
              : "border-border/70 bg-card/90"
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              settings.winners_page_visible ? "bg-amber-500" : "bg-muted-foreground/30"
            }`} />
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    settings.winners_page_visible
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">
                        Winners Showcase Page
                      </h4>
                      <Badge
                        variant="outline"
                        className={
                          settings.winners_page_visible
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                            : "bg-muted text-muted-foreground border-border text-[10px]"
                        }
                      >
                        {settings.winners_page_visible ? "PUBLIC" : "HIDDEN"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toggle public visibility of the animated podium at <code className="font-mono text-foreground font-semibold">/winners</code>.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleToggleWinnersVisibility}
                  disabled={savingKey === "winners_page_visible"}
                  size="sm"
                  variant={settings.winners_page_visible ? "outline" : "default"}
                  className="rounded-xl shrink-0 font-bold px-3.5 shadow-xs"
                >
                  {savingKey === "winners_page_visible" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : settings.winners_page_visible ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                      Hide Page
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Publish Page
                    </>
                  )}
                </Button>
              </div>

              {/* URL & quick actions bar */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-border/50">
                <div className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Public URL:</span>
                  <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-primary border border-border/50">
                    /winners
                  </code>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyWinnersUrl}
                    className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                    title="Copy direct link"
                  >
                    {copiedUrl ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                    title="Open winners page in new tab"
                  >
                    <a href="/winners" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. HOMEPAGE LEADERBOARD & CEREMONY MODES (ROW 2 - 3 BALANCED CARDS) */}
      {/* ============================================================ */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          Homepage Display & Ceremony Modes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {/* CARD 3: LEADERBOARD SCORING MODE (MONTHLY VS ALL-TIME) */}
          <Card className="relative overflow-hidden border border-border/80 bg-card/90 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <BarChart3 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        Leaderboard Points Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Score calculation formula
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold shrink-0"
                  >
                    {settings.leaderboard_show_monthly ? "Monthly" : "All-Time"}
                  </Badge>
                </div>

                {/* Segmented Pill Selector */}
                <div className="grid grid-cols-2 rounded-xl bg-muted/70 p-1 border border-border/60">
                  <button
                    type="button"
                    onClick={() => handleToggleLeaderboardMode(false)}
                    disabled={savingKey === "leaderboard_show_monthly"}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !settings.leaderboard_show_monthly
                        ? "bg-background text-foreground shadow-xs border border-border/40"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All-Time
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleLeaderboardMode(true)}
                    disabled={savingKey === "leaderboard_show_monthly"}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settings.leaderboard_show_monthly
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                {settings.leaderboard_show_monthly ? (
                  <span>
                    <strong className="text-foreground">Monthly Active:</strong> Resets visually on the 1st of each month. Only evaluations within the active month count.
                  </span>
                ) : (
                  <span>
                    <strong className="text-foreground">All-Time Active:</strong> Aggregates every approved evaluation across the full school year.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: CALCULATION MODE */}
          <Card className={`relative overflow-hidden border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
            settings.calculation_mode ? "border-amber-500/40 bg-amber-500/5" : "border-border/80 bg-card/90"
          }`}>
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      settings.calculation_mode
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      <Calculator className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        Calculation Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Tallying & intermission screen
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      settings.calculation_mode
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]"
                        : "bg-muted text-muted-foreground border-border text-[10px]"
                    }
                  >
                    {settings.calculation_mode ? "ACTIVE" : "STANDBY"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 border border-border/50">
                  <span className="text-xs font-semibold text-foreground">
                    Animation Mask
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {settings.calculation_mode ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={settings.calculation_mode}
                      onCheckedChange={handleToggleCalculationMode}
                      disabled={savingKey === "calculation_mode"}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                {settings.calculation_mode ? (
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    Leaderboard is hidden. Visitors see the themed leaf & tree calculation animation.
                  </span>
                ) : (
                  <span>
                    Standard leaderboard ranking is rendered on the public homepage.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CARD 5: WINNER REVEAL MODE */}
          <Card className={`relative overflow-hidden border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
            settings.winner_reveal_mode ? "border-purple-500/40 bg-purple-500/5" : "border-border/80 bg-card/90"
          }`}>
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      settings.winner_reveal_mode
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      <PartyPopper className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        Winner Reveal Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Confetti ceremony trigger
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      settings.winner_reveal_mode
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]"
                        : "bg-muted text-muted-foreground border-border text-[10px]"
                    }
                  >
                    {settings.winner_reveal_mode ? "ACTIVE" : "STANDBY"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 border border-border/50">
                  <span className="text-xs font-semibold text-foreground">
                    Reveal Button
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {settings.winner_reveal_mode ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={settings.winner_reveal_mode}
                      onCheckedChange={handleToggleWinnerRevealMode}
                      disabled={savingKey === "winner_reveal_mode"}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                {settings.winner_reveal_mode ? (
                  <span className="text-purple-700 dark:text-purple-300 font-medium">
                    Homepage features an interactive "Check Winner" button with celebratory confetti.
                  </span>
                ) : (
                  <span>
                    Leaderboard rankings are shown directly without an interactive reveal button.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
