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
import { exportAllDataAsZip, exportDataAsExcel } from "@/app/actions/export-data-actions"
import { getEvaluationsByDateRange, getClassrooms } from "@/lib/supabase-data"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
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
  FileText,
  Sparkles,
} from "lucide-react"

export function ExportManagement() {
  const { toast } = useToast()
  const { exportSheets, isExporting: isWorkerExporting, exportProgress } = useExcelWorker()
  const [exportingZip, setExportingZip] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingCustom, setExportingCustom] = useState(false)

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

  // 1. Export Master Excel Workbook via Web Worker
  const handleExportMasterExcel = async () => {
    setExportingExcel(true)
    try {
      const result = await exportDataAsExcel()
      if (!result.success || !result.sheets) {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to compile Excel data",
          variant: "destructive",
        })
        return
      }

      const fileName = `RHHS-Classroom-Champion-Master-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      await exportSheets(result.sheets, fileName)
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

  // 2. Export Complete System ZIP Backup
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

  // 3. Export Filtered Evaluations
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

      const XLSX = await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", "XLSX")
      const workbook = XLSX.utils.book_new()

      const headers = [
        "Evaluation ID",
        "Date",
        "Classroom",
        "Grade",
        "Division",
        "Supervisor Name",
        "Supervisor Email",
        "Total Score",
        "Max Score",
        "Percentage",
        "Submitted At",
      ]

      const rows = filtered.map((e) => {
        const room = classroomMap.get(e.classroom_id) || e.classroom
        const pct = e.max_score > 0 ? `${Math.round((e.total_score / e.max_score) * 100)}%` : "N/A"
        return [
          e.id,
          e.evaluation_date,
          room?.name || "Unknown",
          room?.grade || "",
          room?.division || "",
          e.supervisor?.name || "Unknown",
          e.supervisor?.email || "",
          e.total_score,
          e.max_score,
          pct,
          e.created_at ? format(new Date(e.created_at), "yyyy-MM-dd HH:mm") : "",
        ]
      })

      const sheet = {
        name: "Evaluations",
        headers,
        rows,
        stats: [
          { label: "Date Range", value: `${startDate} to ${endDate}` },
          { label: "Division Filter", value: selectedDivision === "all" ? "All Divisions" : selectedDivision },
          { label: "Total Records", value: filtered.length },
        ],
      }

      const fileName = `RHHS-Evaluations-${startDate}-to-${endDate}.xlsx`
      await exportSheets([sheet], fileName)
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
        title="Data Exports & Reporting Hub"
        description="Generate comprehensive Excel workbooks, full database backup archives, and targeted evaluation reports."
        badge="Export Center"
      />

      {/* Quick Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Multi-Sheet
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-2">Master Excel Workbook</CardTitle>
            <CardDescription className="text-xs">
              Complete cross-tabular spreadsheet containing Classrooms, Staff, Rubrics, Evaluations, and KPI analytics.
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
                Full Database
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-2">System Database Backup</CardTitle>
            <CardDescription className="text-xs">
              Direct JSON database dumps for all tables in a single compressed ZIP archive for backup and compliance.
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
                  <Database className="h-4 w-4" /> Download System Backup (.zip)
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
                Filter evaluation records by date range and division to download tailored reports.
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
                  <SelectItem value="all">All Divisions</SelectItem>
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
              Exports include classroom name, division, supervisor, score percentages, and timestamps.
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
