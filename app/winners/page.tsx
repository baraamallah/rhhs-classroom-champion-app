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
import { Calendar, RefreshCw } from "lucide-react"

const DIVISIONS = ['Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute']
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
  const [revealedRanks, setRevealedRanks] = useState<Record<string, number>>({})

  useEffect(() => {
    checkVisibility()
  }, [])

  useEffect(() => {
    if (visible) {
      loadData()
    }
  }, [visible, selectedYear, selectedMonth])

  const checkVisibility = async () => {
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
    setLoading(false)
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

  const handleDivisionClick = (division: string) => {
    setCelebratingDivision(division)
    setShowConfetti(true)
    setTimeout(() => {
      setShowConfetti(false)
      setCelebratingDivision(null)
    }, 2000)
  }

  const revealRank = (division: string, maxRank: number) => {
    const current = revealedRanks[division] || 0
    if (current < maxRank) {
      setRevealedRanks({ ...revealedRanks, [division]: current + 1 })
    }
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
        </motion.div>

        {/* Winners by Division */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {DIVISIONS.map((division, divIndex) => {
            const winner = winners.find(w => w.division === division)
            const leaderboard = leaderboards[division] || []
            const topThree = leaderboard.slice(0, 3)

            return (
              <motion.div
                key={division}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: divIndex * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                    winner ? "border-2 border-yellow-500 shadow-lg shadow-yellow-500/20" : ""
                  }`}
                  onClick={() => handleDivisionClick(division)}
                >
                  <CardContent className="p-6">
                    {/* Division Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-foreground">{division}</h3>
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
                      <motion.div
                        className="space-y-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div className="bg-gradient-to-br from-yellow-500/20 to-primary/20 rounded-lg p-4 border border-yellow-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <TrophyIcon className="h-5 w-5 text-yellow-500" />
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">Winner</span>
                          </div>
                          <p className="font-semibold text-lg">{winner.classrooms?.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">Grade {winner.classrooms?.grade || "N/A"}</p>
                          {winner.classrooms?.id && winCounts[winner.classrooms.id] > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <TrophyIcon className="h-3 w-3 text-yellow-500" />
                              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                {winCounts[winner.classrooms.id]} {winCounts[winner.classrooms.id] === 1 ? 'win' : 'wins'}
                              </span>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-yellow-500/20 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Score</span>
                              <p className="font-bold">{winner.total_score}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg</span>
                              <p className="font-bold">{winner.average_score.toFixed(1)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Evals</span>
                              <p className="font-bold">{winner.evaluation_count}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No winner declared yet</p>
                      </div>
                    )}

                    {/* Top 3 Leaderboard */}
                    {topThree.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Top Performers</p>
                        <div className="space-y-2">
                          {topThree.map((entry, index) => {
                            const rank = index + 1
                            const isRevealed = (revealedRanks[division] || 0) >= rank
                            
                            return (
                              <motion.div
                                key={entry.classroom.id}
                                className={`flex items-center justify-between p-2 rounded-lg border ${
                                  rank === 1 ? "bg-yellow-500/10 border-yellow-500/30" :
                                  rank === 2 ? "bg-gray-400/10 border-gray-400/30" :
                                  "bg-amber-600/10 border-amber-600/30"
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: isRevealed ? 1 : 0.3, x: 0 }}
                                transition={{ delay: rank * 0.2 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  revealRank(division, rank)
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {rank === 1 && <TrophyIcon className="h-4 w-4 text-yellow-500" />}
                                  {rank === 2 && <MedalIcon className="h-4 w-4 text-gray-400" />}
                                  {rank === 3 && <MedalIcon className="h-4 w-4 text-amber-600" />}
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-sm">#{rank}</span>
                                      <span className="text-sm font-medium">{entry.classroom.name}</span>
                                    </div>
                                    {isRevealed && winCounts[entry.classroom.id] > 0 && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <TrophyIcon className="h-2.5 w-2.5 text-yellow-500" />
                                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                          {winCounts[entry.classroom.id]} {winCounts[entry.classroom.id] === 1 ? 'win' : 'wins'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {isRevealed ? `${entry.totalScore} pts` : "???"}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                        {topThree.length > 0 && (revealedRanks[division] || 0) < topThree.length && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              revealRank(division, topThree.length)
                            }}
                          >
                            Reveal All
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Full Leaderboard Section */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">Complete Leaderboard</h2>
          <div className="space-y-6">
            {DIVISIONS.map((division, divIndex) => {
              const leaderboard = leaderboards[division] || []
              if (leaderboard.length === 0) return null

              return (
                <motion.div
                  key={division}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: divIndex * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">{division}</h3>
                      <div className="space-y-2">
                        {leaderboard.map((entry, index) => {
                          const rank = index + 1
                          const isTopThree = rank <= 3

                          return (
                            <motion.div
                              key={entry.classroom.id}
                              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                isTopThree
                                  ? rank === 1
                                    ? "bg-yellow-500/10 border-yellow-500/30 shadow-md"
                                    : rank === 2
                                    ? "bg-gray-400/10 border-gray-400/30"
                                    : "bg-amber-600/10 border-amber-600/30"
                                  : "bg-card border-border hover:bg-muted/50"
                              }`}
                              initial={{ opacity: 0, x: -50 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                  {rank === 1 && <TrophyIcon className="h-6 w-6 text-yellow-500" />}
                                  {rank === 2 && <MedalIcon className="h-6 w-6 text-gray-400" />}
                                  {rank === 3 && <MedalIcon className="h-6 w-6 text-amber-600" />}
                                  {rank > 3 && (
                                    <span className={`font-bold ${isTopThree ? "text-primary" : "text-muted-foreground"}`}>
                                      {rank}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold">{entry.classroom.name}</p>
                                  <p className="text-sm text-muted-foreground">Grade {entry.classroom.grade}</p>
                                  {winCounts[entry.classroom.id] > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <TrophyIcon className="h-3 w-3 text-yellow-500" />
                                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                        {winCounts[entry.classroom.id]} {winCounts[entry.classroom.id] === 1 ? 'win' : 'wins'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{entry.totalScore}</p>
                                <p className="text-xs text-muted-foreground">
                                  Avg: {entry.averageScore.toFixed(1)} • {entry.evaluationCount} evals
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </main>
    </div>
  )
}

