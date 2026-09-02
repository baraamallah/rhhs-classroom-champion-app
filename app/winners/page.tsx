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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, Eye } from "lucide-react"
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
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5">
        <Header />
        <Confetti active={showConfetti} />
        <CelebrationAnimation show={celebratingDivision !== null} title={`${celebratingDivision} Winner!`} subtitle="Congratulations!" />
        <WinnerCertificateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} winner={selectedWinner} />

        <main id="main-content" className="container mx-auto px-4 py-12">
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
    <m.div className="text-center mb-12" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
      <m.div className="inline-flex items-center justify-center gap-3 mb-6" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <m.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <TrophyIcon className="h-20 w-20 text-yellow-500 drop-shadow-lg" />
        </m.div>
        <h1 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-yellow-500 via-primary to-yellow-500 bg-clip-text text-transparent">
          Monthly Champions
        </h1>
      </m.div>
      <m.p className="text-xl text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        Celebrating our eco-friendly classroom champions
      </m.p>

      <m.div className="flex items-center justify-center gap-4 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-4 py-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select aria-label="Winner month" value={selectedMonth} onChange={(e) => onMonthChange(Number(e.target.value))} className="bg-transparent border-none outline-none text-foreground font-medium">
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          <select aria-label="Winner year" value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))} className="bg-transparent border-none outline-none text-foreground font-medium">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="bg-card/80 backdrop-blur-sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </m.div>

      <m.p className="text-sm text-muted-foreground mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Click on any winner to view their certificate
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
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
    <m.div key={division} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: animationIndex * 0.1 }}>
      <Card className={`relative overflow-hidden ${winner ? "border-2 border-yellow-500 shadow-lg shadow-yellow-500/20" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">{getDivisionDisplayName(division)}</h3>
            {winner && (
              <m.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <CrownIcon className="h-6 w-6 text-yellow-500" />
              </m.div>
            )}
          </div>

          {winner && winner.classrooms ? (
            <WinnerCardBody winner={winner} division={division} winCounts={winCounts} onWinnerClick={onWinnerClick} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <m.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              </m.div>
              <p className="text-sm font-medium">Be here later</p>
              <p className="text-xs mt-1">Check back soon for {MONTHS[selectedMonth - 1]} winners</p>
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
      <div className="space-y-3">
        <m.div
          key={classroom.id}
          className="relative p-4 rounded-lg border-2 cursor-pointer transition-transform hover:scale-[1.02] bg-linear-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onWinnerClick(classroom.name, classroom.grade, division, 1, winner.total_score, winner.average_score, winner.evaluation_count, classroom.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/30">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Champion</span>
                <p className="font-bold text-lg text-foreground">{classroom.name}</p>
                <p className="text-sm text-muted-foreground">Grade {classroom.grade}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{winner.total_score}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
            <StatCell label="Avg Score" value={Number(winner.average_score).toFixed(1)} />
            <StatCell label="Evaluations" value={winner.evaluation_count} />
            <div className="text-center">
              {winCounts[classroom.id] > 0 && (
                <>
                  <span className="text-muted-foreground">Total Wins</span>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                    <TrophyIcon className="h-3 w-3" />
                    {winCounts[classroom.id]}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
        </m.div>
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <span className="text-muted-foreground">{label}</span>
      <p className="font-semibold">{value}</p>
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
