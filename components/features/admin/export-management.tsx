"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useExcelWorker } from "@/lib/workers/use-excel-worker"
import {
  exportAllDataAsZip,
  exportDataAsExcel,
  exportWeeklyGreenReport,
} from "@/app/actions/export-data-actions"
import { downloadWorkbookBuffer } from "@/lib/excel/excel-design-tokens"
import { buildFilteredEvaluationsWorkbook } from "@/lib/excel/master-export-builder"
import { getEvaluationsByDateRange, getClassrooms } from "@/lib/supabase-data"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek } from "date-fns"
import {
  Download,
  FileSpreadsheet,
  Archive,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  Loader2,
  Sparkles,
  Trophy,
  Award,
} from "lucide-react"

export function ExportManagement() {
  const { toast } = useToast()
  const { exportSheets, isExporting: isWorkerExporting, exportProgress } = useExcelWorker()
  const [exportingZip, setExportingZip] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingWeekly, setExportingWeekly] = useState(false)
  const [exportingCustom, setExportingCustom] = useState(false)

  // Weekly export filter states
  const [weeklyPreset, setWeeklyPreset] = useState<"current-week" | "last-week" | "custom">("current-week")
  const [weeklyStartDate, setWeeklyStartDate] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  )

  // Custom export filter states
  const [dateRangePreset, setDateRangePreset] = useState<"current-month" | "last-month" | "custom">("current-month")
  const [startDate, setStartDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [selectedDivision, setSelectedDivision] = useState<string>("all")

  const handleDatePresetChange = (preset: "current-month" | "last-month" | "custom") => {
    setDateRangePreset(preset)
    const now = new Date()
    if (preset === "current-month") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"))
      setEndDate(format(endOfMonth(now), "yyyy-MM-dd"))
    } else if (preset === "last-month") {
      const prev = subMonths(now, 1)
      setStartDate(format(startOfMonth(prev), "yyyy-MM-dd"))
      setEndDate(format(endOfMonth(prev), "yyyy-MM-dd"))
    }
  }

  // Load external script on demand helper
  const loadScript = (src: string, globalName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (window[globalName]) {
        // @ts-ignore
        return resolve(window[globalName])
      }
      const existing = document.querySelector(`script[src="${src}"]`)
      if (existing) {
        existing.addEventListener("load", () => {
          // @ts-ignore
          resolve(window[globalName])
        })
        existing.addEventListener("error", reject)
        return
      }
      const script = document.createElement("script")
      script.src = src
      script.async = true
      script.onload = () => {
        // @ts-ignore
        resolve(window[globalName])
      }
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.body.appendChild(script)
    })
  }

  // 1. Export Weekly Green Rankings (Benchmark Shaded Format with Per-Division Sheets)
  const handleExportWeeklyGreenRankings = async () => {
    setExportingWeekly(true)
    try {
      const result = await exportWeeklyGreenReport({
        startDate: weeklyStartDate,
        weekPreset: weeklyPreset,
      })

      if (!result.success || !result.base64) {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to generate weekly green report",
          variant: "destructive",
        })
        return
      }

      const binary = atob(result.base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      downloadWorkbookBuffer(bytes.buffer, result.fileName || "RHHS_Green_App_Rankings_Shaded.xlsx")

      toast({
        title: "Shaded Excel Export Ready",
        description: `Downloaded ${result.fileName} with per-division sheets and winners summary.`,
      })
    } catch (err: any) {
      console.error("Weekly export error:", err)
      toast({
        title: "Export Error",
        description: err.message || "Failed to generate weekly report",
        variant: "destructive",
      })
    } finally {
      setExportingWeekly(false)
    }
  }

  // 2. Export Master Excel Workbook (Unified Styling & Division Sheets)
  const handleExportMasterExcel = async () => {
    setExportingExcel(true)
    try {
      const result = await exportDataAsExcel()
      if (!result.success) {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to compile Excel data",
          variant: "destructive",
        })
        return
      }

      if (result.base64) {
        const binary = atob(result.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        downloadWorkbookBuffer(
          bytes.buffer,
          result.fileName || `RHHS-Classroom-Champion-Master-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`
        )
        toast({
          title: "Master Excel Ready",
          description: `Downloaded ${result.fileName} with per-division sheets.`,
        })
        return
      }

      // Fallback to web worker if base64 not available
      if (result.sheets) {
        const fileName = `RHHS-Classroom-Champion-Master-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`
        await exportSheets(result.sheets, fileName)
      }
    } catch (err: any) {
      console.error("Excel generation error:", err)
      toast({
        title: "Export Error",
        description: err.message || "Failed to generate Excel file",
        variant: "destructive",
      })
    } finally {
      setExportingExcel(false)
    }
  }

  // 3. Export Complete System ZIP Backup
  const handleExportSystemBackupZip = async () => {
    setExportingZip(true)
    try {
      const result = await exportAllDataAsZip()
      if (!result.success || !result.files) {
        toast({
          title: "Backup Failed",
          description: result.error || "Failed to compile system database files",
          variant: "destructive",
        })
        return
      }

      const JSZip = await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "JSZip")
      const zip = new JSZip()

      result.files.forEach((file: any) => {
        zip.file(file.filename, file.content)
      })

      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rhhs-classroom-champion-backup-${format(new Date(), "yyyy-MM-dd")}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup Archive Created",
        description: `Exported ${result.files.length} JSON database collections in ZIP archive.`,
      })
    } catch (err: any) {
      console.error("ZIP creation error:", err)
      toast({
        title: "Export Error",
        description: err.message || "Failed to generate ZIP archive",
        variant: "destructive",
      })
    } finally {
      setExportingZip(false)
    }
  }

  // 4. Export Filtered Evaluations with Shaded Styling & Per-Division Tabs
  const handleExportCustomEvaluations = async () => {
    setExportingCustom(true)
    try {
      const [evaluations, classrooms] = await Promise.all([
        getEvaluationsByDateRange(startDate, endDate),
        getClassrooms(),
      ])

      const classroomMap = new Map(classrooms.map((c) => [c.id, c]))

      let filtered = evaluations
      if (selectedDivision !== "all") {
        filtered = filtered.filter((ev) => {
          const room = classroomMap.get(ev.classroom_id)
          return room?.division === selectedDivision
        })
      }

      if (filtered.length === 0) {
        toast({
          title: "No Data Found",
          description: "No evaluations matched the selected dates and division criteria.",
          variant: "destructive",
        })
        return
      }

      const workbook = await buildFilteredEvaluationsWorkbook({
        evaluations: filtered,
        classrooms,
        startDate,
        endDate,
        selectedDivision,
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const fileName = `RHHS-Evaluations-${startDate}-to-${endDate}.xlsx`
      downloadWorkbookBuffer(buffer, fileName)

      toast({
        title: "Export Ready",
        description: `Downloaded ${fileName} with per-division sheets.`,
      })
    } catch (err: any) {
      console.error("Custom export error:", err)
      toast({
        title: "Export Error",
        description: err.message || "Failed to export filtered evaluations",
        variant: "destructive",
      })
    } finally {
      setExportingCustom(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <AdminPageHeader
        title="Data Exports"
        description="Download weekly green rankings, master spreadsheets, and database backups."
        badge="Export Center"
      />

      {/* Featured Card: Weekly Green Rankings Report (Benchmark Shaded Format) */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card/80 to-teal-500/5 backdrop-blur-md shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-emerald-500 to-green-600" />
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Weekly Green Rankings Report
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                    Shaded Excel
                  </span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Mon–Fri performance with Greenest winners, dynamic formulas, and dedicated division tabs in one file.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end bg-background/50 p-4 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Week Preset
              </Label>
              <Select
                value={weeklyPreset}
                onValueChange={(val: any) => setWeeklyPreset(val)}
              >
                <SelectTrigger className="bg-background rounded-xl">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-week">Current School Week (Mon–Fri)</SelectItem>
                  <SelectItem value="last-week">Previous School Week (Mon–Fri)</SelectItem>
                  <SelectItem value="custom">Custom Week Starting Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {weeklyPreset === "custom" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Week Start Date (Monday)
                </Label>
                <Input
                  type="date"
                  value={weeklyStartDate}
                  onChange={(e) => setWeeklyStartDate(e.target.value)}
                  className="bg-background rounded-xl"
                />
              </div>
            )}

            <div className="sm:col-span-1 flex items-end">
              <Button
                onClick={handleExportWeeklyGreenRankings}
                disabled={exportingWeekly}
                className="w-full rounded-xl gap-2 font-semibold shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {exportingWeekly ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Compiling All Division Sheets...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download Shaded Rankings (.xlsx)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Master Excel Workbook & System Database Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Full Database
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-2">Master Excel Workbook</CardTitle>
            <CardDescription className="text-xs">
              Complete spreadsheet of Classrooms, Supervisors, Evaluations, KPIs, and division tabs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleExportMasterExcel}
              disabled={exportingExcel || isWorkerExporting}
              className="w-full rounded-xl gap-2 font-semibold shadow-xs cursor-pointer"
            >
              {exportingExcel || isWorkerExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {exportProgress || "Compiling Sheets..."}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Download Master Excel (.xlsx)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Archive className="h-5 w-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                JSON Tables
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-2">System Database Backup</CardTitle>
            <CardDescription className="text-xs">
              Direct JSON database dumps for all tables in a single compressed ZIP archive.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleExportSystemBackupZip}
              disabled={exportingZip}
              variant="outline"
              className="w-full rounded-xl gap-2 font-semibold shadow-xs cursor-pointer"
            >
              {exportingZip ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Archiving Tables...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" /> Download Backup (.zip)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Evaluations Export Section */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-xs">
        <CardHeader className="border-b border-border/40 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Custom Evaluations Export</CardTitle>
              <CardDescription className="text-xs">
                Filter evaluation records by date and division to generate customized Excel sheets.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date Preset
              </Label>
              <Select
                value={dateRangePreset}
                onValueChange={(val: any) => handleDatePresetChange(val)}
              >
                <SelectTrigger className="bg-background rounded-xl">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setDateRangePreset("custom")
                }}
                className="bg-background rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setDateRangePreset("custom")
                }}
                className="bg-background rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Division Filter
              </Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="bg-background rounded-xl">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions (Includes Individual Tabs)</SelectItem>
                  {DIVISION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Exports include classroom name, division, supervisor, score percentages, and timestamps in shaded format.
            </p>
            <Button
              onClick={handleExportCustomEvaluations}
              disabled={exportingCustom || isWorkerExporting}
              className="w-full sm:w-auto rounded-xl gap-2 font-semibold shadow-xs cursor-pointer"
            >
              {exportingCustom || isWorkerExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {exportProgress || "Exporting..."}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Export Filtered Evaluations (.xlsx)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
