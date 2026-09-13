"use client"

import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvaluations, getArchivedEvaluationsList } from "@/lib/supabase-data"
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
import type { Evaluation } from "@/lib/types"
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
} from "lucide-react"
import { format, parseISO } from "date-fns"

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function EvaluationsList() {
  const { toast } = useToast()
  const [activeEvaluations, setActiveEvaluations] = useState<Evaluation[]>([])
  const [archivedEvaluations, setArchivedEvaluations] = useState<Evaluation[]>([])
  const [undoLogs, setUndoLogs] = useState<EvaluationUndoLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUndoLogs, setLoadingUndoLogs] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewScope, setViewScope] = useState<"all" | "active" | "archived" | "undo_log">("all")
  const [divisionFilter, setDivisionFilter] = useState("all")
  const [restoringId, setRestoringId] = useState<string | null>(null)

  // Undo Dialog State
  const [selectedEvalToUndo, setSelectedEvalToUndo] = useState<Evaluation | null>(null)
  const [undoReason, setUndoReason] = useState("")
  const [undoing, setUndoing] = useState(false)

  // Restore Undo Log Point State
  const [restoringUndoLogId, setRestoringUndoLogId] = useState<string | null>(null)

  // React 19 Concurrent Filtering: keeps typing immediately responsive
  const deferredSearch = useDeferredValue(searchTerm)
  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAllEvaluations()
    loadUndoLogs()
  }, [])

  const loadAllEvaluations = async () => {
    setLoading(true)
    try {
      const [activeData, archiveData] = await Promise.all([
        getEvaluations(),
        getArchivedEvaluationsList(),
      ])
      setActiveEvaluations(activeData || [])
      setArchivedEvaluations(archiveData || [])
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
        await loadAllEvaluations()
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

        void loadAllEvaluations()
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
        await loadAllEvaluations()
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

  // Filtered evaluations list
  const filteredEvaluations = useMemo(() => {
    const searchLower = deferredSearch.trim().toLowerCase()
    return scopedList.filter((e) => {
      const matchesSearch =
        !searchLower ||
        (e.classroom?.name || "").toLowerCase().includes(searchLower) ||
        (e.classroom?.grade || "").toLowerCase().includes(searchLower) ||
        (e.supervisor?.name || "").toLowerCase().includes(searchLower) ||
        (e.classroom?.division || "").toLowerCase().includes(searchLower)

      const matchesDivision = divisionFilter === "all" || e.classroom?.division === divisionFilter

      return matchesSearch && matchesDivision
    })
  }, [scopedList, deferredSearch, divisionFilter])

  // Filtered undo logs
  const filteredUndoLogs = useMemo(() => {
    const searchLower = deferredSearch.trim().toLowerCase()
    return undoLogs.filter((l) => {
      const matchesSearch =
        !searchLower ||
        l.classroom_name.toLowerCase().includes(searchLower) ||
        l.grade.toLowerCase().includes(searchLower) ||
        l.supervisor_name.toLowerCase().includes(searchLower) ||
        (l.division && l.division.toLowerCase().includes(searchLower))

      const matchesDivision = divisionFilter === "all" || l.division === divisionFilter

      return matchesSearch && matchesDivision
    })
  }, [undoLogs, deferredSearch, divisionFilter])

  // TanStack Virtualizer with dynamic element measurement
  const rowVirtualizer = useVirtualizer({
    count: filteredEvaluations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

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

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classroom or supervisor..."
                className="pl-9 min-h-11 text-xs sm:text-sm rounded-xl bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* View Scope & Division Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40 mt-3">
            {/* Scope Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewScope("all")}
                className={`min-h-9.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
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
                className={`min-h-9.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
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
                className={`min-h-9.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
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
                className={`min-h-9.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewScope === "undo_log"
                    ? "bg-destructive text-destructive-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                Undo Log ({undoLogs.length})
              </button>
            </div>

            {/* Division Pills */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={divisionFilter === "all" ? "default" : "outline"}
                onClick={() => setDivisionFilter("all")}
                className="min-h-8.5 xs:min-h-8 sm:h-7 text-[11px] rounded-full px-3 cursor-pointer"
              >
                All Divisions
              </Button>
              {DIVISION_OPTIONS.map((d) => (
                <Button
                  key={d.value}
                  size="sm"
                  variant={divisionFilter === d.value ? "default" : "outline"}
                  onClick={() => setDivisionFilter(d.value)}
                  className="min-h-8.5 xs:min-h-8 sm:h-7 text-[11px] rounded-full px-3 cursor-pointer"
                >
                  {d.label}
                </Button>
              ))}
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
                    const evalDate = parseISO(log.evaluation_date)
                    const undoneDate = parseISO(log.undone_at)
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
                              Inspection Date: {format(evalDate, "MMM d, yyyy")}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Supervisor: {log.supervisor_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Undone: {format(undoneDate, "MMM d, yyyy h:mm a")} by {log.undone_by_name}
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
            /* Virtualized Windowing Container */
            <div
              ref={parentRef}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-all gap-3 shadow-2xs">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              evaluation.is_archived
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {percentage}%
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-foreground text-sm sm:text-base truncate">
                                {evaluation.classroom?.name || "Classroom"}
                              </h4>
                              {evaluation.classroom?.division && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  {evaluation.classroom.division}
                                </Badge>
                              )}
                              {evaluation.is_archived ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/30"
                                >
                                  📦 Archived
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                                >
                                  🟢 Live Active
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {evaluation.supervisor?.name || "Supervisor"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(evaluation.evaluation_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-sm text-foreground">
                              {evaluation.total_score} / {evaluation.max_score} pts
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium">Eco Inspection Score</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Live Active Undo Button */}
                            {!evaluation.is_archived && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEvalToUndo(evaluation)
                                  setUndoReason("")
                                }}
                                className="rounded-xl text-xs h-8.5 px-3 text-destructive/90 hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 cursor-pointer shadow-2xs font-semibold flex items-center gap-1"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Undo</span>
                              </Button>
                            )}

                            {/* Restore from Archive Button */}
                            {evaluation.is_archived && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(evaluation.id)}
                                disabled={restoringId === evaluation.id}
                                className="rounded-xl text-xs min-h-11 px-3.5 hover:bg-primary/10 hover:text-primary cursor-pointer"
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

      {/* Undo Confirmation Dialog */}
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
                    {selectedEvalToUndo.classroom?.name || "Classroom"} (Grade{" "}
                    {selectedEvalToUndo.classroom?.grade})
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

