"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { SimpleClassroomCard } from "@/components/features/leaderboard/simple-classroom-card"
import { CalculationAnimation } from "@/components/features/animations/calculation-animation"
import { WinnerRevealAnimation } from "@/components/features/animations/winner-reveal-animation"
import { LeafIcon, TrophyIcon } from "@/components/common/icons"
import type { ClassroomScore } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { ArrowRight, Sparkles, BookOpen, Compass, GraduationCap, Laptop } from "lucide-react"
import { getWinnersPageVisibility } from "@/app/actions/winners-page-actions"

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
  winnersPageVisible = true,
}: LeaderboardViewProps) {
  const [isWinnersVisible, setIsWinnersVisible] = useState(winnersPageVisible)

  useEffect(() => {
    let isMounted = true
    async function checkVisibility() {
      const result = await getWinnersPageVisibility()
      if (isMounted && result.success && typeof result.visible === "boolean") {
        setIsWinnersVisible(result.visible)
      }
    }
    void checkVisibility()
    return () => {
      isMounted = false
    }
  }, [])

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
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 pb-16">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-10 pb-6 relative overflow-hidden">
          <m.div
            className="text-center mb-10 relative z-10 max-w-3xl mx-auto"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Sustainability Badge Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-5 shadow-2xs">
              <LeafIcon className="h-3.5 w-3.5" />
              <span>Official School Sustainability Competition</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-linear-to-r from-emerald-600 via-primary to-green-600 bg-clip-text text-transparent mb-3">
              Green Classrooms
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed">
              Celebrating daily environmental leadership and eco-conscious habits across Rafic Hariri High School.
            </p>

            {/* Prominent Winners Transfer Button / Banner (Hidden if winner page is off) */}
            {isWinnersVisible && (
              <div className="mt-6 flex items-center justify-center">
                <Link
                  href="/winners"
                  className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-amber-500/40 bg-linear-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 hover:from-amber-500/25 hover:via-yellow-500/25 hover:to-amber-500/25 text-foreground shadow-sm hover:shadow-md hover:shadow-amber-500/15 transition-all duration-300 active:scale-95"
                >
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <TrophyIcon className="h-3.5 w-3.5 text-amber-500 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                    View Monthly Champions & Certificates
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 group-hover:translate-x-1 transition-transform duration-300" />
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
              className="text-center py-16 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/70 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <LeafIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground">No evaluations yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Supervisors will be evaluating classrooms soon. Check back shortly!</p>
            </m.div>
          ) : (
            <Tabs defaultValue="Pre-School" className="w-full max-w-4xl mx-auto mb-16 relative z-10">
              {/* Division Navigation Tabs */}
              <div className="sticky top-15 z-40 -mx-4 px-4 pb-4 pt-2 bg-background/80 dark:bg-background/85 backdrop-blur-md border-b border-border/40 mb-6 transition-all duration-200">
                <div className="relative max-w-4xl mx-auto">
                  <div className="flex justify-start sm:justify-center overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
                    <TabsList className="inline-flex h-auto p-1.5 bg-muted/60 dark:bg-card/70 backdrop-blur-sm rounded-full border border-border/60 shadow-xs min-w-max gap-1">
                      {DIVISION_OPTIONS.map((option) => (
                        <TabsTrigger
                          key={option.value}
                          value={option.value}
                          className="rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md snap-center flex items-center gap-1.5 cursor-pointer"
                        >
                          {getDivisionIcon(option.value)}
                          <span>{option.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
              </div>

              {/* Division Content Lists */}
              {DIVISION_OPTIONS.map((option) => {
                const filteredLeaderboard = leaderboard.filter(c => c.classroom.division === option.value);

                return (
                  <TabsContent key={option.value} value={option.value} className="mt-0 focus-visible:outline-hidden">
                    <div className="space-y-3">
                      {filteredLeaderboard.length === 0 ? (
                        <div className="text-center py-14 text-muted-foreground bg-card/60 backdrop-blur-sm rounded-2xl border border-border/60">
                          <LeafIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="font-semibold text-foreground">No classrooms found in this division</p>
                          <p className="text-xs text-muted-foreground mt-1">Evaluations will appear here once submitted.</p>
                        </div>
                      ) : (
                        filteredLeaderboard.map((classroom, index) => (
                          <m.div
                            key={`${classroom.classroom.id}-${option.value}`}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ delay: 0.04 * Math.min(index, 8), duration: 0.35, ease: "easeOut" }}
                          >
                            <SimpleClassroomCard
                              classroom={classroom}
                              rank={index + 1}
                            />
                          </m.div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </div>
    </LazyMotionProvider>
  )
}

