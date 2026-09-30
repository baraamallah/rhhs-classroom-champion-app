"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { Confetti } from "@/components/features/animations/confetti"
import { CelebrationAnimation } from "@/components/features/animations/celebration-animation"
import { TrophyIcon, CrownIcon, StarIcon } from "@/components/common/icons"
import { FirstPlaceLogo } from "@/components/common/podium-logos"
import { getPublicMonthlyWinners } from "@/app/actions/public-winners-actions"
import { getWinnersPageVisibility, getDefaultMonthSettings } from "@/app/actions/winners-page-actions"
import { getCachedWinnersVisibility, setCachedWinnersVisibility } from "@/lib/winners-visibility"
import { getClassroomWinCounts } from "@/app/actions/win-count-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  RefreshCw,
  ArrowLeft,
  Award,
  Sparkles,
  Medal,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  GraduationCap
} from "lucide-react"
import { WinnerCertificateModal } from "@/components/features/leaderboard/winner-certificate-modal"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"

const DIVISIONS = DIVISION_OPTIONS.map((opt) => opt.value)
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface Winner {
  id: string
  division: string
  year: number
  month: number
  total_score: number
  average_score: number
  evaluation_count: number
  classrooms?: {
    id: string
    name: string
    grade: string
    division?: string
  }
}

interface SelectedWinner {
  classroomName: string
  grade: string
  division: string
  rank: number
  totalScore: number
  averageScore: number
  evaluationCount: number
  month: string
  year: number
  winCount?: number
}

export default function WinnersPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(() => getCachedWinnersVisibility(true))
  const [loading, setLoading] = useState(true)
  const [winners, setWinners] = useState<Winner[]>([])
  const [winCounts, setWinCounts] = useState<Record<string, number>>({})
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [celebratingDivision, setCelebratingDivision] = useState<string | null>(null)
  const [selectedWinner, setSelectedWinner] = useState<SelectedWinner | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerConfetti = useCallback((duration: number) => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
    setShowConfetti(true)
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), duration)
  }, [])

  useEffect(() => () => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        setLoading(true)
        const [visibilityResult, monthSettingsResult] = await Promise.all([
          getWinnersPageVisibility(),
          getDefaultMonthSettings(),
        ])
        if (cancelled) return

        const isVisible = visibilityResult.success ? (visibilityResult.visible ?? true) : true
        setVisible(isVisible)
        setCachedWinnersVisibility(isVisible)
        if (!isVisible) {
          router.replace("/")
          return
        }

        if (monthSettingsResult.success && monthSettingsResult.winnersMonth) {
          setSelectedYear(monthSettingsResult.winnersMonth.year)
          setSelectedMonth(monthSettingsResult.winnersMonth.month)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[WinnersPage] Initialization failed:", error)
          setVisible(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void initialize()
    return () => { cancelled = true }
  }, [router])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [winCountsResult, winnersResult] = await Promise.all([
        getClassroomWinCounts(),
        getPublicMonthlyWinners(selectedYear, selectedMonth),
      ])

      if (winCountsResult.success && winCountsResult.data) setWinCounts(winCountsResult.data)
      if (winnersResult.success) {
        const winnerData = winnersResult.data || []
        setWinners(winnerData)
        if (winnerData.length > 0) triggerConfetti(3500)
      }
    } catch (error) {
      console.error("[WinnersPage] Failed to load winners:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, triggerConfetti])

  useEffect(() => {
    if (visible) void loadData()
  }, [visible, loadData])

  const handleWinnerClick = (
    classroomName: string,
    grade: string,
    division: string,
    rank: number,
    totalScore: number,
    averageScore: number,
    evaluationCount: number,
    classroomId?: string
  ) => {
    setSelectedWinner({
      classroomName,
      grade,
      division,
      rank,
      totalScore,
      averageScore,
      evaluationCount,
      month: MONTHS[selectedMonth - 1],
      year: selectedYear,
      winCount: classroomId ? winCounts[classroomId] : undefined,
    })
    setCelebratingDivision(division)
    setIsModalOpen(true)
    triggerConfetti(2500)
    setTimeout(() => setCelebratingDivision(null), 3000)
  }

  // Highest-scoring champion across all declared divisions
  const topOverallWinner = useMemo(() => {
    if (winners.length === 0) return null
    return [...winners].sort((a, b) => b.total_score - a.total_score)[0]
  }, [winners])

  if (!visible) return null

  if (loading) {
    return (
      <LazyMotionProvider>
        <WinnersLoading />
      </LazyMotionProvider>
    )
  }

  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-radial-[at_top] from-amber-500/10 via-background to-background pb-20 selection:bg-amber-500/20 overflow-x-clip">
        <Header />
        <Confetti active={showConfetti} />
        <CelebrationAnimation
          show={celebratingDivision !== null}
          title={`${getDivisionDisplayName(celebratingDivision || "")} Champion!`}
          subtitle="Honoring Exceptional Classroom Excellence!"
        />
        <WinnerCertificateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} winner={selectedWinner} />

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

          {/* School-Wide Grand Champion Spotlight Plaque (if declared) */}
          {topOverallWinner && topOverallWinner.classrooms && (
            <GrandChampionSpotlight
              winner={topOverallWinner}
              winCount={topOverallWinner.classrooms.id ? winCounts[topOverallWinner.classrooms.id] : 0}
              monthName={MONTHS[selectedMonth - 1]}
              year={selectedYear}
              onInspect={() =>
                handleWinnerClick(
                  topOverallWinner.classrooms!.name,
                  topOverallWinner.classrooms!.grade,
                  topOverallWinner.division,
                  1,
                  topOverallWinner.total_score,
                  topOverallWinner.average_score,
                  topOverallWinner.evaluation_count,
                  topOverallWinner.classrooms!.id
                )
              }
            />
          )}

          {/* Division Champions Showcase Plaque Grid */}
          <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4 mb-12">
            <AnimatePresence mode="popLayout">
              {DIVISIONS.map((division, index) => {
                const divisionWinner = winners.find((w) => w.division === division)
                return (
                  <DivisionPlaqueCard
                    key={division}
                    division={division}
                    winner={divisionWinner}
                    winCount={divisionWinner?.classrooms ? winCounts[divisionWinner.classrooms.id] : 0}
                    selectedMonthName={MONTHS[selectedMonth - 1]}
                    selectedYear={selectedYear}
                    index={index}
                    onOpenCertificate={handleWinnerClick}
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

function WinnersLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5">
      <Header />
      <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <m.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20"
        >
          <TrophyIcon className="h-14 w-14 text-amber-500" />
        </m.div>
        <p className="mt-4 text-sm font-bold tracking-wider uppercase text-muted-foreground animate-pulse">
          Summoning Champions Hall of Fame...
        </p>
      </main>
    </div>
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
  onRefresh,
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
          className="rounded-full gap-2 min-h-11 px-4 bg-card/70 backdrop-blur-md border-border/80 hover:border-amber-500/50 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Back to Live Leaderboard</span>
          </Link>
        </Button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{declaredCount} of {totalDivisions} Champions Crowned</span>
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
          <m.div
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
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
          Champions Hall of Fame
        </h1>
      </m.div>

      <p className="text-sm xs:text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium px-3 leading-relaxed">
        Honoring Rafic Hariri High School's cleanest, greenest, and most dedicated classroom laureates.
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
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
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
 * Grand Champion Spotlight: The highest scoring classroom in the whole school for this month
 */
function GrandChampionSpotlight({
  winner,
  winCount,
  monthName,
  year,
  onInspect,
}: {
  winner: Winner
  winCount: number
  monthName: string
  year: number
  onInspect: () => void
}) {
  const classroom = winner.classrooms!

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-3xl p-5 sm:p-7 md:p-8 mb-10 overflow-hidden border-2 sm:border-3 border-amber-500/70 dark:border-amber-400/80 bg-linear-to-br from-amber-500/20 via-yellow-500/10 to-card shadow-xl shadow-amber-500/15"
    >
      {/* Background Radiance & Watermark */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Presentation */}
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 shadow-inner flex items-center justify-center">
              <FirstPlaceLogo className="w-18 h-18 sm:w-22 sm:h-22 drop-shadow-xl" />
            </div>
            <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
              <Flame className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
              <CrownIcon className="w-3.5 h-3.5" />
              <span>School-Wide Grand Champion</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground font-serif tracking-tight">
              {classroom.name}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              Grade {classroom.grade} • {getDivisionDisplayName(winner.division)} Division
            </p>
            <p className="text-xs text-muted-foreground italic">
              Conferred the highest overall hygiene & cleanliness score in {monthName} {year}
            </p>
          </div>
        </div>

        {/* Right Stats & CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center w-full sm:w-auto">
            <div className="p-2 xs:p-2.5 sm:p-3 rounded-xl bg-card/80 border border-amber-500/30 backdrop-blur-xs min-w-0 flex-1 sm:min-w-20">
              <span className="text-[9px] xs:text-[10px] uppercase font-bold text-muted-foreground block truncate">Score</span>
              <p className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400">{winner.total_score}</p>
            </div>
            <div className="p-2 xs:p-2.5 sm:p-3 rounded-xl bg-card/80 border border-amber-500/30 backdrop-blur-xs min-w-0 flex-1 sm:min-w-20">
              <span className="text-[9px] xs:text-[10px] uppercase font-bold text-muted-foreground block truncate">Average</span>
              <p className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400">{Number(winner.average_score).toFixed(1)}</p>
            </div>
            <div className="p-2 xs:p-2.5 sm:p-3 rounded-xl bg-card/80 border border-amber-500/30 backdrop-blur-xs min-w-0 flex-1 sm:min-w-20">
              <span className="text-[9px] xs:text-[10px] uppercase font-bold text-muted-foreground block truncate">Wins</span>
              <p className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400">{winCount || 1}</p>
            </div>
          </div>

          <Button
            onClick={onInspect}
            className="w-full sm:w-auto min-h-12 px-6 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all cursor-pointer text-sm shrink-0"
          >
            <Award className="w-4 h-4 mr-2" />
            <span>Inspect Official Certificate</span>
          </Button>
        </div>
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
  winCount,
  selectedMonthName,
  selectedYear,
  index,
  onOpenCertificate,
}: {
  division: string
  winner?: Winner
  winCount: number
  selectedMonthName: string
  selectedYear: number
  index: number
  onOpenCertificate: (
    classroomName: string,
    grade: string,
    division: string,
    rank: number,
    totalScore: number,
    averageScore: number,
    evaluationCount: number,
    classroomId?: string
  ) => void
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
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 ${
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
                In Competition
              </span>
            )}
          </div>

          {/* Plaque Body */}
          {winner && winner.classrooms ? (
            <div className="mt-4 space-y-4">
              {/* Champion Presentation Row */}
              <div
                onClick={() =>
                  onOpenCertificate(
                    winner.classrooms!.name,
                    winner.classrooms!.grade,
                    division,
                    1,
                    winner.total_score,
                    winner.average_score,
                    winner.evaluation_count,
                    winner.classrooms!.id
                  )
                }
                className="group p-3.5 rounded-2xl bg-linear-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all shadow-xs hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 flex items-center justify-center p-1 rounded-xl bg-amber-500/10 group-hover:scale-105 transition-transform">
                      <FirstPlaceLogo className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                        Monthly Laureate
                      </span>
                      <p className="font-extrabold text-base sm:text-lg text-foreground tracking-tight truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {winner.classrooms.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Grade {winner.classrooms.grade}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                      {winner.total_score}
                    </p>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">points</p>
                  </div>
                </div>

                {/* Performance Metrics Pill Grid */}
                <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold block truncate">Average</span>
                    <p className="font-bold text-foreground">{Number(winner.average_score).toFixed(1)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold block truncate">Evaluations</span>
                    <p className="font-bold text-foreground">{winner.evaluation_count}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold block truncate">Distinction</span>
                    <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
                      <TrophyIcon className="w-3 h-3" />
                      <span>{winCount > 0 ? `${winCount} Win${winCount > 1 ? "s" : ""}` : "1st"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* View Certificate CTA Button */}
              <Button
                onClick={() =>
                  onOpenCertificate(
                    winner.classrooms!.name,
                    winner.classrooms!.grade,
                    division,
                    1,
                    winner.total_score,
                    winner.average_score,
                    winner.evaluation_count,
                    winner.classrooms!.id
                  )
                }
                variant="outline"
                className="w-full min-h-11 rounded-xl font-bold bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
              >
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>View Official Certificate</span>
              </Button>
            </div>
          ) : (
            /* Pending / In-Competition State */
            <div className="py-8 sm:py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-500/60">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-foreground">Competition In Progress</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Supervisors are actively conducting evaluations for {selectedMonthName} {selectedYear}. Results will be unveiled soon!
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
  year,
}: {
  winnersCount: number
  totalDivisions: number
  monthName: string
  year: number
}) {
  if (winnersCount === 0) return null

  return (
    <m.div
      className="mt-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="inline-flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-card/80 backdrop-blur-md border border-amber-500/30 text-xs sm:text-sm font-medium shadow-md shadow-amber-500/5">
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
