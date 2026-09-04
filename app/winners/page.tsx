"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { m } from "framer-motion"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { Confetti } from "@/components/features/animations/confetti"
import { CelebrationAnimation } from "@/components/features/animations/celebration-animation"
import { TrophyIcon, CrownIcon } from "@/components/common/icons"
import { getPublicMonthlyWinners } from "@/app/actions/public-winners-actions"
import { getWinnersPageVisibility, getDefaultMonthSettings } from "@/app/actions/winners-page-actions"
import { getClassroomWinCounts } from "@/app/actions/win-count-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, Eye, ArrowLeft, Award, Sparkles } from "lucide-react"
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
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [winners, setWinners] = useState<Winner[]>([])
  const [winCounts, setWinCounts] = useState<Record<string, number>>({})
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [celebratingDivision] = useState<string | null>(null)
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
        if (winnerData.length > 0) triggerConfetti(3000)
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
    setIsModalOpen(true)
    triggerConfetti(2000)
  }

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
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 pb-16">
        <Header />
        <Confetti active={showConfetti} />
        <CelebrationAnimation show={celebratingDivision !== null} title={`${celebratingDivision} Winner!`} subtitle="Congratulations!" />
        <WinnerCertificateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} winner={selectedWinner} />

        <main id="main-content" className="container mx-auto px-4 pt-8 pb-12">
          <WinnersHero
            loading={loading}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onRefresh={loadData}
          />
          <DivisionWinnersGrid winners={winners} winCounts={winCounts} selectedMonth={selectedMonth} onWinnerClick={handleWinnerClick} />
          <WinnersSummary winnersCount={winners.length} selectedMonth={selectedMonth} selectedYear={selectedYear} />
        </main>
      </div>
    </LazyMotionProvider>
  )
}

function WinnersLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5">
      <Header />
      <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <m.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <TrophyIcon className="h-16 w-16 text-primary" />
        </m.div>
      </main>
    </div>
  )
}

function WinnersHero({
  loading,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onRefresh,
}: {
  loading: boolean
  selectedMonth: number
  selectedYear: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onRefresh: () => void
}) {
  return (
    <m.div className="text-center mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      {/* Top Transfer Bar: Return to Leaderboard */}
      <div className="flex items-center justify-start mb-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full gap-2 min-h-11 px-4 bg-card/70 backdrop-blur-md border-border/80 hover:border-primary/50 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 text-primary shrink-0" />
            <span>Back to Live Leaderboard</span>
          </Link>
        </Button>
      </div>

      <m.div className="inline-flex items-center justify-center gap-2.5 sm:gap-3 mb-4 flex-wrap" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <m.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <TrophyIcon className="h-10 w-10 xs:h-14 xs:w-14 sm:h-18 sm:w-18 text-amber-500 drop-shadow-md shrink-0" />
        </m.div>
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-linear-to-r from-amber-500 via-primary to-amber-500 bg-clip-text text-transparent text-center">
          Monthly Champions
        </h1>
      </m.div>

      <m.p className="text-sm xs:text-base sm:text-lg text-muted-foreground max-w-xl mx-auto font-medium px-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        Honoring our highest-achieving green classrooms and environmental champions.
      </m.p>

      {/* Filter & Controls Bar */}
      <m.div className="flex flex-col xs:flex-row items-center justify-center gap-2.5 xs:gap-3 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/80 rounded-full px-3.5 xs:px-4 py-1.5 shadow-xs min-h-11">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <select
            aria-label="Winner month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-transparent border-none outline-hidden text-foreground font-semibold text-xs sm:text-sm cursor-pointer py-1.5"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-border/80" />
          <select
            aria-label="Winner year"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-transparent border-none outline-hidden text-foreground font-semibold text-xs sm:text-sm cursor-pointer py-1.5"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full bg-card/80 backdrop-blur-md border-border/80 hover:border-primary/50 text-xs sm:text-sm font-semibold shadow-xs min-h-11 px-4 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-primary ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </m.div>

      <m.p className="text-xs sm:text-sm text-muted-foreground mt-3 flex items-center justify-center gap-1.5 px-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span>Click on any classroom champion to view & download their official certificate</span>
      </m.p>
    </m.div>
  )
}

function DivisionWinnersGrid({
  winners,
  winCounts,
  selectedMonth,
  onWinnerClick,
}: {
  winners: Winner[]
  winCounts: Record<string, number>
  selectedMonth: number
  onWinnerClick: (classroomName: string, grade: string, division: string, rank: number, totalScore: number, averageScore: number, evaluationCount: number, classroomId?: string) => void
}) {
  return (
    <div className="grid gap-4 xs:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
      {DIVISIONS.map((division, divIndex) => (
        <DivisionWinnerCard
          key={division}
          division={division}
          winner={winners.find((w) => w.division === division)}
          winCounts={winCounts}
          selectedMonth={selectedMonth}
          animationIndex={divIndex}
          onWinnerClick={onWinnerClick}
        />
      ))}
    </div>
  )
}

function DivisionWinnerCard({
  division,
  winner,
  winCounts,
  selectedMonth,
  animationIndex,
  onWinnerClick,
}: {
  division: string
  winner?: Winner
  winCounts: Record<string, number>
  selectedMonth: number
  animationIndex: number
  onWinnerClick: (classroomName: string, grade: string, division: string, rank: number, totalScore: number, averageScore: number, evaluationCount: number, classroomId?: string) => void
}) {
  return (
    <m.div key={division} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: animationIndex * 0.08 }}>
      <Card className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${winner ? "border-amber-400/80 dark:border-amber-500/70 shadow-lg shadow-amber-500/10 bg-linear-to-b from-amber-500/5 via-card to-card" : "border-border/70 bg-card/60"}`}>
        <CardContent className="p-4 xs:p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">{getDivisionDisplayName(division)}</h3>
            </div>
            {winner && (
              <m.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="shrink-0">
                <CrownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </m.div>
            )}
          </div>

          {winner && winner.classrooms ? (
            <WinnerCardBody winner={winner} division={division} winCounts={winCounts} onWinnerClick={onWinnerClick} />
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <m.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                <TrophyIcon className="h-10 w-10 mx-auto mb-3 opacity-30 text-amber-500" />
              </m.div>
              <p className="text-sm font-semibold text-foreground">Results Pending</p>
              <p className="text-xs text-muted-foreground mt-1">Check back soon for {MONTHS[selectedMonth - 1]} winners</p>
            </div>
          )}
        </CardContent>
      </Card>
    </m.div>
  )
}

function WinnerCardBody({
  winner,
  division,
  winCounts,
  onWinnerClick,
}: {
  winner: Winner
  division: string
  winCounts: Record<string, number>
  onWinnerClick: (classroomName: string, grade: string, division: string, rank: number, totalScore: number, averageScore: number, evaluationCount: number, classroomId?: string) => void
}) {
  const classroom = winner.classrooms!

  return (
    <div className="space-y-4">
      <m.div
        key={classroom.id}
        className="relative p-3.5 xs:p-4 rounded-xl border border-amber-500/40 cursor-pointer transition-all duration-300 hover:scale-[1.015] hover:shadow-md hover:shadow-amber-500/15 bg-linear-to-br from-amber-500/15 via-yellow-500/10 to-transparent shadow-xs"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => onWinnerClick(classroom.name, classroom.grade, division, 1, winner.total_score, winner.average_score, winner.evaluation_count, classroom.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 xs:gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 xs:w-11 xs:h-11 rounded-full bg-amber-500/25 border border-amber-500/40 shadow-xs shrink-0">
              <TrophyIcon className="h-5 w-5 xs:h-6 xs:w-6 text-amber-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] xs:text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Monthly Champion
              </span>
              <p className="font-extrabold text-base xs:text-lg text-foreground tracking-tight truncate">{classroom.name}</p>
              <p className="text-xs text-muted-foreground font-medium">Grade {classroom.grade}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl xs:text-2xl font-black text-amber-600 dark:text-amber-400">{winner.total_score}</p>
            <p className="text-[9px] xs:text-[10px] uppercase font-bold text-muted-foreground">points</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-3 gap-1.5 xs:gap-2 text-xs">
          <StatCell label="Avg Score" value={Number(winner.average_score).toFixed(1)} />
          <StatCell label="Evaluations" value={winner.evaluation_count} />
          <div className="text-center min-w-0">
            {winCounts[classroom.id] > 0 ? (
              <>
                <span className="text-[9px] xs:text-[10px] text-muted-foreground font-medium block truncate">Total Wins</span>
                <p className="font-bold text-xs xs:text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <TrophyIcon className="h-3 w-3 shrink-0" />
                  <span>{winCounts[classroom.id]}</span>
                </p>
              </>
            ) : (
              <>
                <span className="text-[9px] xs:text-[10px] text-muted-foreground font-medium block truncate">Rank</span>
                <p className="font-bold text-xs xs:text-sm text-foreground">#1</p>
              </>
            )}
          </div>
        </div>

        {/* View Certificate CTA Button */}
        <div className="mt-3 pt-2">
          <div className="w-full min-h-11 py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <Award className="h-4 w-4 shrink-0" />
            <span>View Certificate</span>
          </div>
        </div>
      </m.div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center min-w-0">
      <span className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground block truncate">{label}</span>
      <p className="font-semibold text-xs xs:text-sm truncate">{value}</p>
    </div>
  )
}

function WinnersSummary({ winnersCount, selectedMonth, selectedYear }: { winnersCount: number; selectedMonth: number; selectedYear: number }) {
  if (winnersCount === 0) return null

  return (
    <m.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
      <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-card/80 backdrop-blur-sm border border-border">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">
            {winnersCount} Division{winnersCount !== 1 ? "s" : ""} Declared
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <span className="text-sm text-muted-foreground">
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </span>
      </div>
    </m.div>
  )
}
