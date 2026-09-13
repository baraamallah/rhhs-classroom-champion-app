"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getEvaluationsBySupervisor } from "@/lib/supabase-data"
import {
  undoEvaluation,
  getEvaluationUndoLogs,
  restoreUndoneEvaluation,
  type EvaluationUndoLog,
} from "@/app/actions/evaluation-actions"
import type { Evaluation, Classroom } from "@/lib/types"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import {
  History,
  CheckCircle2,
  Lock,
  Calendar,
  RotateCcw,
  Search,
  AlertTriangle,
  ArrowRight,
  Clock,
  Undo2,
  Check,
  RefreshCw,
  FileText,
} from "lucide-react"
import { format, parseISO, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface SupervisorEvaluationsHistoryProps {
  supervisorId: string
  onEvaluateClassroom?: (classroom: Classroom) => void
}

type TabType = "records" | "undo_log"

export function SupervisorEvaluationsHistory({ supervisorId }: SupervisorEvaluationsHistoryProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>("records")
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [undoLogs, setUndoLogs] = useState<EvaluationUndoLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUndoLogs, setLoadingUndoLogs] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Undo Confirmation Dialog State
  const [selectedEvalToUndo, setSelectedEvalToUndo] = useState<Evaluation | null>(null)
  const [undoReason, setUndoReason] = useState("")
  const [undoing, setUndoing] = useState(false)

  // Restore State
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)

  // 1. Fetch active evaluations
  const fetchEvaluations = async () => {
    try {
      const data = await getEvaluationsBySupervisor(supervisorId)
      setEvaluations(data || [])
    } catch (error) {
      console.error("Error fetching supervisor evaluations:", error)
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch undo logs
  const fetchUndoLogs = async () => {
    setLoadingUndoLogs(true)
    try {
      const res = await getEvaluationUndoLogs(supervisorId)
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
    void fetchEvaluations()
    void fetchUndoLogs()
  }, [supervisorId])

  // Virtualizer for evaluation records
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((e) => {
      const name = e.classroom?.name || ""
      const grade = e.classroom?.grade || ""
      const dateStr = format(parseISO(e.evaluation_date), "MMMM d yyyy")
      const query = searchQuery.toLowerCase()
      return (
        name.toLowerCase().includes(query) ||
        grade.toLowerCase().includes(query) ||
        dateStr.toLowerCase().includes(query)
      )
    })
  }, [evaluations, searchQuery])

  const rowVirtualizer = useVirtualizer({
    count: filteredEvaluations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 4,
  })

  // Handle Undo Evaluation Action
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

        // Instantly update local states
        const undoneId = selectedEvalToUndo.id
        setEvaluations((prev) => prev.filter((e) => e.id !== undoneId))
        if (res.undoEntry) {
          setUndoLogs((prev) => [res.undoEntry!, ...prev])
        }

        setSelectedEvalToUndo(null)
        setUndoReason("")

        // Refresh lists in background
        void fetchEvaluations()
        void fetchUndoLogs()
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

  // Handle Restore Undone Evaluation
  const handleRestore = async (logId: string) => {
    setRestoringId(logId)
    try {
      const res = await restoreUndoneEvaluation(logId)
      if (res.success) {
        toast({
          title: "Evaluation Restored",
          description: res.message || "Points successfully restored to the leaderboard.",
        })
        await fetchEvaluations()
        await fetchUndoLogs()
      } else {
        toast({
          title: "Restore Failed",
          description: res.error || "Could not restore evaluation.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred while restoring.",
        variant: "destructive",
      })
    } finally {
      setRestoringId(null)
    }
  }

  // Summary Metrics
  const totalScoreSum = evaluations.reduce((sum, e) => sum + e.total_score, 0)
  const averageScore = evaluations.length > 0 ? Math.round(totalScoreSum / evaluations.length) : 0
  const highestScore = evaluations.length > 0 ? Math.max(...evaluations.map((e) => e.total_score)) : 0
  const totalPointsUndone = undoLogs.reduce((sum, l) => sum + l.reverted_points, 0)

  if (loading) {
    return (
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Evaluation Log & Audit
          </CardTitle>
          <CardDescription className="text-xs">Loading inspection records...</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-xs text-muted-foreground">Loading evaluation records...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <LazyMotionProvider>
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        {/* Card Header with Tabs */}
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Evaluation Log & History
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect recorded evaluations or manage undo points to revert scores
              </CardDescription>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-background/80 dark:bg-muted/40 rounded-xl border border-border/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("records")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "records"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Active Records
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    activeTab === "records"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {evaluations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("undo_log")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "undo_log"
                    ? "bg-amber-600 text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Undo Log
                {undoLogs.length > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                      activeTab === "undo_log"
                        ? "bg-white/25 text-white"
                        : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    )}
                  >
                    {undoLogs.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: ACTIVE EVALUATION RECORDS */}
          {/* ========================================================================= */}
          {activeTab === "records" && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-center">
                  <p className="text-xl sm:text-2xl font-black text-primary">{evaluations.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                    Evaluations Logged
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {averageScore}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                    Average Score
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                  <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                    {highestScore}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                    Highest Score
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
                  <p className="text-xl sm:text-2xl font-black text-destructive">
                    {undoLogs.length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                    Undone Points ({totalPointsUndone} pts)
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              {evaluations.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search evaluation records by classroom or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl text-xs bg-background"
                  />
                </div>
              )}

              {/* Records List */}
              {filteredEvaluations.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-border bg-muted/10 p-6">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">
                    {evaluations.length === 0 ? "No evaluations recorded yet" : "No records match search"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {evaluations.length === 0
                      ? "Completed inspections will appear here with points and undo controls."
                      : "Try changing your search terms."}
                  </p>
                </div>
              ) : (
                <div
                  ref={parentRef}
                  className="max-h-[60dvh] sm:max-h-120 overflow-y-auto rounded-xl border border-border/70 bg-card scrollbar-thin"
                  tabIndex={0}
                  aria-label="Supervisor evaluation history list"
                >
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const evaluation = filteredEvaluations[virtualRow.index]
                      if (!evaluation) return null

                      const evalDate = parseISO(evaluation.evaluation_date)
                      const evaluatedToday = isToday(evalDate)
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
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 hover:bg-muted/15 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                                {evaluation.classroom?.name || "Classroom"}
                              </h4>
                              <span className="text-xs text-muted-foreground font-medium">
                                • Grade {evaluation.classroom?.grade}
                                {evaluation.classroom?.division ? ` (${evaluation.classroom.division})` : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="h-3 w-3 text-primary" />
                                {format(evalDate, "EEEE, MMMM d, yyyy")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Score Display */}
                            <div className="text-right">
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg sm:text-xl font-black text-foreground">
                                  {evaluation.total_score}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  / {evaluation.max_score} pts
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {percentage}% score
                              </span>
                            </div>

                            {/* Status Badge */}
                            {evaluatedToday ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold py-1 px-2.5 flex items-center gap-1"
                              >
                                <Lock className="h-3 w-3" /> Today
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-muted text-muted-foreground text-[11px] font-medium py-1 px-2.5 flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Recorded
                              </Badge>
                            )}

                            {/* Undo Button (Like Undo Point) */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvalToUndo(evaluation)
                                setUndoReason("")
                              }}
                              className="h-8 px-2.5 rounded-xl text-xs font-semibold text-destructive/90 hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="hidden xs:inline">Undo</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: UNDO LOG (REVERTED EVALUATIONS AUDIT TRAIL) */}
          {/* ========================================================================= */}
          {activeTab === "undo_log" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Undo Points Audit Trail:</strong> Logs all evaluations that were undone,
                    reverting points and unlocking classrooms for re-evaluation.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchUndoLogs}
                  disabled={loadingUndoLogs}
                  className="h-7 px-2 text-[11px] rounded-lg border-amber-500/40 bg-background cursor-pointer"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", loadingUndoLogs && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {undoLogs.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/10 p-6">
                  <RotateCcw className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">No Undone Evaluations</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When an inspection is undone, it will appear here as an audit undo point.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[60dvh] sm:max-h-120 overflow-y-auto pr-1">
                  {undoLogs.map((log) => {
                    const evalDate = parseISO(log.evaluation_date)
                    const undoneDate = parseISO(log.undone_at)
                    const isRestored = !!log.restored_at

                    return (
                      <div
                        key={log.id}
                        className={cn(
                          "p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs",
                          isRestored
                            ? "bg-card/50 border-border/50 opacity-70"
                            : "bg-card border-border/80 hover:border-amber-500/40"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                              {log.classroom_name}
                            </h4>
                            <span className="text-xs text-muted-foreground font-medium">
                              • Grade {log.grade}
                            </span>
                            {isRestored ? (
                              <Badge
                                variant="outline"
                                className="bg-muted text-muted-foreground text-[10px]"
                              >
                                Restored
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

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" />
                              Inspection Date: {format(evalDate, "MMM d, yyyy")}
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

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          {!isRestored ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={restoringId === log.id}
                              onClick={() => handleRestore(log.id)}
                              className="h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Undo2 className="h-3.5 w-3.5 mr-1" />
                              {restoringId === log.id ? "Restoring..." : "Restore Point"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-emerald-500" /> Points active
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* UNDO CONFIRMATION DIALOG (LIKE UNDO POINT) */}
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
              Confirm undoing this evaluation point. This action will adjust the leaderboard scores.
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
                  Evaluation Date:{" "}
                  <strong>{format(parseISO(selectedEvalToUndo.evaluation_date), "EEEE, MMMM d, yyyy")}</strong>
                </p>
                <p className="text-[11px] text-destructive mt-1 font-medium leading-relaxed">
                  ⚠️ This classroom will be <strong>unlocked</strong> for this date, and the points will be
                  removed from the leaderboard. An entry will be created in the Undo Log.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Reason for Undo (Optional):
                </label>
                <Input
                  placeholder="e.g. Scored incorrect room, checklist mistake, etc."
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
    </LazyMotionProvider>
  )
}

