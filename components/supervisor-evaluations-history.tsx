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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">{evaluations.length}</p>
                <p className="text-sm text-muted-foreground">Total Evaluations</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">
                  {Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)}
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>

            {/* Evaluation List */}
            <div className="space-y-3">
              {evaluations.map((evaluation, index) => (
                <motion.div
                  key={evaluation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{evaluation.classroom?.name || "Unknown Classroom"}</h4>
                    <p className="text-sm text-muted-foreground">
                      Grade {evaluation.classroom?.grade} • {formatDate(evaluation.evaluation_date)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-bold text-primary">{evaluation.total_score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEvaluateAgain(evaluation)}
                    >
                      Evaluate Again
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
