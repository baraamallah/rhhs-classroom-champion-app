"use client"

import { useState, useEffect, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getEvaluationsBySupervisor } from "@/lib/supabase-data"
import type { Evaluation, Classroom } from "@/lib/types"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { History, CheckCircle2, Lock, Calendar, Award } from "lucide-react"
import { format, parseISO, isToday } from "date-fns"

interface SupervisorEvaluationsHistoryProps {
  supervisorId: string
  onEvaluateClassroom?: (classroom: Classroom) => void
}

export function SupervisorEvaluationsHistory({ supervisorId }: SupervisorEvaluationsHistoryProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluationsBySupervisor(supervisorId)
        if (!cancelled) setEvaluations(data)
      } catch (error) {
        console.error("Error fetching supervisor evaluations:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchEvaluations()
    return () => {
      cancelled = true
    }
  }, [supervisorId])

  const rowVirtualizer = useVirtualizer({
    count: evaluations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 74,
    overscan: 4,
  })

  if (loading) {
    return (
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Evaluation History
          </CardTitle>
          <CardDescription className="text-xs">Your completed inspections and submitted scores</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-xs text-muted-foreground">Loading evaluation records...</p>
        </CardContent>
      </Card>
    )
  }

  const totalScoreSum = evaluations.reduce((sum, e) => sum + e.total_score, 0)
  const averageScore = evaluations.length > 0 ? Math.round(totalScoreSum / evaluations.length) : 0
  const highestScore = evaluations.length > 0 ? Math.max(...evaluations.map((e) => e.total_score)) : 0

  return (
    <LazyMotionProvider>
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Evaluation History
              </CardTitle>
              <CardDescription className="text-xs">
                Your past inspection records and performance
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              {evaluations.length} {evaluations.length === 1 ? "Record" : "Records"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-5">
          {evaluations.length === 0 ? (
            <div className="text-center py-10">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">No evaluations recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed inspections will appear here along with scores and submission dates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="p-2.5 sm:p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
                  <p className="text-lg sm:text-2xl font-black text-primary">{evaluations.length}</p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium truncate">Total Evaluations</p>
                </div>

                <div className="p-2.5 sm:p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                  <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {averageScore}
                  </p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium truncate">Average Score</p>
                </div>

                <div className="p-2.5 sm:p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                  <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                    {highestScore}
                  </p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium truncate">Highest Score</p>
                </div>
              </div>

              {/* Virtualized Evaluation Records List */}
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
                    const evaluation = evaluations[virtualRow.index]
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
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(evalDate, "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Score display */}
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

                          {/* Status badge */}
                          {evaluatedToday ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold py-1 px-2.5 flex items-center gap-1"
                            >
                              <Lock className="h-3 w-3" /> Evaluated Today
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-muted text-muted-foreground text-[11px] font-medium py-1 px-2.5 flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Recorded
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </LazyMotionProvider>
  )
}
