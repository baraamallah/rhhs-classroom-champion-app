"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvaluations } from "@/lib/supabase-data"
import type { Evaluation } from "@/lib/types"

export function EvaluationsList() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluations()
        setEvaluations(data)
      } catch (error) {
        console.error("Error fetching evaluations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluations()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading evaluations...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Evaluations</CardTitle>
        <CardDescription>View all classroom evaluations</CardDescription>
      </CardHeader>
      <CardContent>
        {evaluations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No evaluations yet</p>
        ) : (
          <div className="space-y-3">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{evaluation.classroom?.name || "Unknown Classroom"}</h4>
                  <p className="text-sm text-muted-foreground">
                    Evaluated by {evaluation.supervisor?.name || "Unknown"} • {formatDate(evaluation.evaluation_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{evaluation.total_score}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
