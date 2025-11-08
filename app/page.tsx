"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { SimpleClassroomCard } from "@/components/simple-classroom-card"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"
import { getEvaluationsServer } from "@/lib/supabase-data-server"
import { LeafIcon } from "@/components/icons"
import type { ClassroomScore } from "@/lib/types"

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
      const evaluations = await getEvaluationsServer()
      const board = calculateLeaderboard(evaluations)
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
          <motion.div 
            className="max-w-4xl mx-auto space-y-3 mb-16 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {leaderboard.map((classroom, index) => (
              <motion.div
                key={`${classroom.classroom.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
              >
                <SimpleClassroomCard 
                  classroom={classroom} 
                  rank={index + 1} 
                />
              </motion.div>
            ))}
          </motion.div>
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
