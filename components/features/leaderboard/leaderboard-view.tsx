"use client"

import { m } from "framer-motion"
import { SimpleClassroomCard } from "@/components/features/leaderboard/simple-classroom-card"
import { CalculationAnimation } from "@/components/features/animations/calculation-animation"
import { WinnerRevealAnimation } from "@/components/features/animations/winner-reveal-animation"
import { LeafIcon } from "@/components/common/icons"
import type { ClassroomScore } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

interface LeaderboardViewProps {
  leaderboard: ClassroomScore[]
  calculationMode: boolean
  winnerRevealMode: boolean
}

export function LeaderboardView({ leaderboard, calculationMode, winnerRevealMode }: LeaderboardViewProps) {
  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5">
        {/* Animated Hero Section */}
        <div className="container mx-auto px-4 py-12 relative overflow-hidden">
          <m.div
            className="text-center mb-16 relative z-10"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <m.div
              className="inline-flex items-center justify-center gap-3 mb-6"
              initial={false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <LeafIcon className="h-16 w-16 text-primary drop-shadow-lg" />
              <h1 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-primary via-green-600 to-primary bg-clip-text text-transparent">
                Green Classrooms
              </h1>
            </m.div>

            <m.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Celebrating environmental excellence across our school community
            </m.p>
          </m.div>

          {/* Leaderboard Content */}
          {calculationMode ? (
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
                    <div className="space-y-3">
                      {filteredLeaderboard.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                          <LeafIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                          <p>No classrooms found in this division.</p>
                        </div>
                      ) : (
                        filteredLeaderboard.map((classroom, index) => (
                          <m.div
                            key={`${classroom.classroom.id}-${option.value}`}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: 0.05 * Math.min(index, 10), duration: 0.4, ease: "easeOut" }}
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

          {/* How It Works */}
          <m.div
            className="max-w-3xl mx-auto mb-16 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-8 text-center shadow-lg">
              <h3 className="text-2xl font-semibold text-foreground mb-4">How It Works</h3>
              <p className="text-muted-foreground mb-4">
                The Supervisors Evaluate Each Classroom Using Smart, Eco-Focused Criteria — From Efficient Energy Use and Intelligent Waste Management to Innovative Environmental Care Practices.
              </p>
              <p className="text-primary font-medium">
                The higher your Eco-Score, the better your ranking!
              </p>
            </div>
          </m.div>
        </div>
      </div>
    </LazyMotionProvider>
  )
}
