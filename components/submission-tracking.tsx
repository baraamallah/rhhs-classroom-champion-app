"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  Users,
  School,
  Search,
  BarChart3,
  ArrowLeft,
  Loader2,
  Filter
} from "lucide-react"
import { getClassrooms, getEvaluationsByDateRange } from "@/lib/supabase-data"
import type { Evaluation, Classroom, User } from "@/lib/types"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from "date-fns"
import { cn } from "@/lib/utils"
import { getDivisionDisplayName, DIVISION_OPTIONS } from "@/lib/division-display"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import * as XLSX from "xlsx"

interface SubmissionTrackingProps {
  currentUser?: User
}

export function SubmissionTracking({ currentUser }: SubmissionTrackingProps) {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [viewType, setViewType] = useState<"daily" | "monthly">("daily")
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDivision, setSelectedDivision] = useState<string>("all")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [date, viewType])

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = viewType === "daily"
        ? format(date, "yyyy-MM-dd")
        : format(startOfMonth(date), "yyyy-MM-dd")
      const endDate = viewType === "daily"
        ? format(date, "yyyy-MM-dd")
        : format(endOfMonth(date), "yyyy-MM-dd")

      const [classroomsData, evaluationsData] = await Promise.all([
        getClassrooms(),
        getEvaluationsByDateRange(startDate, endDate)
      ])

      setClassrooms(classroomsData)
      setEvaluations(evaluationsData)
    } catch (error) {
      console.error("Error fetching tracking data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch submission data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClassrooms = useMemo(() => {
    let filtered = classrooms
    if (selectedDivision !== "all") {
      filtered = filtered.filter(c => c.division === selectedDivision)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.grade.toLowerCase().includes(term) ||
        c.supervisors?.some(s => s.name.toLowerCase().includes(term))
      )
    }
    return filtered
  }, [classrooms, selectedDivision, searchTerm])

  const submissionStats = useMemo(() => {
    if (viewType === "daily") {
      const submittedIds = new Set(evaluations.map(e => e.classroom_id))
      const submitted = filteredClassrooms.filter(c => submittedIds.has(c.id))
      const notSubmitted = filteredClassrooms.filter(c => !submittedIds.has(c.id))

      return {
        submitted,
        notSubmitted,
        rate: filteredClassrooms.length > 0 ? (submitted.length / filteredClassrooms.length) * 100 : 0
      }
    } else {
      // Monthly stats
      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date)
      }).filter(d => !isWeekend(d))

      const classroomPerformance = filteredClassrooms.map(c => {
        const classEvals = evaluations.filter(e => e.classroom_id === c.id)
        const submittedDays = new Set(classEvals.map(e => format(new Date(e.evaluation_date), "yyyy-MM-dd")))
        return {
          classroom: c,
          submittedCount: submittedDays.size,
          totalDays: daysInMonth.length,
          rate: (submittedDays.size / daysInMonth.length) * 100
        }
      })

      return {
        classroomPerformance,
        avgRate: classroomPerformance.length > 0
          ? classroomPerformance.reduce((sum, p) => sum + p.rate, 0) / classroomPerformance.length
          : 0
      }
    }
  }, [filteredClassrooms, evaluations, viewType, date])

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      generateExcel()
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export Excel file",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const generateExcel = () => {
    try {
      const workbook = XLSX.utils.book_new()

      if (viewType === "daily") {
        const data = [
          ["Date", format(date, "PPPP")],
          ["Total Classrooms", filteredClassrooms.length],
          ["Submitted", (submissionStats as any).submitted.length],
          ["Not Submitted", (submissionStats as any).notSubmitted.length],
          [],
          ["Status", "Classroom", "Grade", "Division", "Supervisor(s)", "Evaluation Time", "Score"]
        ]

        // Submitted
        ;(submissionStats as any).submitted.forEach((c: Classroom) => {
          const eval_ = evaluations.find(e => e.classroom_id === c.id)
          data.push([
            "Submitted",
            c.name,
            c.grade,
            getDivisionDisplayName(c.division),
            c.supervisors?.map(s => s.name).join(", ") || "None",
            eval_ ? format(new Date(eval_.created_at || ""), "p") : "N/A",
            eval_?.total_score || 0
          ])
        })

        // Not Submitted
        ;(submissionStats as any).notSubmitted.forEach((c: Classroom) => {
          data.push([
            "MISSING",
            c.name,
            c.grade,
            getDivisionDisplayName(c.division),
            c.supervisors?.map(s => s.name).join(", ") || "None",
            "N/A",
            0
          ])
        })

        const worksheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Tracking")
      } else {
        // Monthly
        const daysInMonth = eachDayOfInterval({
          start: startOfMonth(date),
          end: endOfMonth(date)
        })

        const workdays = daysInMonth.filter(d => !isWeekend(d))
        const headers = ["Classroom", "Grade", "Division", "Supervisor(s)", "Total Submitted", "Total Workdays", "Submission Rate %"]
        workdays.forEach(d => {
          headers.push(format(d, "MMM d"))
        })

        const data = [
          ["Month", format(date, "MMMM yyyy")],
          [],
          headers
        ]

        ;(submissionStats as any).classroomPerformance.forEach((p: any) => {
          const row = [
            p.classroom.name,
            p.classroom.grade,
            getDivisionDisplayName(p.classroom.division),
            p.classroom.supervisors?.map((s: any) => s.name).join(", ") || "None",
            p.submittedCount,
            p.totalDays,
            `${p.rate.toFixed(1)}%`
          ]

          workdays.forEach(d => {
            const hasEval = evaluations.some(e =>
              e.classroom_id === p.classroom.id &&
              isSameDay(new Date(e.evaluation_date), d)
            )
            row.push(hasEval ? "YES" : "NO")
          })
          data.push(row)
        })

        const worksheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Tracking")
      }

      const fileName = `Submission_Tracking_${format(date, viewType === "daily" ? "yyyy-MM-dd" : "yyyy-MM")}.xlsx`
      XLSX.writeFile(workbook, fileName)

      toast({
        title: "Export Successful",
        description: `Exported to ${fileName}`,
      })
    } catch (error) {
      console.error("Excel generation error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to generate Excel file",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Submission Tracking</h2>
          <p className="text-muted-foreground">Monitor daily and monthly evaluation progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Link>
          </Button>
          <Button onClick={handleExportExcel} disabled={exporting || loading}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tracking Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">View Type</label>
              <Tabs value={viewType} onValueChange={(v) => setViewType(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {viewType === "daily" ? "Select Date" : "Select Month"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={viewType === "daily" ? "date" : "month"}
                  className="pl-8"
                  value={format(date, viewType === "daily" ? "yyyy-MM-dd" : "yyyy-MM")}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value)
                    if (!isNaN(newDate.getTime())) {
                      setDate(newDate)
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Division Filter</label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Divisions" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {DIVISION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Classroom or supervisor..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Classrooms</p>
                    <p className="text-2xl font-bold">{filteredClassrooms.length}</p>
                  </div>
                  <School className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {viewType === "daily" ? "Submitted Today" : "Avg. Submission Rate"}
                    </p>
                    <p className="text-2xl font-bold">
                      {viewType === "daily"
                        ? (submissionStats as any).submitted.length
                        : `${(submissionStats as any).avgRate.toFixed(1)}%`}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {viewType === "daily" ? "Not Submitted" : "Target Workdays"}
                    </p>
                    <p className="text-2xl font-bold">
                      {viewType === "daily"
                        ? (submissionStats as any).notSubmitted.length
                        : (submissionStats as any).classroomPerformance[0]?.totalDays || 0}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-destructive opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Lists */}
          <Card>
            <CardHeader>
              <CardTitle>
                {viewType === "daily"
                  ? `Submission Status for ${format(date, "PPP")}`
                  : `Monthly Performance for ${format(date, "MMMM yyyy")}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading tracking data...</p>
                </div>
              ) : viewType === "daily" ? (
                <div className="space-y-6">
                  {/* Missing List - High Priority */}
                  {(submissionStats as any).notSubmitted.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Not Submitted ({(submissionStats as any).notSubmitted.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(submissionStats as any).notSubmitted.map((c: Classroom) => (
                          <div key={c.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground">Grade {c.grade} • {getDivisionDisplayName(c.division)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">
                                  {c.supervisors?.map(s => s.name).join(", ") || "No supervisor assigned"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
                              Missing
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submitted List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Submitted ({(submissionStats as any).submitted.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(submissionStats as any).submitted.map((c: Classroom) => {
                        const eval_ = evaluations.find(e => e.classroom_id === c.id)
                        return (
                          <div key={c.id} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground">Grade {c.grade} • {getDivisionDisplayName(c.division)}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">
                                  {eval_?.supervisor?.name || c.supervisors?.[0]?.name || "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">{eval_?.total_score} pts</p>
                              <p className="text-[10px] text-muted-foreground">{eval_ ? format(new Date(eval_.created_at || ""), "p") : ""}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Monthly List */
                <div className="space-y-4">
                  {(submissionStats as any).classroomPerformance.map((p: any) => (
                    <div key={p.classroom.id} className="p-4 rounded-lg border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{p.classroom.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Grade {p.classroom.grade} • {getDivisionDisplayName(p.classroom.division)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{p.submittedCount}/{p.totalDays}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days Submitted</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Monthly Progress</span>
                          <span className="font-medium">{p.rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              p.rate >= 90 ? "bg-green-500" : p.rate >= 75 ? "bg-blue-500" : p.rate >= 50 ? "bg-yellow-500" : "bg-destructive"
                            )}
                            style={{ width: `${p.rate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {p.classroom.supervisors?.map((s: any) => s.name).join(", ") || "No supervisor assigned"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
