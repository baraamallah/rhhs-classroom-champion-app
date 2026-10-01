"use client"

import { useState, useEffect, useMemo, useDeferredValue } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvaluations, getArchivedEvaluationsList, getChecklistItems } from "@/lib/supabase-data"
import { restoreEvaluations } from "@/app/actions/data-management-actions"
import {
  undoEvaluation,
  getEvaluationUndoLogs,
  restoreUndoneEvaluation,
  type EvaluationUndoLog,
} from "@/app/actions/evaluation-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import type { Evaluation, ChecklistItem } from "@/lib/types"
import {
  FileText,
  Calendar,
  User,
  Search,
  RotateCcw,
  Sparkles,
  Archive,
  CheckCircle2,
  Loader2,
  Building2,
  AlertTriangle,
  Undo2,
  Clock,
  RefreshCw,
  Check,
  Eye,
  SlidersHorizontal,
  XCircle,
  Award,
  CheckSquare,
  Square,
  Download,
} from "lucide-react"
import { format } from "date-fns"

// Timezone-safe date formatting helper
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A"
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [y, m, d] = dateString.split("-").map(Number)
      const date = new Date(y, m - 1, d, 12, 0, 0)
      return format(date, "MMM d, yyyy")
    }
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? "N/A" : format(date, "MMM d, yyyy")
  } catch {
    return dateString || "N/A"
  }
}

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? "N/A" : format(date, "MMM d, yyyy h:mm a")
  } catch {
    return dateString || "N/A"
  }
}

export function EvaluationsList() {
  const { toast } = useToast()
  const [activeEvaluations, setActiveEvaluations] = useState<Evaluation[]>([])
  const [archivedEvaluations, setArchivedEvaluations] = useState<Evaluation[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [undoLogs, setUndoLogs] = useState<EvaluationUndoLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUndoLogs, setLoadingUndoLogs] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewScope, setViewScope] = useState<"all" | "active" | "archived" | "undo_log">("all")
  const [divisionFilter, setDivisionFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc")
  const [restoringId, setRestoringId] = useState<string | null>(null)

  // Inspection Details Modal State
  const [inspectedEvaluation, setInspectedEvaluation] = useState<Evaluation | null>(null)

  // Undo Dialog State
  const [selectedEvalToUndo, setSelectedEvalToUndo] = useState<Evaluation | null>(null)
  const [undoReason, setUndoReason] = useState("")
  const [undoing, setUndoing] = useState(false)

  // Restore Undo Log Point State
  const [restoringUndoLogId, setRestoringUndoLogId] = useState<string | null>(null)

  // React 19 Concurrent Filtering
  const deferredSearch = useDeferredValue(searchTerm)

  // TanStack Virtualizer state-based DOM element reference (prevents unmounted null reference bugs)
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [activeData, archiveData, itemsData] = await Promise.all([
        getEvaluations(),
        getArchivedEvaluationsList(),
        getChecklistItems(),
      ])
      setActiveEvaluations(activeData || [])
      setArchivedEvaluations(archiveData || [])
      setChecklistItems(itemsData || [])
    } catch (error) {
      console.error("Error fetching evaluations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUndoLogs = async () => {
    setLoadingUndoLogs(true)
    try {
      const res = await getEvaluationUndoLogs()
      if (res.success && res.data) {
        setUndoLogs(res.data)
      }
    } catch (error) {
      console.error("Error fetching undo logs:", error)
    } finally {
      setLoadingUndoLogs(false)
    }
  }

  useEffect(() => {
    if (viewScope === "undo_log") {
      void loadUndoLogs()
    }
  }, [viewScope])

  // Checklist map for looking up criterion names and weights in details modal
  const checklistMap = useMemo(() => {
    return new Map(checklistItems.map((item) => [item.id, item]))
  }, [checklistItems])

  // Restore from Archive
  const handleRestore = async (id: string) => {
    setRestoringId(id)
    try {
      const res = await restoreEvaluations([id])
      if (res.success) {
        toast({
          title: "Evaluation Restored",
          description: "Evaluation moved back to active live submissions.",
        })
        await loadAllData()
      } else {
        toast({ title: "Restore Failed", description: res.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setRestoringId(null)
    }
  }

  // Undo Evaluation Action
  const handleConfirmUndo = async () => {
    if (!selectedEvalToUndo) return
    setUndoing(true)

    try {
      const res = await undoEvaluation(selectedEvalToUndo.id, undoReason)
      if (res.success) {
        toast({
          title: "Evaluation Undone",
          description:
            res.message ||
            `Reverted ${selectedEvalToUndo.total_score} points. Classroom unlocked for this date.`,
        })

        const undoneId = selectedEvalToUndo.id
        setActiveEvaluations((prev) => prev.filter((e) => e.id !== undoneId))
        if (res.undoEntry) {
          setUndoLogs((prev) => [res.undoEntry!, ...prev])
        }

        setSelectedEvalToUndo(null)
        setUndoReason("")
        if (inspectedEvaluation?.id === undoneId) {
          setInspectedEvaluation(null)
        }

        void loadAllData()
        void loadUndoLogs()
      } else {
        toast({
          title: "Undo Failed",
          description: res.error || "Could not undo evaluation.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setUndoing(false)
    }
  }

  // Restore Undone Evaluation Point
  const handleRestoreUndoPoint = async (logId: string) => {
    setRestoringUndoLogId(logId)
    try {
      const res = await restoreUndoneEvaluation(logId)
      if (res.success) {
        toast({
          title: "Evaluation Restored",
          description: res.message || "Points successfully restored to live standings.",
        })
        await loadAllData()
        await loadUndoLogs()
      } else {
        toast({
          title: "Restore Failed",
          description: res.error || "Could not restore evaluation point.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to restore evaluation.",
        variant: "destructive",
      })
    } finally {
      setRestoringUndoLogId(null)
    }
  }

  const combinedEvaluations = useMemo(() => [
    ...activeEvaluations.map((e) => ({ ...e, is_archived: false })),
    ...archivedEvaluations.map((e) => ({ ...e, is_archived: true })),
  ], [activeEvaluations, archivedEvaluations])

  const scopedList = useMemo(() => {
    if (viewScope === "active") return activeEvaluations.map((e) => ({ ...e, is_archived: false }))
    if (viewScope === "archived") return archivedEvaluations.map((e) => ({ ...e, is_archived: true }))
    return combinedEvaluations
  }, [viewScope, activeEvaluations, archivedEvaluations, combinedEvaluations])

  // Filtered and Sorted evaluations list
  const filteredEvaluations = useMemo(() => {
    const searchLower = deferredSearch.trim().toLowerCase()
    const filtered = scopedList.filter((e) => {
      const formatted = formatDate(e.evaluation_date).toLowerCase()
      const matchesSearch =
        !searchLower ||
        (e.classroom?.name || "").toLowerCase().includes(searchLower) ||
        (e.classroom?.grade || "").toLowerCase().includes(searchLower) ||
        (e.supervisor?.name || "").toLowerCase().includes(searchLower) ||
        (e.classroom?.division || "").toLowerCase().includes(searchLower) ||
        formatted.includes(searchLower) ||
        (e.evaluation_date || "").includes(searchLower) ||
        e.total_score.toString() === searchLower

      const matchesDivision =
        divisionFilter === "all" ||
        (e.classroom?.division && e.classroom.division.toLowerCase() === divisionFilter.toLowerCase())

      return matchesSearch && matchesDivision
    })

    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "date_asc") {
        return (a.evaluation_date || "").localeCompare(b.evaluation_date || "")
      }
      if (sortBy === "score_desc") {
        return b.total_score - a.total_score
      }
      if (sortBy === "score_asc") {
        return a.total_score - b.total_score
      }
      // Default: date_desc
      return (b.evaluation_date || "").localeCompare(a.evaluation_date || "")
    })
  }, [scopedList, deferredSearch, divisionFilter, sortBy])

  // Filtered undo logs
  const filteredUndoLogs = useMemo(() => {
    const searchLower = deferredSearch.trim().toLowerCase()
    return undoLogs.filter((l) => {
      const formatted = formatDate(l.evaluation_date).toLowerCase()
      const matchesSearch =
        !searchLower ||
        l.classroom_name.toLowerCase().includes(searchLower) ||
        l.grade.toLowerCase().includes(searchLower) ||
        l.supervisor_name.toLowerCase().includes(searchLower) ||
        (l.division && l.division.toLowerCase().includes(searchLower)) ||
        formatted.includes(searchLower) ||
        l.evaluation_date.includes(searchLower)

      const matchesDivision =
        divisionFilter === "all" ||
        (l.division && l.division.toLowerCase() === divisionFilter.toLowerCase())

      return matchesSearch && matchesDivision
    })
  }, [undoLogs, deferredSearch, divisionFilter])

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    const total = filteredEvaluations.length
    if (total === 0) return { avgPercentage: 0, perfectCount: 0, totalPoints: 0 }

    let sumPercent = 0
    let perfect = 0
    let points = 0

    filteredEvaluations.forEach((e) => {
      const p = e.max_score > 0 ? (e.total_score / e.max_score) * 100 : 0
      sumPercent += p
      if (p >= 100) perfect++
      points += e.total_score
    })

    return {
      avgPercentage: Math.round(sumPercent / total),
      perfectCount: perfect,
      totalPoints: points,
    }
  }, [filteredEvaluations])

  // TanStack Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredEvaluations.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 92,
    overscan: 8,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  const handleExportCSV = () => {
    if (viewScope === "undo_log") {
      if (filteredUndoLogs.length === 0) {
        toast({ title: "No Data", description: "No undo logs to export." })
        return
      }
      const headers = ["Classroom", "Grade", "Division", "Date", "Reverted Points", "Supervisor", "Reason", "Undone At"]
      const rows = filteredUndoLogs.map((l) => [
        `"${(l.classroom_name || "").replace(/"/g, '""')}"`,
        `"${(l.grade || "").replace(/"/g, '""')}"`,
        `"${(l.division || "").replace(/"/g, '""')}"`,
        `"${l.evaluation_date || ""}"`,
        l.reverted_points,
        `"${(l.supervisor_name || "").replace(/"/g, '""')}"`,
        `"${(l.reason || "").replace(/"/g, '""')}"`,
        `"${l.undone_at || ""}"`,
      ])
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `evaluation-undo-log-${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: "Export Complete", description: `Exported ${rows.length} undo log entries to CSV.` })
      return
    }

    if (filteredEvaluations.length === 0) {
      toast({ title: "No Data", description: "No evaluation records to export." })
      return
    }

    const headers = ["Classroom", "Grade", "Division", "Date", "Score", "Max Score", "Percentage", "Supervisor", "Status", "Notes"]
    const rows = filteredEvaluations.map((e) => {
      const pct = e.max_score > 0 ? Math.round((e.total_score / e.max_score) * 100) : 0
      return [
        `"${(e.classroom?.name || e.classroom_name || "").replace(/"/g, '""')}"`,
        `"${(e.classroom?.grade || e.classroom_grade || "").replace(/"/g, '""')}"`,
        `"${(e.classroom?.division || e.classroom_division || "").replace(/"/g, '""')}"`,
        `"${e.evaluation_date || ""}"`,
        e.total_score,
        e.max_score,
        `${pct}%`,
        `"${(e.supervisor?.name || e.supervisor_name || "").replace(/"/g, '""')}"`,
        e.is_archived ? "Archived" : "Active",
        `"${(e.notes || "").replace(/"/g, '""')}"`,
      ]
    })
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `evaluations-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Export Complete", description: `Exported ${rows.length} evaluation records to CSV.` })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Score Submissions"
        badgeLabel="Verified Inspection History"
        title="Evaluation History & Scores"
        description="Review, filter, and inspect all active scores, undo evaluations, and track reverted undo points."
      />

      <Card className="border-border/80 shadow-xs overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/20 p-4 sm:p-5 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Score Submissions
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {activeEvaluations.length} Active &bull; {archivedEvaluations.length} Archived &bull;{" "}
                  {undoLogs.length} Undone Points
                </span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                Evaluation History & Scores
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {viewScope === "undo_log"
                  ? `Showing ${filteredUndoLogs.length} undone evaluation point${filteredUndoLogs.length !== 1 ? "s" : ""}`
                  : `Showing ${filteredEvaluations.length} ${filteredEvaluations.length === 1 ? "record" : "records"}`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classroom, supervisor, date..."
                  className="pl-9 min-h-11 text-xs sm:text-sm rounded-xl bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleExportCSV}
                className="h-11 w-11 rounded-xl shrink-0 cursor-pointer"
                title="Export filtered records to CSV"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => loadAllData()}
                disabled={loading}
                className="h-11 w-11 rounded-xl shrink-0 cursor-pointer"
                title="Refresh evaluations"
              >
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          {viewScope !== "undo_log" && filteredEvaluations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/40 mt-3">
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Filtered Records</p>
                <p className="text-base sm:text-lg font-black text-foreground">{filteredEvaluations.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Average Score</p>
                <p className="text-base sm:text-lg font-black text-primary">{summaryMetrics.avgPercentage}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">100% Perfect Scores</p>
                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.perfectCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/60">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Points Logged</p>
                <p className="text-base sm:text-lg font-black text-foreground">{summaryMetrics.totalPoints} pts</p>
              </div>
            </div>
          )}

          {/* View Scope & Division Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40 mt-3">
            {/* Scope Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewScope("all")}
                className={`min-h-9 px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  viewScope === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({combinedEvaluations.length})
              </button>
              <button
                type="button"
                onClick={() => setViewScope("active")}
                className={`min-h-9 px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  viewScope === "active"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🟢 Live Active ({activeEvaluations.length})
              </button>
              <button
                type="button"
                onClick={() => setViewScope("archived")}
                className={`min-h-9 px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  viewScope === "archived"
                    ? "bg-amber-600 text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📦 Archived ({archivedEvaluations.length})
              </button>
              <button
                type="button"
                onClick={() => setViewScope("undo_log")}
                className={`min-h-9 px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewScope === "undo_log"
                    ? "bg-destructive text-destructive-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                Undo Log ({undoLogs.length})
              </button>
            </div>

            {/* Division Pills & Sorting Controls */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={divisionFilter === "all" ? "default" : "outline"}
                  onClick={() => setDivisionFilter("all")}
                  className="h-8 text-[11px] rounded-full px-2.5 cursor-pointer"
                >
                  All Divisions
                </Button>
                {DIVISION_OPTIONS.map((d) => (
                  <Button
                    key={d.value}
                    size="sm"
                    variant={divisionFilter.toLowerCase() === d.value.toLowerCase() ? "default" : "outline"}
                    onClick={() => setDivisionFilter(d.value)}
                    className="h-8 text-[11px] rounded-full px-2.5 cursor-pointer"
                  >
                    {d.label}
                  </Button>
                ))}
              </div>

              {/* Sort Selector */}
              {viewScope !== "undo_log" && (
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
                  <span className="text-[10px] text-muted-foreground px-2">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-medium text-foreground py-1 pr-2 rounded focus:outline-hidden cursor-pointer"
                  >
                    <option value="date_desc" className="bg-popover text-popover-foreground">Newest Date</option>
                    <option value="date_asc" className="bg-popover text-popover-foreground">Oldest Date</option>
                    <option value="score_desc" className="bg-popover text-popover-foreground">Highest Score</option>
                    <option value="score_asc" className="bg-popover text-popover-foreground">Lowest Score</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm">Loading evaluations & scores...</p>
            </div>
          ) : viewScope === "undo_log" ? (
            /* ========================================================================= */
            /* UNDO LOG TAB VIEW */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Undo Points Audit Trail:</strong> Showing evaluations that were undone and
                    points reverted. Admins can review details or restore points back to live standings.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadUndoLogs}
                  disabled={loadingUndoLogs}
                  className="h-7 px-2 text-[11px] rounded-lg border-destructive/30 bg-background cursor-pointer text-foreground"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", loadingUndoLogs && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {filteredUndoLogs.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <RotateCcw className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No Undone Evaluations Found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchTerm || divisionFilter !== "all"
                      ? "No undone evaluations match your current search filters."
                      : "When an inspection is undone, it will appear here with points reverted and restore options."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[65dvh] sm:max-h-160 overflow-y-auto pr-1">
                  {filteredUndoLogs.map((log) => {
                    const isRestored = !!log.restored_at

                    return (
                      <div
                        key={log.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs",
                          isRestored
                            ? "bg-card/50 border-border/50 opacity-70"
                            : "bg-card border-border/80 hover:border-destructive/40"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-foreground text-sm sm:text-base truncate">
                              {log.classroom_name}
                            </h4>
                            <span className="text-xs text-muted-foreground font-medium">
                              • Grade {log.grade} {log.division ? `(${log.division})` : ""}
                            </span>
                            {isRestored ? (
                              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                                ✓ Restored to Live
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] font-bold"
                              >
                                -{log.reverted_points} pts Reverted
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" />
                              Inspection Date: {formatDate(log.evaluation_date)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Supervisor: {log.supervisor_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Undone: {formatDateTime(log.undone_at)} by {log.undone_by_name}
                            </span>
                          </div>

                          {log.reason && (
                            <p className="text-[11px] text-muted-foreground mt-1 italic">
                              Reason: &ldquo;{log.reason}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {!isRestored ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={restoringUndoLogId === log.id}
                              onClick={() => handleRestoreUndoPoint(log.id)}
                              className="rounded-xl text-xs h-8 px-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-semibold"
                            >
                              <Undo2 className="h-3.5 w-3.5 mr-1" />
                              {restoringUndoLogId === log.id ? "Restoring..." : "Restore Point"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-emerald-500" /> Live on board
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-foreground">No evaluations found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm || divisionFilter !== "all"
                  ? "Try adjusting your search query or division filter."
                  : activeEvaluations.length === 0 && archivedEvaluations.length > 0
                  ? "All evaluations are currently in the Archive. Click 'Archived' above to view them or restore them to the live board."
                  : "No evaluations have been submitted yet."}
              </p>
            </div>
          ) : (
            /* Virtualized Windowing Container with Safe Ref Attachment */
            <div
              ref={setScrollElement}
              className="max-h-[65dvh] sm:max-h-160 overflow-y-auto pr-1 select-none-scroll scrollbar-thin"
              tabIndex={0}
              aria-label="Evaluation records list"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const evaluation = filteredEvaluations[virtualRow.index]
                  if (!evaluation) return null

                  const percentage =
                    evaluation.max_score > 0
                      ? Math.round((evaluation.total_score / evaluation.max_score) * 100)
                      : 0

                  return (
                    <div
                      key={evaluation.id}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pb-2.5"
                    >
                      <div
                        onClick={() => setInspectedEvaluation(evaluation)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-card border border-border/80 hover:border-primary/50 transition-all gap-3 shadow-2xs cursor-pointer hover:shadow-xs group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              "h-12 w-12 rounded-xl flex flex-col items-center justify-center font-bold text-sm shrink-0 border transition-transform group-hover:scale-105",
                              percentage >= 90
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : percentage >= 70
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            )}
                          >
                            <span className="leading-none">{percentage}%</span>
                            <span className="text-[9px] font-normal opacity-80 mt-0.5">score</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                                {evaluation.classroom?.name || evaluation.classroom_name || "Classroom"}
                              </h4>
                              {(evaluation.classroom?.division || evaluation.classroom_division) && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  {evaluation.classroom?.division || evaluation.classroom_division}
                                </Badge>
                              )}
                              {evaluation.is_archived ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/30 font-medium"
                                >
                                  📦 Archived
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium"
                                >
                                  🟢 Live Active
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1 font-medium">
                                <User className="h-3 w-3" />
                                {evaluation.supervisor?.name || evaluation.supervisor_name || "Supervisor"}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-primary" />
                                {formatDate(evaluation.evaluation_date)}
                              </span>
                              {evaluation.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-[11px] truncate max-w-48 text-muted-foreground/80">
                                    &ldquo;{evaluation.notes}&rdquo;
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-sm text-foreground">
                              {evaluation.total_score} / {evaluation.max_score} pts
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium">Inspection Score</p>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* View Breakdown Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspectedEvaluation(evaluation)}
                              className="rounded-xl text-xs h-8.5 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                              title="View inspection details and breakdown"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
                              <span className="hidden xs:inline">Details</span>
                            </Button>

                            {/* Live Active Undo Button */}
                            {!evaluation.is_archived && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEvalToUndo(evaluation)
                                  setUndoReason("")
                                }}
                                className="rounded-xl text-xs h-8.5 px-2.5 text-destructive/90 hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 cursor-pointer shadow-2xs font-semibold flex items-center gap-1"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Undo</span>
                              </Button>
                            )}

                            {/* Restore from Archive Button */}
                            {evaluation.is_archived && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(evaluation.id)}
                                disabled={restoringId === evaluation.id}
                                className="rounded-xl text-xs h-8.5 px-3 hover:bg-primary/10 hover:text-primary cursor-pointer border-amber-500/40"
                              >
                                {restoringId === evaluation.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 1. INSPECTION DETAILS MODAL (VIEW BREAKDOWN) */}
      {/* ========================================================================= */}
      <Dialog
        open={!!inspectedEvaluation}
        onOpenChange={(open) => !open && setInspectedEvaluation(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90dvh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {inspectedEvaluation?.classroom?.name || inspectedEvaluation?.classroom_name || "Classroom"} Inspection
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Grade {inspectedEvaluation?.classroom?.grade || inspectedEvaluation?.classroom_grade}
                  {(inspectedEvaluation?.classroom?.division || inspectedEvaluation?.classroom_division) &&
                    ` • ${inspectedEvaluation?.classroom?.division || inspectedEvaluation?.classroom_division}`}
                </DialogDescription>
              </div>

              {inspectedEvaluation?.is_archived ? (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                  📦 Archived
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                  🟢 Live Active
                </Badge>
              )}
            </div>
          </DialogHeader>

          {inspectedEvaluation && (
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Score Hero */}
              <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Evaluation Score</p>
                  <p className="text-2xl font-black text-foreground">
                    {inspectedEvaluation.total_score} <span className="text-sm font-semibold text-muted-foreground">/ {inspectedEvaluation.max_score} pts</span>
                  </p>
                </div>
                <div
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-sm font-black border",
                    inspectedEvaluation.max_score > 0 && Math.round((inspectedEvaluation.total_score / inspectedEvaluation.max_score) * 100) >= 90
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-primary/15 text-primary border-primary/30"
                  )}
                >
                  {inspectedEvaluation.max_score > 0
                    ? Math.round((inspectedEvaluation.total_score / inspectedEvaluation.max_score) * 100)
                    : 0}%
                </div>
              </div>

              {/* Inspection Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Inspection Date</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {formatDate(inspectedEvaluation.evaluation_date)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Supervisor</span>
                  <span className="font-semibold text-foreground mt-0.5 block truncate">
                    {inspectedEvaluation.supervisor?.name || inspectedEvaluation.supervisor_name || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Checklist Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckSquare className="h-3.5 w-3.5 text-primary" />
                  Inspection Checklist Criteria
                </h4>

                {inspectedEvaluation.items && Object.keys(inspectedEvaluation.items).length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(inspectedEvaluation.items).map(([itemId, isChecked]) => {
                      const criterion = checklistMap.get(itemId)
                      const title = criterion?.title || `Criterion #${itemId.slice(0, 6)}`
                      const pts = criterion?.points || 1

                      return (
                        <div
                          key={itemId}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors",
                            isChecked
                              ? "bg-emerald-500/5 border-emerald-500/30 text-foreground"
                              : "bg-muted/20 border-border/50 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isChecked ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className={cn("font-medium truncate", isChecked ? "text-foreground" : "line-through opacity-70")}>
                                {title}
                              </p>
                              {criterion?.category && (
                                <p className="text-[10px] text-muted-foreground">{criterion.category}</p>
                              )}
                            </div>
                          </div>

                          <span className={cn("font-mono font-bold shrink-0 text-xs", isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                            {isChecked ? `+${pts} pts` : `0 / ${pts} pts`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Criterion breakdown items were not recorded for this legacy entry.
                  </p>
                )}
              </div>

              {/* Notes Section */}
              {inspectedEvaluation.notes && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <p className="text-[11px] font-bold text-foreground">Supervisor Notes:</p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    &ldquo;{inspectedEvaluation.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 flex flex-row items-center justify-between gap-2">
            {!inspectedEvaluation?.is_archived ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEvalToUndo(inspectedEvaluation)
                  setUndoReason("")
                }}
                className="rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Undo Evaluation
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInspectedEvaluation(null)}
              className="rounded-xl text-xs cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. UNDO CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedEvalToUndo}
        onOpenChange={(open) => !open && setSelectedEvalToUndo(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Undo Evaluation & Revert Points
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm undoing this evaluation point. This will deduct points from the leaderboard and unlock the classroom for this date.
            </DialogDescription>
          </DialogHeader>

          {selectedEvalToUndo && (
            <div className="space-y-3.5 py-2">
              <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">
                    {selectedEvalToUndo.classroom?.name || selectedEvalToUndo.classroom_name || "Classroom"} (Grade{" "}
                    {selectedEvalToUndo.classroom?.grade || selectedEvalToUndo.classroom_grade})
                  </span>
                  <Badge variant="outline" className="bg-destructive/20 text-destructive font-black text-xs">
                    -{selectedEvalToUndo.total_score} pts
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Evaluation Date: <strong>{formatDate(selectedEvalToUndo.evaluation_date)}</strong>
                </p>
                <p className="text-[11px] text-destructive mt-1 font-medium leading-relaxed">
                  ⚠️ This classroom will be <strong>unlocked</strong> for this date, and the points will be
                  removed from the school leaderboard. An audit entry will be created in the Undo Log.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Reason for Undo (Optional):
                </label>
                <Input
                  placeholder="e.g. Scored incorrect classroom, checklist error, etc."
                  value={undoReason}
                  onChange={(e) => setUndoReason(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedEvalToUndo(null)}
              disabled={undoing}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmUndo}
              disabled={undoing}
              className="rounded-xl text-xs h-9 font-bold cursor-pointer"
            >
              {undoing ? "Undoing..." : "Confirm Undo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
