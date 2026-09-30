"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { m, AnimatePresence } from "framer-motion"
import { SimpleClassroomCard } from "@/components/features/leaderboard/simple-classroom-card"
import { LeaderboardPodium } from "@/components/features/leaderboard/leaderboard-podium"
import { CalculationAnimation } from "@/components/features/animations/calculation-animation"
import { WinnerRevealAnimation } from "@/components/features/animations/winner-reveal-animation"
import { LeafIcon, TrophyIcon } from "@/components/common/icons"
import type { ClassroomScore } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Compass,
  GraduationCap,
  Laptop,
  Search,
  X,
  Trophy,
  ListOrdered,
  Award,
} from "lucide-react"
import {
  setCachedWinnersVisibility,
  fetchWinnersVisibility,
  onWinnersVisibilityChange,
} from "@/lib/winners-visibility"

interface LeaderboardViewProps {
  leaderboard: ClassroomScore[]
  calculationMode: boolean
  winnerRevealMode: boolean
  winnersPageVisible?: boolean
}

export function LeaderboardView({
  leaderboard,
  calculationMode,
  winnerRevealMode,
  winnersPageVisible = false,
}: LeaderboardViewProps) {
  const [isWinnersVisible, setIsWinnersVisible] = useState(winnersPageVisible)
  const [activeDivision, setActiveDivision] = useState<string>("Pre-School")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"podium" | "list">("podium")

  useEffect(() => {
    if (typeof winnersPageVisible === "boolean") {
      setCachedWinnersVisibility(winnersPageVisible)
      setIsWinnersVisible(winnersPageVisible)
    }

    const unsubscribe = onWinnersVisibilityChange((next) => {
      setIsWinnersVisible(next)
    })

    if (typeof winnersPageVisible !== "boolean") {
      void fetchWinnersVisibility().then((res) => {
        setIsWinnersVisible(res)
      })
    }

    return () => {
      unsubscribe()
    }
  }, [winnersPageVisible])


  // Count per division
  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    DIVISION_OPTIONS.forEach((opt) => {
      counts[opt.value] = leaderboard.filter((c) => c.classroom.division === opt.value).length
    })
    return counts
  }, [leaderboard])

  const getDivisionIcon = (division: string) => {
    switch (division) {
      case "Pre-School":
        return <Sparkles className="h-3.5 w-3.5" />
      case "Elementary":
        return <BookOpen className="h-3.5 w-3.5" />
      case "Middle School":
        return <Compass className="h-3.5 w-3.5" />
      case "High School":
        return <GraduationCap className="h-3.5 w-3.5" />
      case "Technical Institute":
        return <Laptop className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 pb-20 relative overflow-x-clip">
        {/* Ambient Top Glow Orbs - Contained to prevent horizontal expansion */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-6 relative">
          <m.div
            className="text-center mb-8 relative z-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Sustainability Badge Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-4 shadow-2xs">
              <LeafIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Official School Sustainability Competition</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-linear-to-r from-emerald-600 via-primary to-green-600 bg-clip-text text-transparent mb-3">
              Green Classrooms
            </h1>

            <p className="text-sm xs:text-base sm:text-lg text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed px-2">
              Celebrating daily environmental leadership, cleanliness, and eco-conscious habits across Rafic Hariri High School.
            </p>

            {/* Prominent Winners Transfer Button / Banner */}
            {isWinnersVisible && (
              <div className="mt-6 flex items-center justify-center">
                <Link
                  href="/winners"
                  className="group relative inline-flex items-center gap-2.5 min-h-11 px-4 xs:px-5 py-2.5 rounded-full border border-amber-500/40 bg-linear-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 hover:from-amber-500/25 hover:via-yellow-500/25 hover:to-amber-500/25 text-foreground shadow-xs hover:shadow-md hover:shadow-amber-500/15 transition-all duration-300 active:scale-95"
                >
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <TrophyIcon className="h-3.5 w-3.5 text-amber-500 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground text-center">
                    View Monthly Champions & Certificates
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
                </Link>
              </div>
            )}
          </m.div>

          {/* Leaderboard Content */}
          {calculationMode ? (
            <CalculationAnimation />
          ) : winnerRevealMode ? (
            <WinnerRevealAnimation />
          ) : leaderboard.length === 0 ? (
            <m.div
              className="text-center py-16 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/70 max-w-2xl mx-auto shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <LeafIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground">No evaluations yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Supervisors will be evaluating classrooms soon. Check back shortly!</p>
            </m.div>
          ) : (
            <Tabs
              defaultValue="Pre-School"
              value={activeDivision}
              onValueChange={setActiveDivision}
              className="w-full max-w-4xl mx-auto mb-16 relative z-10"
            >
              {/* Division Navigation Tabs (Sticky) */}
              <div className="sticky top-(--app-header-height) z-40 pb-3 pt-2 bg-background/90 dark:bg-background/95 backdrop-blur-md border-b border-border/40 mb-6 transition-all duration-200">
                <div className="relative max-w-4xl mx-auto px-1 sm:px-0">
                  <div className="flex justify-start sm:justify-center overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory scroll-smooth">
                    <TabsList className="inline-flex h-auto p-1 bg-muted/70 dark:bg-card/70 backdrop-blur-sm rounded-full border border-border/60 shadow-xs min-w-max gap-1">
                      {DIVISION_OPTIONS.map((option) => (
                        <TabsTrigger
                          key={option.value}
                          value={option.value}
                          className="rounded-full px-3 xs:px-3.5 sm:px-4 py-1.5 sm:py-2 min-h-9.5 sm:min-h-11 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md snap-center flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                        >
                          {getDivisionIcon(option.value)}
                          <span>{option.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-bold ml-0.5">
                            {divisionCounts[option.value] ?? 0}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
              </div>

              {/* Division Filter & View Switcher Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search classroom or grade..."
                    className="w-full pl-9 pr-8 py-2 rounded-full border border-border bg-card/80 text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Switcher: Podium vs List */}
                <div className="flex items-center justify-center w-full sm:w-auto p-1 bg-muted/60 dark:bg-card/70 rounded-full border border-border/60 shadow-2xs">
                  <button
                    onClick={() => setViewMode("podium")}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "podium"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    <span>Podium Showcase</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5 shrink-0" />
                    <span>Full List</span>
                  </button>
                </div>
              </div>

              {/* Division Content Lists */}
              {DIVISION_OPTIONS.map((option) => {
                const divisionClassrooms = leaderboard.filter((c) => c.classroom.division === option.value)
                const filteredClassrooms = divisionClassrooms.filter((c) => {
                  if (!searchQuery.trim()) return true
                  const q = searchQuery.toLowerCase().trim()
                  return (
                    c.classroom.name.toLowerCase().includes(q) ||
                    c.classroom.grade.toLowerCase().includes(q)
                  )
                })

                const maxScoreInDivision =
                  divisionClassrooms.length > 0
                    ? Math.max(...divisionClassrooms.map((c) => c.totalScore))
                    : 100

                const showPodium =
                  viewMode === "podium" &&
                  !searchQuery &&
                  filteredClassrooms.length >= 1

                const podiumTopThree = showPodium ? filteredClassrooms.slice(0, 3) : []
                const listClassrooms = showPodium
                  ? filteredClassrooms.slice(3)
                  : filteredClassrooms

                return (
                  <TabsContent key={option.value} value={option.value} className="mt-0 focus-visible:outline-hidden">
                    <AnimatePresence mode="wait">
                      {divisionClassrooms.length === 0 ? (
                        <m.div
                          key="no-classrooms"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-14 text-muted-foreground bg-card/60 backdrop-blur-sm rounded-2xl border border-border/60 shadow-2xs"
                        >
                          <LeafIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="font-semibold text-foreground">No classrooms registered in this division</p>
                          <p className="text-xs text-muted-foreground mt-1">Evaluations will appear here once submitted.</p>
                        </m.div>
                      ) : filteredClassrooms.length === 0 ? (
                        <m.div
                          key="no-search-results"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12 text-muted-foreground bg-card/60 backdrop-blur-sm rounded-2xl border border-border/60 shadow-2xs"
                        >
                          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="font-semibold text-foreground">No classrooms matched &quot;{searchQuery}&quot;</p>
                          <button
                            onClick={() => setSearchQuery("")}
                            className="mt-2 text-xs font-bold text-primary hover:underline"
                          >
                            Clear search filter
                          </button>
                        </m.div>
                      ) : (
                        <m.div
                          key={`content-${option.value}-${viewMode}-${searchQuery ? "search" : "all"}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {/* 3D Olympic Podium Showcase for Top 3 */}
                          {showPodium && (
                            <LeaderboardPodium
                              topThree={podiumTopThree}
                            />
                          )}

                          {/* Remaining Standings Section Header */}
                          {showPodium && listClassrooms.length > 0 && (
                            <div className="flex items-center gap-3 pt-4 pb-1">
                              <div className="h-px flex-1 bg-border/60" />
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-primary" />
                                Standings (Ranks 4 – {filteredClassrooms.length})
                              </span>
                              <div className="h-px flex-1 bg-border/60" />
                            </div>
                          )}

                          {/* Cards List */}
                          <div className="space-y-3">
                            {listClassrooms.map((classroom, index) => {
                              const rank = showPodium ? index + 4 : index + 1
                              return (
                                <m.div
                                  key={`${classroom.classroom.id}-${option.value}`}
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    delay: 0.03 * Math.min(index, 8),
                                    duration: 0.3,
                                    ease: "easeOut",
                                  }}
                                >
                                  <SimpleClassroomCard
                                    classroom={classroom}
                                    rank={rank}
                                    maxScore={maxScoreInDivision}
                                  />
                                </m.div>
                              )
                            })}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </div>
      </div>
    </LazyMotionProvider>
  )
}
