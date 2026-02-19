"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { Confetti } from "@/components/confetti"
import { CelebrationAnimation } from "@/components/celebration-animation"
import { TrophyIcon, StarIcon, MedalIcon, CrownIcon } from "@/components/icons"
import { getPublicMonthlyWinners, getPublicTopClassroomsByDivision } from "@/app/actions/public-winners-actions"
import { getWinnersPageVisibility } from "@/app/actions/winners-page-actions"
import { getClassroomWinCounts } from "@/app/actions/win-count-actions"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, Eye, EyeOff } from "lucide-react"
import { WinnerCertificateModal } from "@/components/winner-certificate-modal"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"

const DIVISIONS = DIVISION_OPTIONS.map(opt => opt.value)
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
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

interface LeaderboardEntry {
  classroom: {
    id: string
    name: string
    grade: string
    division?: string
  }
  totalScore: number
  averageScore: number
  evaluationCount: number
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
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({})
  const [winCounts, setWinCounts] = useState<Record<string, number>>({})
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [celebratingDivision, setCelebratingDivision] = useState<string | null>(null)
  
  // Modal state
  const [selectedWinner, setSelectedWinner] = useState<SelectedWinner | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    checkVisibility()
  }, [])

  useEffect(() => {
    if (visible) {
      loadData()
    }
  }, [visible, selectedYear, selectedMonth])

  const checkVisibility = async () => {
    try {
      setLoading(true)
      const result = await getWinnersPageVisibility()
      if (result.success) {
        const isVisible = result.visible ?? true
        setVisible(isVisible)
        if (!isVisible) {
          router.replace("/")
          return
        }
      } else {
        // Default to visible if check fails
        setVisible(true)
      }
    } catch (error) {
      console.error("[WinnersPage] Visibility check failed:", error)
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    
    // Load win counts
    const winCountsResult = await getClassroomWinCounts()
    if (winCountsResult.success && winCountsResult.data) {
      setWinCounts(winCountsResult.data)
    }
    
    // Load winners
    const winnersResult = await getPublicMonthlyWinners(selectedYear, selectedMonth)
    if (winnersResult.success) {
      setWinners(winnersResult.data || [])
    }

    // Load leaderboards for each division
    const leaderboardMap: Record<string, LeaderboardEntry[]> = {}
    for (const division of DIVISIONS) {
      const result = await getPublicTopClassroomsByDivision(division, selectedYear, selectedMonth)
      if (result.success && result.data) {
        leaderboardMap[division] = result.data.map((item: any) => ({
          classroom: item.classroom,
          totalScore: item.totalScore,
          averageScore: item.averageScore,
          evaluationCount: item.evaluationCount,
        }))
      }
    }
    setLeaderboards(leaderboardMap)
    setLoading(false)

    // Trigger confetti for winners
    if (winnersResult.success && winnersResult.data && winnersResult.data.length > 0) {
      setTimeout(() => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }, 500)
    }
  }

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
      winCount: classroomId ? winCounts[classroomId] : undefined
    })
    setIsModalOpen(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedWinner(null)
  }

  if (!visible) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <Header />
        <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <TrophyIcon className="h-16 w-16 text-primary" />
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />
      <Confetti active={showConfetti} />
      <CelebrationAnimation
        show={celebratingDivision !== null}
        title={`${celebratingDivision} Winner!`}
        subtitle="Congratulations!"
      />

      {/* Winner Certificate Modal */}
      <WinnerCertificateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        winner={selectedWinner}
      />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center justify-center gap-3 mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrophyIcon className="h-20 w-20 text-yellow-500 drop-shadow-lg" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-500 via-primary to-yellow-500 bg-clip-text text-transparent">
              Monthly Champions
            </h1>
          </motion.div>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Celebrating our eco-friendly classroom champions
          </motion.p>

          {/* Month/Year Selector */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-4 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent border-none outline-none text-foreground font-medium"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent border-none outline-none text-foreground font-medium"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              disabled={loading}
              className="bg-card/80 backdrop-blur-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </motion.div>

          {/* Click hint */}
          <motion.p
            className="text-sm text-muted-foreground mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Click on any winner to view their certificate
          </motion.p>
        </motion.div>

        {/* Winners by Division - Only show Top 3 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {DIVISIONS.map((division, divIndex) => {
            const winner = winners.find(w => w.division === division)
            const leaderboard = leaderboards[division] || []
            // Only show top 3 when winner is declared
            const topThree = winner ? leaderboard.slice(0, 3) : []

            return (
              <motion.div
                key={division}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: divIndex * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden ${
                    winner ? "border-2 border-yellow-500 shadow-lg shadow-yellow-500/20" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    {/* Division Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-foreground">{getDivisionDisplayName(division)}</h3>
                      {winner && (
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <CrownIcon className="h-6 w-6 text-yellow-500" />
                        </motion.div>
                      )}
                    </div>

                    {/* Winner Display */}
                    {winner ? (
                      <div className="space-y-4">
                        {/* Top 3 Winners - All Visible Directly */}
                        <div className="space-y-3">
                          {topThree.map((entry, index) => {
                            const rank = index + 1
                            const isChampion = rank === 1
                            
                            return (
                              <motion.div
                                key={entry.classroom.id}
                                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                                  rank === 1 
                                    ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10" 
                                    : rank === 2 
                                    ? "bg-gradient-to-br from-gray-400/20 to-gray-300/10 border-gray-400/50" 
                                    : "bg-gradient-to-br from-amber-600/20 to-orange-500/10 border-amber-600/50"
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rank * 0.2 }}
                                onClick={() => handleWinnerClick(
                                  entry.classroom.name,
                                  entry.classroom.grade,
                                  division,
                                  rank,
                                  entry.totalScore,
                                  entry.averageScore,
                                  entry.evaluationCount,
                                  entry.classroom.id
                                )}
                              >
                                {/* Rank Badge */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                      rank === 1 ? "bg-yellow-500/30" : rank === 2 ? "bg-gray-400/30" : "bg-amber-600/30"
                                    }`}>
                                      {rank === 1 && <TrophyIcon className="h-5 w-5 text-yellow-500" />}
                                      {rank === 2 && <MedalIcon className="h-5 w-5 text-gray-400" />}
                                      {rank === 3 && <MedalIcon className="h-5 w-5 text-amber-600" />}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${
                                          rank === 1 ? "text-yellow-600 dark:text-yellow-400" 
                                          : rank === 2 ? "text-gray-500 dark:text-gray-400" 
                                          : "text-amber-700 dark:text-amber-500"
                                        }`}>
                                          {rank === 1 ? "Champion" : rank === 2 ? "2nd Place" : "3rd Place"}
                                        </span>
                                      </div>
                                      <p className="font-bold text-lg text-foreground">{entry.classroom.name}</p>
                                      <p className="text-sm text-muted-foreground">Grade {entry.classroom.grade}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-foreground">{entry.totalScore}</p>
                                    <p className="text-xs text-muted-foreground">points</p>
                                  </div>
                                </div>

                                {/* Stats Row */}
                                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center">
                                    <span className="text-muted-foreground">Avg Score</span>
                                    <p className="font-semibold">{entry.averageScore.toFixed(1)}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-muted-foreground">Evaluations</span>
                                    <p className="font-semibold">{entry.evaluationCount}</p>
                                  </div>
                                  <div className="text-center">
                                    {winCounts[entry.classroom.id] > 0 && (
                                      <>
                                        <span className="text-muted-foreground">Total Wins</span>
                                        <p className="font-semibold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                                          <TrophyIcon className="h-3 w-3" />
                                          {winCounts[entry.classroom.id]}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Click indicator */}
                                <div className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        </motion.div>
                        <p className="text-sm font-medium">Winners Not Yet Declared</p>
                        <p className="text-xs mt-1">Check back soon for {MONTHS[selectedMonth - 1]} winners</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Summary Stats */}
        {winners.length > 0 && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-card/80 backdrop-blur-sm border border-border">
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">
                  {winners.length} Division{winners.length !== 1 ? 's' : ''} Declared
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <span className="text-sm text-muted-foreground">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
