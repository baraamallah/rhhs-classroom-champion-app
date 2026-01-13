"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getEvaluationsBySupervisor } from "@/lib/supabase-data"
import { motion } from "framer-motion"
import type { Evaluation, Classroom } from "@/lib/types"

interface SupervisorEvaluationsHistoryProps {
  supervisorId: string
  onEvaluateClassroom: (classroom: Classroom) => void
}

export function SupervisorEvaluationsHistory({ supervisorId, onEvaluateClassroom }: SupervisorEvaluationsHistoryProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluationsBySupervisor(supervisorId)
        setEvaluations(data)
      } catch (error) {
        console.error("Error fetching supervisor evaluations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluations()
  }, [supervisorId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleEvaluateAgain = (evaluation: Evaluation) => {
    if (evaluation.classroom) {
      const classroom: Classroom = {
        id: evaluation.classroom_id,
        name: evaluation.classroom.name,
        grade: evaluation.classroom.grade,
        description: "",
        supervisor_id: supervisorId,
        is_active: true
      }
      onEvaluateClassroom(classroom)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Evaluations</CardTitle>
          <CardDescription>Your evaluation history</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading evaluations...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Evaluations</CardTitle>
        <CardDescription>Your evaluation history and performance</CardDescription>
      </CardHeader>
      <CardContent>
        {evaluations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No evaluations yet</p>
            <p className="text-sm text-muted-foreground">Start by evaluating a classroom to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <motion.div 
                className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-2xl sm:text-3xl font-bold text-primary">{evaluations.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total Evaluations</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Average Score</p>
              </motion.div>
            </div>

            {/* Evaluation List */}
            <div className="space-y-3">
              {evaluations.map((evaluation, index) => (
                <motion.div
                  key={evaluation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-lg border bg-card hover:bg-accent/5 transition-all gap-4 shadow-sm hover:shadow-md"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base sm:text-lg text-foreground mb-1 truncate">
                      {evaluation.classroom?.name || "Unknown Classroom"}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Grade {evaluation.classroom?.grade} • {formatDate(evaluation.evaluation_date)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">{evaluation.total_score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEvaluateAgain(evaluation)}
                      className="text-sm sm:text-base h-9 sm:h-auto min-w-[120px] sm:min-w-[140px]"
                    >
                      🔄 Evaluate Again
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
