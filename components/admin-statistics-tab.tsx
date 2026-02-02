"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEvaluations, getClassrooms, getEvaluationsByDateRange } from "@/lib/supabase-data"
import type { Evaluation, Classroom } from "@/lib/types"
import { LeafIcon, TrophyIcon, StarIcon } from "@/components/icons"
import { Filter } from "lucide-react"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"

interface ClassroomStats {
  classroom: Classroom
  evaluationCount: number
  averageScore: number
  lastEvaluated: string
}

interface SupervisorStats {
  supervisor: {
    name: string
    email: string
  }
  evaluationCount: number
  averageScore: number
}

export function AdminStatisticsTab() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [classroomStats, setClassroomStats] = useState<ClassroomStats[]>([])
  const [supervisorStats, setSupervisorStats] = useState<SupervisorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDivision, setSelectedDivision] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evaluationsData, classroomsData] = await Promise.all([
          getEvaluations(),
          getClassrooms()
        ])

        setEvaluations(evaluationsData)
        setClassrooms(classroomsData)

        // Calculate classroom statistics - INCLUDE ALL CLASSROOMS
        const classroomStatsMap = new Map<string, {
          classroom: Classroom
          evaluations: Evaluation[]
          scores: number[]
        }>()

        // First, initialize all classrooms with 0 evaluations
        classroomsData.forEach(classroom => {
          classroomStatsMap.set(classroom.id, {
            classroom,
            evaluations: [],
            scores: []
          })
        })

        // Then add evaluation data
        evaluationsData.forEach(evaluation => {
          if (evaluation.classroom) {
            const classroomId = evaluation.classroom_id
            const stats = classroomStatsMap.get(classroomId)
            if (stats) {
              stats.evaluations.push(evaluation)
              stats.scores.push(evaluation.total_score)
            }
          }
        })

        const classroomStatsArray: ClassroomStats[] = Array.from(classroomStatsMap.values()).map(stats => ({
          classroom: stats.classroom,
          evaluationCount: stats.evaluations.length,
          averageScore: stats.scores.length > 0
            ? Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length)
            : 0,
          lastEvaluated: stats.evaluations.length > 0
            ? stats.evaluations.sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())[0]?.evaluation_date || ""
            : "Never"
        }))

        setClassroomStats(classroomStatsArray.sort((a, b) => b.evaluationCount - a.evaluationCount))

        // Calculate supervisor statistics
        const supervisorStatsMap = new Map<string, {
          supervisor: { name: string; email: string }
          evaluations: Evaluation[]
          scores: number[]
        }>()

        evaluationsData.forEach(evaluation => {
          if (evaluation.supervisor) {
            const supervisorId = evaluation.supervisor_id
            if (!supervisorStatsMap.has(supervisorId)) {
              supervisorStatsMap.set(supervisorId, {
                supervisor: evaluation.supervisor,
                evaluations: [],
                scores: []
              })
            }
            const stats = supervisorStatsMap.get(supervisorId)!
            stats.evaluations.push(evaluation)
            stats.scores.push(evaluation.total_score)
          }
        })

        const supervisorStatsArray: SupervisorStats[] = Array.from(supervisorStatsMap.values()).map(stats => ({
          supervisor: stats.supervisor,
          evaluationCount: stats.evaluations.length,
          averageScore: Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length)
        }))

        setSupervisorStats(supervisorStatsArray.sort((a, b) => b.evaluationCount - a.evaluationCount))

      } catch (error) {
        console.error("Error fetching statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter classrooms by division
  const filteredClassroomStats = selectedDivision === "all"
    ? classroomStats
    : classroomStats.filter(stat => stat.classroom.division === selectedDivision)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Evaluations</CardTitle>
            <LeafIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{evaluations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Classrooms</CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{classrooms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <StarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {evaluations.length > 0
                ? Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Division Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter by Division
              </CardTitle>
              <CardDescription>View classrooms by their division</CardDescription>
            </div>
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {DIVISION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Classroom Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Evaluated Classrooms</CardTitle>
            <CardDescription>
              {selectedDivision === "all"
                ? "Classrooms with the highest evaluation count"
                : `${selectedDivision} classrooms with the highest evaluation count`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClassroomStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No classrooms found</p>
            ) : (
              <div className="space-y-3">
                {filteredClassroomStats.slice(0, 10).map((stat, index) => (
                  <div key={stat.classroom.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{stat.classroom.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Grade {stat.classroom.grade}
                          {stat.classroom.division && ` • ${getDivisionDisplayName(stat.classroom.division)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{stat.evaluationCount}</p>
                      <p className="text-xs text-muted-foreground">evaluations</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Classrooms</CardTitle>
            <CardDescription>
              {selectedDivision === "all"
                ? "Classrooms with the highest average scores"
                : `${selectedDivision} classrooms with the highest average scores`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClassroomStats.filter(stat => stat.evaluationCount > 0).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No evaluated classrooms found</p>
            ) : (
              <div className="space-y-4">
                {filteredClassroomStats
                  .filter(stat => stat.evaluationCount > 0)
                  .sort((a, b) => b.averageScore - a.averageScore)
                  .slice(0, 10)
                  .map((stat, index) => {
                    const maxScore = Math.max(...filteredClassroomStats.filter(s => s.evaluationCount > 0).map(s => s.averageScore))
                    const percentage = maxScore > 0 ? (stat.averageScore / maxScore) * 100 : 0

                    return (
                      <div key={stat.classroom.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{stat.classroom.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Grade {stat.classroom.grade}
                                {stat.classroom.division && ` • ${getDivisionDisplayName(stat.classroom.division)}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-sm">{stat.averageScore}</p>
                            <p className="text-xs text-muted-foreground">avg score</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>All evaluations sorted by date</CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No evaluations yet</p>
          ) : (
            <div className="space-y-3">
              {evaluations.slice(0, 10).map((evaluation) => (
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

      {/* Supervisor Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Supervisor Activity</CardTitle>
          <CardDescription>Most active supervisors by evaluation count</CardDescription>
        </CardHeader>
        <CardContent>
          {supervisorStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {supervisorStats.slice(0, 5).map((stat, index) => (
                <div key={stat.supervisor.email} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stat.supervisor.name}</p>
                      <p className="text-sm text-muted-foreground">{stat.supervisor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{stat.evaluationCount}</p>
                    <p className="text-xs text-muted-foreground">evaluations</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
