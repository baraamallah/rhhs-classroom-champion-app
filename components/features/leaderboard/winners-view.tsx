"use client"

import { EcoLoader } from "@/components/common/eco-loader"
import type { DisplayMonth } from "@/lib/display-period"

import { useCallback, useEffect, useRef, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { Confetti } from "@/components/features/animations/confetti"
import { TrophyIcon, CrownIcon } from "@/components/common/icons"
import { FirstPlaceLogo } from "@/components/common/podium-logos"
import { getPublicMonthlyWinners } from "@/app/actions/public-winners-actions"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, ArrowLeft, Award, Sparkles, Clock } from "lucide-react"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"

const DIVISIONS = DIVISION_OPTIONS.map((opt) => opt.value)
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

interface Winner {
  id: string
  division: string
  year: number
  month: number
  total_score: number
  win_count: number
  classrooms?: {
    id: string
    name: string
    grade: string
    division?: string
  }
}

export default function WinnersView({ initialPeriod }: { initialPeriod: DisplayMonth }) {
  const [loading, setLoading] = useState(true)
  const [winners, setWinners] = useState<Winner[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const requestRef = useRef(0)
  const [selectedYear, setSelectedYear] = useState(() => initialPeriod.year)
  const [selectedMonth, setSelectedMonth] = useState(() => initialPeriod.month)
  const [showConfetti, setShowConfetti] = useState(false)

  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerConfetti = useCallback((duration: number) => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
    setShowConfetti(true)
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), duration)
  }, [])

  useEffect(
    () => () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
    },
    []
  )

  const loadData = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setLoadError(null)
    setWinners([])
    try {
      const result = await getPublicMonthlyWinners(selectedYear, selectedMonth)
      if (requestId !== requestRef.current) return
      if (!result.success) throw new Error("Unable to load the winners. Please try again.")
      const winnerData = result.data || []
      setWinners(winnerData)
      if (winnerData.length > 0) triggerConfetti(3500)
    } catch (error) {
      if (requestId !== requestRef.current) return
      console.error("[WinnersPage] Failed to load winners:", error)
      setLoadError("Unable to load the winners. Please try again.")
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [selectedMonth, selectedYear, triggerConfetti])

  useEffect(() => {
    void loadData()
    return () => {
      requestRef.current += 1
    }
  }, [loadData])

  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-radial-[at_top] from-amber-500/10 via-background to-background pb-20 selection:bg-amber-500/20 overflow-x-clip">
        <Header />
        <Confetti active={showConfetti} />

        <main id="main-content" className="container mx-auto px-3.5 sm:px-6 pt-6 sm:pt-10 max-w-7xl">
          {/* Hero Section */}
          <WinnersHero
            loading={loading}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            declaredCount={winners.length}
            totalDivisions={DIVISIONS.length}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onRefresh={loadData}
          />

          {loadError && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"
            >
              <p className="font-semibold">{loadError}</p>
              <Button onClick={loadData} variant="outline" className="mt-3">
                Try again
              </Button>
            </div>
          )}
          {loading && <EcoLoader compact title="Loading monthly champions" />}
          {!loading && !loadError && winners.length === 0 && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-dashed border-amber-500/30 bg-card p-8 text-center"
            >
              <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-amber-500" />
              <h2 className="text-xl font-bold">No champions declared yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Official winners for {MONTHS[selectedMonth - 1]} {selectedYear} will appear here once announced.
              </p>
            </div>
          )}
          {/* Division Champions Showcase Plaque Grid */}
          <div
            className={`grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4 mb-12 ${loading || loadError ? "hidden" : ""}`}
          >
            <AnimatePresence mode="popLayout">
              {DIVISIONS.map((division, index) => {
                const divisionWinner = winners.find((w) => w.division === division)
                return (
                  <DivisionPlaqueCard
                    key={division}
                    division={division}
                    winner={divisionWinner}
                    selectedMonthName={MONTHS[selectedMonth - 1]}
                    selectedYear={selectedYear}
                    index={index}
                  />
                )
              })}
            </AnimatePresence>
          </div>

          {/* Footer Summary Banner */}
          <WinnersSummaryBanner
            winnersCount={winners.length}
            totalDivisions={DIVISIONS.length}
            monthName={MONTHS[selectedMonth - 1]}
            year={selectedYear}
          />
        </main>
      </div>
    </LazyMotionProvider>
  )
}

function WinnersHero({
  loading,
  selectedMonth,
  selectedYear,
  declaredCount,
  totalDivisions,
  onMonthChange,
  onYearChange,
  onRefresh
}: {
  loading: boolean
  selectedMonth: number
  selectedYear: number
  declaredCount: number
  totalDivisions: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onRefresh: () => void
}) {
  return (
    <m.div
      className="text-center mb-8 sm:mb-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Return to Leaderboard Transfer Button */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full gap-2 min-h-11 px-4 bg-card/70 backdrop-blur-md border-border/80 hover:border-amber-500/50 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-[color,background-color,border-color,box-shadow,transform,scale,rotate,translate] active:scale-95 cursor-pointer"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Back to Live Leaderboard</span>
          </Link>
        </Button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {declaredCount} of {totalDivisions} Champions Crowned
          </span>
        </div>
      </div>

      {/* Main Title Banner */}
      <m.div
        className="inline-flex items-center justify-center gap-3 mb-3 flex-wrap"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative">
          <m.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <TrophyIcon className="h-11 w-11 xs:h-14 xs:w-14 sm:h-16 sm:w-16 text-amber-500 drop-shadow-xl shrink-0" />
          </m.div>
          <m.div
            className="absolute -top-2 -right-1 text-amber-400"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CrownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </m.div>
        </div>

        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-linear-to-r from-amber-600 via-amber-400 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500 bg-clip-text text-transparent text-center font-serif">
          Monthly Champions
        </h1>
      </m.div>

      <p className="text-sm xs:text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium px-3 leading-relaxed">
        Celebrating Rafic Hariri High School&apos;s Green Classrooms of the Month and their achievements.
      </p>

      {/* Filter & Period Selector Bar */}
      <div className="flex flex-col xs:flex-row items-center justify-center gap-3 mt-6 flex-wrap">
        <div className="flex items-center gap-2 bg-card/90 dark:bg-card/70 backdrop-blur-md border border-amber-500/30 rounded-full px-4 py-1.5 shadow-md shadow-amber-500/5 min-h-11">
          <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
          <select
            aria-label="Winner month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-transparent border-none outline-hidden text-foreground font-bold text-xs sm:text-sm cursor-pointer py-1.5"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1} className="bg-background text-foreground">
                {month}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-border/80" />
          <select
            aria-label="Winner year"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-transparent border-none outline-hidden text-foreground font-bold text-xs sm:text-sm cursor-pointer py-1.5"
          >
            {Array.from(new Set([selectedYear, ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)]))
              .sort((a, b) => b - a)
              .map((year) => (
                <option key={year} value={year} className="bg-background text-foreground">
                  {year}
                </option>
              ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full bg-card/90 dark:bg-card/70 backdrop-blur-md border-border/80 hover:border-amber-500/50 text-xs sm:text-sm font-semibold shadow-xs min-h-11 px-4 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-amber-500 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </m.div>
  )
}

/**
 * Creative Division Plaque Card
 */
function DivisionPlaqueCard({
  division,
  winner,
  selectedMonthName,
  selectedYear,
  index
}: {
  division: string
  winner?: Winner
  selectedMonthName: string
  selectedYear: number
  index: number
}) {
  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl transition-[color,background-color,border-color,box-shadow] duration-300 ${
          winner
            ? "border-2 border-amber-400/80 dark:border-amber-500/70 shadow-lg shadow-amber-500/10 bg-linear-to-b from-amber-500/10 via-card to-card hover:border-amber-400 hover:shadow-amber-500/20"
            : "border border-border/70 bg-card/60"
        }`}
      >
        <CardContent className="p-4 sm:p-6">
          {/* Plaque Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-border/60 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                {getDivisionDisplayName(division)}
              </h3>
            </div>
            {winner ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase">
                <CrownIcon className="w-3 h-3 text-amber-500" />
                <span>Champion</span>
              </div>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2 py-0.5 rounded-md bg-muted">
                Pending
              </span>
            )}
          </div>

          {/* Plaque Body */}
          {winner && winner.classrooms ? (
            <div className="mt-4 space-y-4">
              {/* Champion Presentation Row */}
              <div className="group p-3.5 rounded-2xl bg-linear-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 transition-[color,background-color,border-color,box-shadow] shadow-xs hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 flex items-center justify-center p-1 rounded-xl bg-amber-500/10 group-hover:scale-105 transition-transform">
                      <FirstPlaceLogo className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                        Monthly Laureate
                      </span>
                      <p className="font-extrabold text-base sm:text-lg text-foreground tracking-tight break-words transition-colors">
                        {winner.classrooms.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">Grade {winner.classrooms.grade}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-2xl sm:text-3xl tabular-nums font-black text-amber-600 dark:text-amber-400">
                      {winner.total_score.toLocaleString("en-US")}
                    </p>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">points</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-600/20 bg-emerald-500/10 p-3.5">
                <Award className="h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {winner.win_count} {winner.win_count === 1 ? "win" : "wins"}
                  </p>
                  <p className="text-xs text-muted-foreground">Green Classroom of the Month ? All time</p>
                </div>
              </div>
            </div>
          ) : (
            /* Pending / In-Competition State */
            <div className="py-8 sm:py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-500/60">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-foreground">Awaiting announcement</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                No official champion has been declared for {selectedMonthName} {selectedYear}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </m.div>
  )
}

function WinnersSummaryBanner({
  winnersCount,
  totalDivisions,
  monthName,
  year
}: {
  winnersCount: number
  totalDivisions: number
  monthName: string
  year: number
}) {
  if (winnersCount === 0) return null

  return (
    <m.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
      <div className="inline-flex flex-wrap justify-center items-center gap-3 sm:gap-4 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-card/80 backdrop-blur-md border border-amber-500/30 text-xs sm:text-sm font-medium shadow-md shadow-amber-500/5">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          <span className="font-bold text-foreground">
            {winnersCount} of {totalDivisions} Division Champions Declared
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <span className="text-muted-foreground font-semibold">
          {monthName} {year} Official Records
        </span>
      </div>
    </m.div>
  )
}
