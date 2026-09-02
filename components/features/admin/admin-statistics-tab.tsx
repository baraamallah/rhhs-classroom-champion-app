"use client"

import { useState, useEffect, useRef } from "react"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClassrooms, getEvaluationsByDateRange, getEvaluations } from "@/lib/supabase-data"
import type { Evaluation, Classroom } from "@/lib/types"
import { LeafIcon, TrophyIcon, StarIcon } from "@/components/common/icons"
import { Filter, Calendar as CalendarIcon } from "lucide-react"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Beirut" })
}

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
  const [preset, setPreset] = useState<string>("this-month")
  const [startDate, setStartDate] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState<string>(() => format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const initialMounted = useRef(false)

  useEffect(() => {
    if (initialMounted.current) return
    initialMounted.current = true
    fetchData(startDate, endDate, false)
  }, [])

  const fetchData = async (start?: string, end?: string, isAllTime?: boolean) => {
    setLoading(true)
    try {
      const queryStart = start !== undefined ? start : startDate
      const queryEnd = end !== undefined ? end : endDate
      const queryAllTime = isAllTime !== undefined ? isAllTime : preset === "all-time"
      const [evaluationsData, classroomsData] = await Promise.all([
        queryAllTime ? getEvaluations() : getEvaluationsByDateRange(queryStart, queryEnd),
        getClassrooms(),
      ])

      setEvaluations(evaluationsData)
      setClassrooms(classroomsData)
      setClassroomStats(buildClassroomStats(classroomsData, evaluationsData))
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
      updateDateRange(startOfMonth(now), endOfMonth(now), false)
    } else if (presetValue === "last-month") {
      const lastMonth = subMonths(now, 1)
      updateDateRange(startOfMonth(lastMonth), endOfMonth(lastMonth), false)
    } else if (presetValue === "last-3-months") {
      updateDateRange(startOfMonth(subMonths(now, 2)), endOfMonth(now), false)
    } else if (presetValue === "this-year") {
      updateDateRange(startOfYear(now), endOfYear(now), false)
    } else if (presetValue === "all-time") {
      setStartDate("")
      setEndDate("")
      fetchData("", "", true)
    }
  }

  const updateDateRange = (start: Date, end: Date, allTime: boolean) => {
    const formattedStart = format(start, "yyyy-MM-dd")
    const formattedEnd = format(end, "yyyy-MM-dd")
    setStartDate(formattedStart)
    setEndDate(formattedEnd)
    fetchData(formattedStart, formattedEnd, allTime)
  }

  const filteredClassrooms = selectedDivision === "all" ? classrooms : classrooms.filter((c) => c.division === selectedDivision)
  const filteredEvaluations = selectedDivision === "all" ? evaluations : evaluations.filter((e) => e.classroom?.division === selectedDivision)
  const filteredClassroomStats = selectedDivision === "all" ? classroomStats : classroomStats.filter((stat) => stat.classroom.division === selectedDivision)
  const displaySupervisorStats = buildSupervisorStats(filteredEvaluations)

  if (loading) return <StatisticsLoading />

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Data Insights"
        badgeLabel="Score Trends & Division Benchmarks"
        title="Score Analytics"
        description="Explore school-wide score distributions, division leaderboards, and historical performance metrics."
      />
      <OverviewStats selectedDivision={selectedDivision} filteredEvaluations={filteredEvaluations} filteredClassrooms={filteredClassrooms} />
      <StatisticsFilters
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        selectedDivision={selectedDivision}
        loading={loading}
        onPresetChange={handlePresetChange}
        onStartDateChange={(value) => {
          setStartDate(value)
          setPreset("custom")
        }}
        onEndDateChange={(value) => {
          setEndDate(value)
          setPreset("custom")
        }}
        onDivisionChange={setSelectedDivision}
        onApplyCustom={() => fetchData(startDate, endDate, false)}
      />
      <ClassroomRankingSection selectedDivision={selectedDivision} filteredClassroomStats={filteredClassroomStats} />
      <RecentEvaluationsSection selectedDivision={selectedDivision} filteredEvaluations={filteredEvaluations} />
      <SupervisorActivitySection selectedDivision={selectedDivision} displaySupervisorStats={displaySupervisorStats} />
    </div>
  )
}

function buildClassroomStats(classroomsData: Classroom[], evaluationsData: Evaluation[]) {
  const classroomStatsMap = new Map<string, { classroom: Classroom; evaluations: Evaluation[]; scores: number[] }>()
  classroomsData.forEach((classroom) => {
    classroomStatsMap.set(classroom.id, { classroom, evaluations: [], scores: [] })
  })
  evaluationsData.forEach((evaluation) => {
    if (evaluation.classroom) {
      const stats = classroomStatsMap.get(evaluation.classroom_id)
      if (stats) {
        stats.evaluations.push(evaluation)
        stats.scores.push(evaluation.total_score)
      }
    }
  })

  return Array.from(classroomStatsMap.values())
    .map((stats) => ({
      classroom: stats.classroom,
      evaluationCount: stats.evaluations.length,
      averageScore: stats.scores.length > 0 ? Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length) : 0,
      lastEvaluated: stats.evaluations.length > 0
        ? stats.evaluations.sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())[0]?.evaluation_date || ""
        : "Never",
    }))
    .sort((a, b) => b.evaluationCount - a.evaluationCount)
}

function buildSupervisorStats(filteredEvaluations: Evaluation[]): SupervisorStats[] {
  const supervisorStatsMap = new Map<string, { supervisor: { name: string; email: string }; evaluations: Evaluation[]; scores: number[] }>()
  filteredEvaluations.forEach((evaluation) => {
    if (evaluation.supervisor) {
      if (!supervisorStatsMap.has(evaluation.supervisor_id)) {
        supervisorStatsMap.set(evaluation.supervisor_id, { supervisor: evaluation.supervisor, evaluations: [], scores: [] })
      }
      const stats = supervisorStatsMap.get(evaluation.supervisor_id)!
      stats.evaluations.push(evaluation)
      stats.scores.push(evaluation.total_score)
    }
  })

  return Array.from(supervisorStatsMap.values())
    .map((stats) => ({
      supervisor: stats.supervisor,
      evaluationCount: stats.evaluations.length,
      averageScore: stats.scores.length > 0 ? Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length) : 0,
    }))
    .sort((a, b) => b.evaluationCount - a.evaluationCount)
}

function StatisticsLoading() {
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

function OverviewStats({
  selectedDivision,
  filteredEvaluations,
  filteredClassrooms,
}: {
  selectedDivision: string
  filteredEvaluations: Evaluation[]
  filteredClassrooms: Classroom[]
}) {
  const averageScore = filteredEvaluations.length > 0
    ? Math.round(filteredEvaluations.reduce((sum, e) => sum + e.total_score, 0) / filteredEvaluations.length)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <OverviewStatCard title="Total Evaluations" icon={<LeafIcon className="h-4 w-4 text-primary" />} value={filteredEvaluations.length} description={selectedDivision === "all" ? "Across all divisions" : `In ${getDivisionDisplayName(selectedDivision)}`} />
      <OverviewStatCard title="Active Classrooms" icon={<TrophyIcon className="h-4 w-4 text-primary" />} value={filteredClassrooms.length} description={selectedDivision === "all" ? "Registered classrooms" : `In ${getDivisionDisplayName(selectedDivision)}`} />
      <OverviewStatCard title="Average Score" icon={<StarIcon className="h-4 w-4 text-primary" />} value={averageScore} description={selectedDivision === "all" ? "Overall average" : `In ${getDivisionDisplayName(selectedDivision)}`} primary />
    </div>
  )
}

function OverviewStatCard({ title, icon, value, description, primary }: { title: string; icon: React.ReactNode; value: number; description: string; primary?: boolean }) {
  return (
    <Card className="border-border/80 shadow-sm transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${primary ? "text-primary" : "text-foreground"}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatisticsFilters(props: {
  preset: string
  startDate: string
  endDate: string
  selectedDivision: string
  loading: boolean
  onPresetChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onDivisionChange: (value: string) => void
  onApplyCustom: () => void
}) {
  return (
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
            <DatePresetSelect preset={props.preset} onPresetChange={props.onPresetChange} />
            <DateInput id="start-date" label="Start Date" value={props.startDate} disabled={props.preset === "all-time"} onChange={props.onStartDateChange} />
            <DateInput id="end-date" label="End Date" value={props.endDate} disabled={props.preset === "all-time"} onChange={props.onEndDateChange} />
          </div>
          {props.preset === "custom" && (
            <div className="mt-4 flex justify-end">
              <Button onClick={props.onApplyCustom} disabled={props.loading} size="sm">{props.loading ? "Applying..." : "Apply Custom Range"}</Button>
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
          <Select value={props.selectedDivision} onValueChange={props.onDivisionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {DIVISION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}

function DatePresetSelect({ preset, onPresetChange }: { preset: string; onPresetChange: (value: string) => void }) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor="preset-select">Quick Presets</Label>
      <Select value={preset} onValueChange={onPresetChange}>
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
  )
}

function DateInput({ id, label, value, disabled, onChange }: { id: string; label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input type="date" id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  )
}

function ClassroomRankingSection({ selectedDivision, filteredClassroomStats }: { selectedDivision: string; filteredClassroomStats: ClassroomStats[] }) {
  const evaluatedStats = filteredClassroomStats.filter((stat) => stat.evaluationCount > 0)
  const topScores = [...evaluatedStats].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10)
  const maxScore = Math.max(...evaluatedStats.map((s) => s.averageScore), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RankingCard title="Most Evaluated Classrooms" description={selectedDivision === "all" ? "Classrooms with the highest evaluation count in selected date range" : `${getDivisionDisplayName(selectedDivision)} classrooms with the highest evaluation count`}>
        {filteredClassroomStats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No classrooms found</p>
        ) : (
          <div className="space-y-3">
            {filteredClassroomStats.slice(0, 10).map((stat, index) => <ClassroomEvaluationRow key={stat.classroom.id} stat={stat} index={index} />)}
          </div>
        )}
      </RankingCard>

      <RankingCard title="Top Performing Classrooms" description={selectedDivision === "all" ? "Classrooms with the highest average scores in selected date range" : `${getDivisionDisplayName(selectedDivision)} classrooms with the highest average scores`}>
        {evaluatedStats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No evaluated classrooms found</p>
        ) : (
          <div className="space-y-4">
            {topScores.map((stat, index) => <ClassroomScoreRow key={stat.classroom.id} stat={stat} index={index} maxScore={maxScore} />)}
          </div>
        )}
      </RankingCard>
    </div>
  )
}

function RankingCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ClassroomEvaluationRow({ stat, index }: { stat: ClassroomStats; index: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</div>
        <div>
          <p className="font-medium text-sm sm:text-base">{stat.classroom.name}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Grade {stat.classroom.grade}
            {stat.classroom.division && ` - ${getDivisionDisplayName(stat.classroom.division)}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-foreground">{stat.evaluationCount}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">evaluations</p>
      </div>
    </div>
  )
}

function ClassroomScoreRow({ stat, index, maxScore }: { stat: ClassroomStats; index: number; maxScore: number }) {
  const percentage = maxScore > 0 ? (stat.averageScore / maxScore) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</div>
          <div>
            <p className="font-medium text-sm">{stat.classroom.name}</p>
            <p className="text-xs text-muted-foreground">
              Grade {stat.classroom.grade}
              {stat.classroom.division && ` - ${getDivisionDisplayName(stat.classroom.division)}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary text-sm">{stat.averageScore}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">avg score</p>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-2 rounded-full transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-500 ease-out" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function RecentEvaluationsSection({ selectedDivision, filteredEvaluations }: { selectedDivision: string; filteredEvaluations: Evaluation[] }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent Evaluations</CardTitle>
        <CardDescription>{selectedDivision === "all" ? "All evaluations sorted by date" : `Evaluations for ${getDivisionDisplayName(selectedDivision)} classrooms`}</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredEvaluations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No evaluations yet in this range</p>
        ) : (
          <div className="space-y-3">
            {filteredEvaluations.slice(0, 10).map((evaluation) => (
              <div key={evaluation.id} className="flex items-center justify-between p-4 rounded-lg border bg-card transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 hover:bg-muted/30">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{evaluation.classroom?.name || "Unknown Classroom"}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Evaluated by {evaluation.supervisor?.name || "Unknown"} - {formatDate(evaluation.evaluation_date)}
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
  )
}

function SupervisorActivitySection({ selectedDivision, displaySupervisorStats }: { selectedDivision: string; displaySupervisorStats: SupervisorStats[] }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Supervisor Activity</CardTitle>
        <CardDescription>{selectedDivision === "all" ? "Most active supervisors by evaluation count" : `Supervisor activity in ${getDivisionDisplayName(selectedDivision)} division`}</CardDescription>
      </CardHeader>
      <CardContent>
        {displaySupervisorStats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No supervisor activity in this range</p>
        ) : (
          <div className="space-y-3">
            {displaySupervisorStats.slice(0, 5).map((stat, index) => (
              <div key={stat.supervisor.email} className="flex items-center justify-between p-3 rounded-lg border bg-card transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</div>
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
  )
}
