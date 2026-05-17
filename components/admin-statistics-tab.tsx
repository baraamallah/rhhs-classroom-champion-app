"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClassrooms, getEvaluationsByDateRange, getEvaluations } from "@/lib/supabase-data"
import type { Evaluation, Classroom } from "@/lib/types"
import { LeafIcon, TrophyIcon, StarIcon } from "@/components/icons"
import { Filter, Calendar as CalendarIcon } from "lucide-react"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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
  const [loading, setLoading] = useState(true)
  const [selectedDivision, setSelectedDivision] = useState<string>("all")

  // Date filters states
  const [preset, setPreset] = useState<string>("this-month")
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), "yyyy-MM-dd"))

  useEffect(() => {
    // Initial fetch using default preset dates
    fetchData(startDate, endDate, false)
  }, [])

  const fetchData = async (start?: string, end?: string, isAllTime?: boolean) => {
    setLoading(true)
    try {
      const queryStart = start !== undefined ? start : startDate
      const queryEnd = end !== undefined ? end : endDate
      const queryAllTime = isAllTime !== undefined ? isAllTime : (preset === "all-time")

      const [evaluationsData, classroomsData] = await Promise.all([
        queryAllTime ? getEvaluations() : getEvaluationsByDateRange(queryStart, queryEnd),
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

    } catch (error) {
      console.error("Error fetching statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue)
    const now = new Date()
    
    if (presetValue === "this-month") {
      const start = format(startOfMonth(now), "yyyy-MM-dd")
      const end = format(endOfMonth(now), "yyyy-MM-dd")
      setStartDate(start)
      setEndDate(end)
      fetchData(start, end, false)
    } else if (presetValue === "last-month") {
      const lastMonth = subMonths(now, 1)
      const start = format(startOfMonth(lastMonth), "yyyy-MM-dd")
      const end = format(endOfMonth(lastMonth), "yyyy-MM-dd")
      setStartDate(start)
      setEndDate(end)
      fetchData(start, end, false)
    } else if (presetValue === "last-3-months") {
      const start = format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd")
      const end = format(endOfMonth(now), "yyyy-MM-dd")
      setStartDate(start)
      setEndDate(end)
      fetchData(start, end, false)
    } else if (presetValue === "this-year") {
      const start = format(startOfYear(now), "yyyy-MM-dd")
      const end = format(endOfYear(now), "yyyy-MM-dd")
      setStartDate(start)
      setEndDate(end)
      fetchData(start, end, false)
    } else if (presetValue === "all-time") {
      setStartDate("")
      setEndDate("")
      fetchData("", "", true)
    }
  }

  // Filter classrooms by division
  const filteredClassrooms = selectedDivision === "all"
    ? classrooms
    : classrooms.filter(c => c.division === selectedDivision)

  // Filter evaluations by division
  const filteredEvaluations = selectedDivision === "all"
    ? evaluations
    : evaluations.filter(e => e.classroom?.division === selectedDivision)

  // Filter classroomStats by division (for ranking tables)
  const filteredClassroomStats = selectedDivision === "all"
    ? classroomStats
    : classroomStats.filter(stat => stat.classroom.division === selectedDivision)

  // Calculate supervisor activity dynamically based on filtered evaluations
  const supervisorStatsMap = new Map<string, {
    supervisor: { name: string; email: string }
    evaluations: Evaluation[]
    scores: number[]
  }>()

  filteredEvaluations.forEach(evaluation => {
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

  const displaySupervisorStats: SupervisorStats[] = Array.from(supervisorStatsMap.values()).map(stats => ({
    supervisor: stats.supervisor,
    evaluationCount: stats.evaluations.length,
    averageScore: stats.scores.length > 0
      ? Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length)
      : 0
  })).sort((a, b) => b.evaluationCount - a.evaluationCount)

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
        <Card className="border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Evaluations</CardTitle>
            <LeafIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{filteredEvaluations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDivision === "all" ? "Across all divisions" : `In ${getDivisionDisplayName(selectedDivision)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Active Classrooms</CardTitle>
            <TrophyIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{filteredClassrooms.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDivision === "all" ? "Registered classrooms" : `In ${getDivisionDisplayName(selectedDivision)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Average Score</CardTitle>
            <StarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {filteredEvaluations.length > 0
                ? Math.round(filteredEvaluations.reduce((sum, e) => sum + e.total_score, 0) / filteredEvaluations.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDivision === "all" ? "Overall average" : `In ${getDivisionDisplayName(selectedDivision)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date and Division Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Date Range Filter
            </CardTitle>
            <CardDescription>Select a preset range or enter a custom start and end date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="preset-select">Quick Presets</Label>
                <Select value={preset} onValueChange={handlePresetChange}>
                  <SelectTrigger id="preset-select" className="w-full">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="custom" disabled>Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setPreset("custom")
                  }}
                  disabled={preset === "all-time"}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setPreset("custom")
                  }}
                  disabled={preset === "all-time"}
                />
              </div>
            </div>
            
            {preset === "custom" && (
              <div className="mt-4 flex justify-end">
                <Button onClick={() => fetchData(startDate, endDate, false)} disabled={loading} size="sm">
                  {loading ? "Applying..." : "Apply Custom Range"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              Division Filter
            </CardTitle>
            <CardDescription>Filter statistics and activity by division</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {DIVISION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Classroom Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Most Evaluated Classrooms</CardTitle>
            <CardDescription>
              {selectedDivision === "all"
                ? "Classrooms with the highest evaluation count in selected date range"
                : `${getDivisionDisplayName(selectedDivision)} classrooms with the highest evaluation count`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClassroomStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No classrooms found</p>
            ) : (
              <div className="space-y-3">
                {filteredClassroomStats.slice(0, 10).map((stat, index) => (
                  <div key={stat.classroom.id} className="flex items-center justify-between p-3 rounded-lg border bg-card transition-all duration-200 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{stat.classroom.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Grade {stat.classroom.grade}
                          {stat.classroom.division && ` • ${getDivisionDisplayName(stat.classroom.division)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{stat.evaluationCount}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">evaluations</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Classrooms</CardTitle>
            <CardDescription>
              {selectedDivision === "all"
                ? "Classrooms with the highest average scores in selected date range"
                : `${getDivisionDisplayName(selectedDivision)} classrooms with the highest average scores`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClassroomStats.filter(stat => stat.evaluationCount > 0).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No evaluated classrooms found</p>
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
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
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
                            <p className="text-[10px] sm:text-xs text-muted-foreground">avg score</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
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
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Evaluations</CardTitle>
          <CardDescription>
            {selectedDivision === "all" 
              ? "All evaluations sorted by date" 
              : `Evaluations for ${getDivisionDisplayName(selectedDivision)} classrooms`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvaluations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No evaluations yet in this range</p>
          ) : (
            <div className="space-y-3">
              {filteredEvaluations.slice(0, 10).map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-4 rounded-lg border bg-card transition-all duration-200 hover:bg-muted/30">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">{evaluation.classroom?.name || "Unknown Classroom"}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Evaluated by {evaluation.supervisor?.name || "Unknown"} • {formatDate(evaluation.evaluation_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-bold text-primary">{evaluation.total_score}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supervisor Activity */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Supervisor Activity</CardTitle>
          <CardDescription>
            {selectedDivision === "all"
              ? "Most active supervisors by evaluation count"
              : `Supervisor activity in ${getDivisionDisplayName(selectedDivision)} division`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displaySupervisorStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No supervisor activity in this range</p>
          ) : (
            <div className="space-y-3">
              {displaySupervisorStats.slice(0, 5).map((stat, index) => (
                <div key={stat.supervisor.email} className="flex items-center justify-between p-3 rounded-lg border bg-card transition-all duration-200 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{stat.supervisor.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.supervisor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{stat.evaluationCount}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">evaluations</p>
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
