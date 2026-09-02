"use client"

import { useEffect, useState } from "react"
import { m } from "framer-motion"
import { Header } from "@/components/layout/header"
import { SimpleClassroomCard } from "@/components/features/leaderboard/simple-classroom-card"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"
import { getClassrooms, getEvaluationsByDateRange, getEvaluations } from "@/lib/supabase-data"
import { getLeaderboardPointsSetting, getCalculationMode, getDefaultMonthSettings, getWinnerRevealMode } from "@/app/actions/winners-page-actions"
import { CalculationAnimation } from "@/components/features/animations/calculation-animation"
import { WinnerRevealAnimation } from "@/components/features/animations/winner-reveal-animation"

import { LeafIcon } from "@/components/common/icons"
import type { ClassroomScore } from "@/lib/types"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

const FloatingLeaf = ({ delay = 0, x = 0 }: { delay?: number, x?: number }) => (
  <m.div
    className="absolute text-primary/20"
    initial={{ y: -20, x, opacity: 0 }}
    animate={{
      y: [null, 100, 0],
      x: [null, x + 20, x - 10, x],
      opacity: [0, 0.6, 0.3, 0]
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      repeatDelay: 2
    }}
  >
    <LeafIcon className="h-8 w-8" />
  </m.div>
)

export default function HomePage() {
  const [leaderboard, setLeaderboard] = useState<ClassroomScore[]>([])
  const [loading, setLoading] = useState(true)
  const [showMonthly, setShowMonthly] = useState(true)
  const [calculationMode, setCalculationMode] = useState(false)
  const [winnerRevealMode, setWinnerRevealMode] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingResult, classrooms, calcModeResult, winnerRevealResult, monthSettingsResult] = await Promise.all([
          getLeaderboardPointsSetting(),
          getClassrooms(),
          getCalculationMode(),
          getWinnerRevealMode(),
          getDefaultMonthSettings()
        ])

        const isMonthly = settingResult.success ? (settingResult.showMonthly ?? true) : true
        setShowMonthly(isMonthly)
        setCalculationMode(calcModeResult.success ? (calcModeResult.enabled ?? false) : false)
        setWinnerRevealMode(winnerRevealResult.success ? (winnerRevealResult.enabled ?? false) : false)

        let evaluations
        if (isMonthly) {
          let startDate, endDate

          if (monthSettingsResult.success && monthSettingsResult.leaderboardMonth) {
            const frozenDate = new Date(monthSettingsResult.leaderboardMonth.year, monthSettingsResult.leaderboardMonth.month - 1, 1)
            startDate = format(startOfMonth(frozenDate), "yyyy-MM-dd")
            endDate = format(endOfMonth(frozenDate), "yyyy-MM-dd")
          } else {
            const now = new Date()
            startDate = format(startOfMonth(now), "yyyy-MM-dd")
            endDate = format(endOfMonth(now), "yyyy-MM-dd")
          }

          evaluations = await getEvaluationsByDateRange(startDate, endDate)
        } else {
          evaluations = await getEvaluations()
        }

        const board = calculateLeaderboard(evaluations, classrooms)
        setLeaderboard(board)
      } catch (error) {
        console.error("Error loading leaderboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5">
        <Header />

        <main id="main-content" className="container mx-auto px-4 py-12 relative overflow-hidden">
          {/* Floating Leaves Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <FloatingLeaf delay={0} x={100} />
            <FloatingLeaf delay={2} x={300} />
            <FloatingLeaf delay={4} x={500} />
            <FloatingLeaf delay={1} x={700} />
            <FloatingLeaf delay={3} x={900} />
          </div>

          {/* Animated Hero Section */}
          <m.div
            className="text-center mb-16 relative z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <m.div
              className="inline-flex items-center justify-center gap-3 mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <LeafIcon className="h-16 w-16 text-primary drop-shadow-lg" />
              </m.div>
              <h1 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-primary via-green-600 to-primary bg-clip-text text-transparent">
                Green Classrooms
              </h1>
            </m.div>

            <m.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Celebrating environmental excellence across our school community
            </m.p>
          </m.div>

          {/* All Classrooms List */}
          {loading ? (
            <div className="text-center py-12">
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <LeafIcon className="h-12 w-12 text-primary mx-auto" />
              </m.div>
            </div>
          ) : calculationMode ? (
            <CalculationAnimation />
          ) : winnerRevealMode ? (
            <WinnerRevealAnimation />
          ) : leaderboard.length === 0 ? (
            <m.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-muted-foreground">No evaluations yet. Check back soon!</p>
            </m.div>
          ) : (
            <Tabs defaultValue="Pre-School" className="w-full max-w-4xl mx-auto mb-16 relative z-10">
              <div className="sticky top-17.5 z-40 -mx-4 px-4 pb-4 pt-2 bg-background/80 backdrop-blur-md border-b border-border/40 mb-8 transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200">
                <div className="relative max-w-4xl mx-auto">
                  {/* Gradient Masks for Scroll Indication */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-linear-to-r from-background/80 to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-linear-to-l from-background/80 to-transparent z-10 pointer-events-none" />

                  <div className="flex justify-start sm:justify-center overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                    <TabsList className="inline-flex h-auto p-1.5 bg-muted/50 backdrop-blur-sm rounded-full border border-border/50 shadow-sm min-w-max">
                      {DIVISION_OPTIONS.map((option) => (
                        <TabsTrigger
                          key={option.value}
                          value={option.value}
                          className="rounded-full px-4 py-2 text-sm font-medium transition-[background-color,border-color,color,box-shadow,opacity,transform] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md snap-center"
                        >
                          {option.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
              </div>

              {DIVISION_OPTIONS.map((option) => {
                const filteredLeaderboard = leaderboard.filter(c => c.classroom.division === option.value);

                return (
                  <TabsContent key={option.value} value={option.value} className="mt-0">
                    <m.div
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {filteredLeaderboard.length === 0 ? (
                        <m.div
                          className="text-center py-12 text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl border border-border/50"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <LeafIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                          <p>No classrooms found in this division.</p>
                        </m.div>
                      ) : (
                        filteredLeaderboard.map((classroom, index) => (
                          <m.div
                            key={`${classroom.classroom.id}-${option.value}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index, duration: 0.4, ease: "easeOut" }}
                          >
                            <SimpleClassroomCard
                              classroom={classroom}
                              rank={index + 1}
                            />
                          </m.div>
                        ))
                      )}
                    </m.div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          {/* Simple How It Works */}
          <m.div
            className="max-w-3xl mx-auto mb-16 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-8 text-center shadow-lg">
              <h3 className="text-2xl font-semibold text-foreground mb-4">How It Works</h3>
              <p className="text-muted-foreground mb-4">
                The Supervisors Evaluate Each Classroom Using Smart, Eco-Focused Criteria — From Efficient Energy Use and Intelligent Waste Management to Innovative Environmental Care Practices.
              </p>
              <m.p
                className="text-primary font-medium"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                The higher your Eco-Score, the better your ranking!
              </m.p>
            </div>
          </m.div>
        </main>
      </div>
    </LazyMotionProvider>
  )
}
