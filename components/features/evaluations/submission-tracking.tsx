"use client"

import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react"
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, startOfWeek, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { getDivisionDisplayName, DIVISION_OPTIONS } from "@/lib/division-display"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import * as XLSX from "xlsx"

interface SubmissionTrackingProps {
  currentUser?: User
}

export function SubmissionTracking(props: SubmissionTrackingProps) {
  return useSubmissionTrackingContent(props)
}

function useSubmissionTrackingContent({ currentUser }: SubmissionTrackingProps) {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(() => new Date())
  const [viewType, setViewType] = useState<"daily" | "weekly" | "monthly" | "custom">("daily")
  const [customStartDate, setCustomStartDate] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [customEndDate, setCustomEndDate] = useState<string>(() => format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [sortBy, setSortBy] = useState<"name" | "score" | "time">("time")
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearch = useDeferredValue(searchTerm)
  const [selectedDivision, setSelectedDivision] = useState<string>("all")
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      let startDate, endDate
      if (viewType === "daily") {
        startDate = format(date, "yyyy-MM-dd")
        endDate = format(date, "yyyy-MM-dd")
      } else if (viewType === "weekly") {
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        const end = addDays(start, 4) // Friday
        startDate = format(start, "yyyy-MM-dd")
        endDate = format(end, "yyyy-MM-dd")
      } else if (viewType === "monthly") {
        startDate = format(startOfMonth(date), "yyyy-MM-dd")
        endDate = format(endOfMonth(date), "yyyy-MM-dd")
      } else {
        if (!customStartDate || !customEndDate) return
        
        let startD = new Date(customStartDate)
        let endD = new Date(customEndDate)
        
        if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return
        
        // Prevent reverse dates by swapping them
        if (startD > endD) {
          const temp = customStartDate
          setCustomStartDate(customEndDate)
          setCustomEndDate(temp)
          return
        }
        
        startDate = customStartDate
        endDate = customEndDate
      }

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

  useEffect(() => {
    void fetchData()
  }, [date, viewType, customStartDate, customEndDate])

  const filteredClassrooms = useMemo(() => {
    let filtered = classrooms
    if (selectedDivision !== "all") {
      filtered = filtered.filter(c => c.division === selectedDivision)
    }
    if (deferredSearch) {
      const term = deferredSearch.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.grade.toLowerCase().includes(term) ||
        c.supervisors?.some(s => s.name.toLowerCase().includes(term))
      )
    }
    return filtered
  }, [classrooms, selectedDivision, deferredSearch])

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
    } else if (viewType === "weekly") {
      const start = startOfWeek(date, { weekStartsOn: 1 })
      const workDays = Array.from({ length: 5 }, (_, i) => addDays(start, i))

      const classroomPerformance = filteredClassrooms.map(c => {
        const classEvals = evaluations.filter(e => e.classroom_id === c.id)
        const submittedDays = new Set(classEvals.map(e => format(new Date(e.evaluation_date), "yyyy-MM-dd")))

        return {
          classroom: c,
          submittedCount: workDays.filter(d => submittedDays.has(format(d, "yyyy-MM-dd"))).length,
          totalDays: workDays.length,
          workDays: workDays.map(d => ({
            date: d,
            isSubmitted: submittedDays.has(format(d, "yyyy-MM-dd"))
          }))
        }
      })

      return {
        classroomPerformance,
        avgRate: classroomPerformance.length > 0
          ? classroomPerformance.reduce((sum, p) => sum + (p.submittedCount / p.totalDays), 0) / classroomPerformance.length * 100
          : 0
      }
    } else if (viewType === "monthly") {
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
          rate: daysInMonth.length > 0 ? (submittedDays.size / daysInMonth.length) * 100 : 0
        }
      })

      return {
        classroomPerformance,
        avgRate: classroomPerformance.length > 0
          ? classroomPerformance.reduce((sum, p) => sum + p.rate, 0) / classroomPerformance.length
          : 0
      }
    } else {
      // Custom Date Range stats
      let startD = new Date(customStartDate)
      let endD = new Date(customEndDate)
      if (isNaN(startD.getTime())) startD = startOfMonth(new Date())
      if (isNaN(endD.getTime())) endD = endOfMonth(new Date())

      const customDays = eachDayOfInterval({
        start: startD,
        end: endD
      }).filter(d => !isWeekend(d))

      const classroomPerformance = filteredClassrooms.map(c => {
        const classEvals = evaluations.filter(e => e.classroom_id === c.id)
        const submittedDays = new Set(classEvals.map(e => format(new Date(e.evaluation_date), "yyyy-MM-dd")))
        const totalDays = customDays.length
        
        return {
          classroom: c,
          submittedCount: submittedDays.size,
          totalDays: totalDays,
          rate: totalDays > 0 ? (submittedDays.size / totalDays) * 100 : 0
        }
      })

      return {
        classroomPerformance,
        avgRate: classroomPerformance.length > 0
          ? classroomPerformance.reduce((sum, p) => sum + p.rate, 0) / classroomPerformance.length
          : 0
      }
    }
  }, [filteredClassrooms, evaluations, viewType, date, customStartDate, customEndDate])

  // Synchronized sorting across all detailed lists
  const sortedClassroomPerformance = useMemo(() => {
    const perf = (submissionStats as any).classroomPerformance || []
    return [...perf].sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.classroom.name.localeCompare(b.classroom.name)
      } else if (sortBy === "score") {
        const rateA = a.rate !== undefined ? a.rate : (a.submittedCount / (a.totalDays || 1))
        const rateB = b.rate !== undefined ? b.rate : (b.submittedCount / (b.totalDays || 1))
        return rateB - rateA
      } else {
        // Latest evaluation date
        const classEvalsA = evaluations.filter(e => e.classroom_id === a.classroom.id)
        const classEvalsB = evaluations.filter(e => e.classroom_id === b.classroom.id)
        
        const lastDateA = classEvalsA.length > 0 
          ? Math.max(...classEvalsA.map(e => new Date(e.evaluation_date).getTime())) 
          : 0
        const lastDateB = classEvalsB.length > 0 
          ? Math.max(...classEvalsB.map(e => new Date(e.evaluation_date).getTime())) 
          : 0
          
        return lastDateB - lastDateA
      }
    })
  }, [submissionStats, sortBy, evaluations])

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      generateExcel()
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Error",
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
        const fileName = `Submission_Tracking_${format(date, "yyyy-MM-dd")}.xlsx`
        XLSX.writeFile(workbook, fileName)

      } else if (viewType === "weekly") {
        const start = startOfWeek(date, { weekStartsOn: 1 })
        const workDays = Array.from({ length: 5 }, (_, i) => addDays(start, i))

        const headers = ["Classroom", "Grade", "Division", "Supervisor(s)", "Total Submitted"]
        workDays.forEach(d => {
          headers.push(format(d, "EEEE (MMM d)"))
        })

        const data = [
          ["Week of", `${format(start, "PPP")} to ${format(addDays(start, 4), "PPP")}`],
          [],
          headers
        ]

        sortedClassroomPerformance.forEach((p: any) => {
          const row = [
            p.classroom.name,
            p.classroom.grade,
            getDivisionDisplayName(p.classroom.division),
            p.classroom.supervisors?.map((s: any) => s.name).join(", ") || "None",
            `${p.submittedCount}/${p.totalDays}`
          ]

          p.workDays.forEach((day: any) => {
            row.push(day.isSubmitted ? "YES" : "NO")
          })
          data.push(row)
        })

        const worksheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Tracking")
        const fileName = `Submission_Tracking_${format(date, "yyyy-'W'ww")}.xlsx`
        XLSX.writeFile(workbook, fileName)

      } else if (viewType === "monthly") {
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

        sortedClassroomPerformance.forEach((p: any) => {
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
        const fileName = `Submission_Tracking_${format(date, "yyyy-MM")}.xlsx`
        XLSX.writeFile(workbook, fileName)

      } else {
        // Custom Date Range Export
        let startD = new Date(customStartDate)
        let endD = new Date(customEndDate)
        if (isNaN(startD.getTime())) startD = startOfMonth(new Date())
        if (isNaN(endD.getTime())) endD = endOfMonth(new Date())

        const customDays = eachDayOfInterval({
          start: startD,
          end: endD
        })

        const workdays = customDays.filter(d => !isWeekend(d))
        const headers = ["Classroom", "Grade", "Division", "Supervisor(s)", "Total Submitted", "Total Workdays", "Submission Rate %"]
        workdays.forEach(d => {
          headers.push(format(d, "MMM d"))
        })

        const data = [
          ["Period", `${format(startD, "PPP")} to ${format(endD, "PPP")}`],
          [],
          headers
        ]

        sortedClassroomPerformance.forEach((p: any) => {
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Custom Tracking")
        const fileName = `Submission_Tracking_Custom_${format(startD, "yyyy-MM-dd")}_to_${format(endD, "yyyy-MM-dd")}.xlsx`
        XLSX.writeFile(workbook, fileName)
      }

      toast({
        title: "Export Successful",
        description: "Exported submission tracking data successfully.",
      })
    } catch (error) {
      console.error("Excel generation error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to generate Excel file",
        variant: "destructive",
      })
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
          {currentUser?.role !== "stats" && (
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin
              </Link>
            </Button>
          )}
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
              <label className="text-xs font-medium text-muted-foreground" id="tracking-view-type-label">View Type</label>
              <Tabs aria-labelledby="tracking-view-type-label" value={viewType} onValueChange={(v) => setViewType(v as any)} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Week</TabsTrigger>
                  <TabsTrigger value="monthly">Month</TabsTrigger>
                  <TabsTrigger value="custom">Range</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {viewType !== "custom" ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="tracking-date">
                  {viewType === "daily" ? "Select Date" : viewType === "weekly" ? "Select Week" : "Select Month"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="tracking-date"
                    type={viewType === "monthly" ? "month" : "date"}
                    className="pl-8"
                    value={format(date, viewType === "monthly" ? "yyyy-MM" : "yyyy-MM-dd")}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      if (!isNaN(newDate.getTime())) {
                        setDate(newDate)
                      }
                    }}
                  />
                </div>
                {viewType === "weekly" && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Week of {format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d")} - {format(addDays(startOfWeek(date, { weekStartsOn: 1 }), 4), "MMM d")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="tracking-start-date">From Date</label>
                  <Input
                    id="tracking-start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="tracking-end-date">To Date</label>
                  <Input
                    id="tracking-end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" id="tracking-sort-label">Sort By</label>
              <Select aria-labelledby="tracking-sort-label" value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Latest First</SelectItem>
                  <SelectItem value="score">Higher Rate First</SelectItem>
                  <SelectItem value="name">Classroom Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" id="tracking-division-label">Division Filter</label>
              <Select aria-labelledby="tracking-division-label" value={selectedDivision} onValueChange={setSelectedDivision}>
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
              <label className="text-xs font-medium text-muted-foreground" htmlFor="tracking-search">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tracking-search"
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
            <Card className="border-border/85 shadow-sm transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Total Classrooms</p>
                    <p className="text-2xl font-bold">{filteredClassrooms.length}</p>
                  </div>
                  <School className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/85 shadow-sm transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
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
            <Card className="border-border/85 shadow-sm transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
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
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {viewType === "daily"
                  ? `Submission Status for ${format(date, "PPP")}`
                  : viewType === "weekly"
                  ? `Weekly Status (${format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d")} - ${format(addDays(startOfWeek(date, { weekStartsOn: 1 }), 4), "MMM d")})`
                  : viewType === "monthly"
                  ? `Monthly Performance for ${format(date, "MMMM yyyy")}`
                  : `Custom Period Tracking (${format(new Date(customStartDate), "MMM d, yyyy")} - ${format(new Date(customEndDate), "MMM d, yyyy")})`}
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
                  {/* Submitted List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Submitted ({(submissionStats as any).submitted.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(submissionStats as any).submitted
                        .map((c: Classroom) => {
                          const eval_ = evaluations.find(e => e.classroom_id === c.id)
                          return { classroom: c, evaluation: eval_ }
                        })
                        .sort((a: any, b: any) => {
                          if (sortBy === "score") {
                            return (b.evaluation?.total_score || 0) - (a.evaluation?.total_score || 0)
                          } else if (sortBy === "name") {
                            return a.classroom.name.localeCompare(b.classroom.name)
                          } else {
                            return new Date(b.evaluation?.created_at || 0).getTime() - new Date(a.evaluation?.created_at || 0).getTime()
                          }
                        })
                        .map(({ classroom: c, evaluation: eval_ }: any) => (
                          <div key={c.id} className="p-3 rounded-lg border bg-card flex items-center justify-between transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:bg-muted/30">
                            <div>
                              <p className="font-semibold text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Grade {c.grade} • {getDivisionDisplayName(c.division)}</p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">
                                  {eval_?.supervisor?.name || c.supervisors?.[0]?.name || "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">{eval_?.total_score} pts</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{eval_ ? format(new Date(eval_.created_at || ""), "p") : ""}</p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Missing List - High Priority */}
                  {(submissionStats as any).notSubmitted.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Not Submitted ({(submissionStats as any).notSubmitted.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(submissionStats as any).notSubmitted.map((c: Classroom) => (
                          <div key={c.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center justify-between transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:bg-destructive/10">
                            <div>
                              <p className="font-semibold text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Grade {c.grade} • {getDivisionDisplayName(c.division)}</p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">
                                  {c.supervisors?.map(s => s.name).join(", ") || "No supervisor assigned"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                              Missing
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : viewType === "weekly" ? (
                /* Weekly List */
                <div className="space-y-4">
                  {sortedClassroomPerformance.map((p: any) => (
                    <div key={p.classroom.id} className="p-4 rounded-lg border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:bg-muted/20">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{p.classroom.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Grade {p.classroom.grade} • {getDivisionDisplayName(p.classroom.division)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">
                            {p.classroom.supervisors?.map((s: any) => s.name).join(", ") || "No supervisor"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.workDays.map((day: any) => (
                          <div key={format(day.date, "yyyy-MM-dd")} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              {format(day.date, "eee").charAt(0)}
                            </span>
                            <div
                              className={cn(
                                "h-8 w-8 rounded-md flex items-center justify-center border transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200",
                                day.isSubmitted
                                  ? "bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20"
                                  : "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                              )}
                              title={`${format(day.date, "EEEE, MMM d")}: ${day.isSubmitted ? "Submitted" : "Missing"}`}
                            >
                              {day.isSubmitted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-right min-w-22.5 border-l pl-4">
                        <p className="text-lg font-bold text-primary">{p.submittedCount}/{p.totalDays}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Submitted</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Monthly & Custom Period List */
                <div className="space-y-4">
                  {sortedClassroomPerformance.map((p: any) => (
                    <div key={p.classroom.id} className="p-4 rounded-lg border bg-card space-y-3 transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">{p.classroom.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Grade {p.classroom.grade} • {getDivisionDisplayName(p.classroom.division)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{p.submittedCount}/{p.totalDays}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Days Submitted</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {viewType === "custom" ? "Custom Period Progress" : "Monthly Progress"}
                          </span>
                          <span className="font-semibold text-foreground">{p.rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-500 ease-out",
                              p.rate >= 90 ? "bg-green-500" : p.rate >= 75 ? "bg-blue-500" : p.rate >= 50 ? "bg-yellow-500" : "bg-destructive"
                            )}
                            style={{ width: `${p.rate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
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
