"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { SimpleClassroomCard } from "@/components/simple-classroom-card"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"
import { getClassrooms, getEvaluations } from "@/lib/supabase-data"

import { LeafIcon } from "@/components/icons"
import type { ClassroomScore } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const FloatingLeaf = ({ delay = 0, x = 0 }: { delay?: number, x?: number }) => (
  <motion.div
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
  </motion.div>
)

export default function HomePage() {
  const [leaderboard, setLeaderboard] = useState<ClassroomScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [evaluations, classrooms] = await Promise.all([
        getEvaluations(),
        getClassrooms()
      ])
      const board = calculateLeaderboard(evaluations, classrooms)
      setLeaderboard(board)
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />

      <main className="container mx-auto px-4 py-12 relative overflow-hidden">
        {/* Floating Leaves Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingLeaf delay={0} x={100} />
          <FloatingLeaf delay={2} x={300} />
          <FloatingLeaf delay={4} x={500} />
          <FloatingLeaf delay={1} x={700} />
          <FloatingLeaf delay={3} x={900} />
        </div>

        {/* Animated Hero Section */}
        <motion.div
          className="text-center mb-16 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center justify-center gap-3 mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <LeafIcon className="h-16 w-16 text-primary drop-shadow-lg" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-green-600 to-primary bg-clip-text text-transparent">
              Green Classrooms
            </h1>
          </motion.div>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Celebrating environmental excellence across our school community
          </motion.p>
        </motion.div>

        {/* All Classrooms List */}
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <LeafIcon className="h-12 w-12 text-primary mx-auto" />
            </motion.div>
          </div>
        ) : leaderboard.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground">No evaluations yet. Check back soon!</p>
          </motion.div>
        ) : (
          <Tabs defaultValue="Pre-School" className="w-full max-w-4xl mx-auto mb-16 relative z-10">
            <div className="sticky top-[70px] z-40 -mx-4 px-4 pb-4 pt-2 bg-background/80 backdrop-blur-md border-b border-border/40 mb-8 transition-all duration-200">
              <div className="relative max-w-4xl mx-auto">
                {/* Gradient Masks for Scroll Indication */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none" />

                <div className="flex justify-start sm:justify-center overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                  <TabsList className="inline-flex h-auto p-1.5 bg-muted/50 backdrop-blur-sm rounded-full border border-border/50 shadow-sm min-w-max">
                    {["Pre-School", "Elementary", "Middle School", "High School", "Technical Institute"].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="rounded-full px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md snap-center"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
            </div>

            {["Pre-School", "Elementary", "Middle School", "High School", "Technical Institute"].map((division) => {
              const filteredLeaderboard = leaderboard.filter(c => c.classroom.division === division);

              return (
                <TabsContent key={division} value={division} className="mt-0">
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    {filteredLeaderboard.length === 0 ? (
                      <motion.div
                        className="text-center py-12 text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl border border-border/50"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <LeafIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p>No classrooms found in this division.</p>
                      </motion.div>
                    ) : (
                      filteredLeaderboard.map((classroom, index) => (
                        <motion.div
                          key={`${classroom.classroom.id}-${division}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index, duration: 0.4, ease: "easeOut" }}
                          layoutId={`${classroom.classroom.id}-${division}`}
                        >
                          <SimpleClassroomCard
                            classroom={classroom}
                            rank={index + 1}
                          />
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* Simple How It Works */}
        <motion.div
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
            <motion.p
              className="text-primary font-medium"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              The higher your Eco-Score, the better your ranking!
            </motion.p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
