"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvaluations, getClassrooms } from "@/lib/supabase-data"
import { TrophyIcon, LeafIcon, StarIcon } from "@/components/icons"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    totalClassrooms: 0,
    averageScore: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [evaluations, classrooms] = await Promise.all([getEvaluations(), getClassrooms()])

        const totalEvaluations = evaluations.length
        const averageScore =
          totalEvaluations > 0
            ? Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / totalEvaluations)
            : 0

        setStats({
          totalEvaluations,
          totalClassrooms: classrooms.length,
          averageScore,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Evaluations</CardTitle>
          <LeafIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{stats.totalEvaluations}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Classrooms</CardTitle>
          <TrophyIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{stats.totalClassrooms}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          <StarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.averageScore}</div>
        </CardContent>
      </Card>
    </div>
  )
}
