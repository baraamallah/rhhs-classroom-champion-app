"use client"

import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvaluations, getArchivedEvaluationsList } from "@/lib/supabase-data"
import { restoreEvaluations } from "@/app/actions/data-management-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
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
} from "lucide-react"

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function EvaluationsList() {
  const { toast } = useToast()
  const [activeEvaluations, setActiveEvaluations] = useState<Evaluation[]>([])
  const [archivedEvaluations, setArchivedEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewScope, setViewScope] = useState<"all" | "active" | "archived">("all")
  const [divisionFilter, setDivisionFilter] = useState("all")
  const [restoringId, setRestoringId] = useState<string | null>(null)

  // React 19 Concurrent Filtering: keeps typing immediately responsive
  const deferredSearch = useDeferredValue(searchTerm)

  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAllEvaluations()
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

  const combinedEvaluations = useMemo(() => [
    ...activeEvaluations.map((e) => ({ ...e, is_archived: false })),
    ...archivedEvaluations.map((e) => ({ ...e, is_archived: true })),
  ], [activeEvaluations, archivedEvaluations])

  const scopedList = useMemo(() => {
    if (viewScope === "active") return activeEvaluations.map((e) => ({ ...e, is_archived: false }))
    if (viewScope === "archived") return archivedEvaluations.map((e) => ({ ...e, is_archived: true }))
    return combinedEvaluations
  }, [viewScope, activeEvaluations, archivedEvaluations, combinedEvaluations])

  // Deferred filtered evaluations list
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
        description="Review, filter, and inspect all active inspection scores and supervisor evaluation logs."
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
                  {activeEvaluations.length} Active &bull; {archivedEvaluations.length} Archived
                </span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                Evaluation History & Scores
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Showing {filteredEvaluations.length} {filteredEvaluations.length === 1 ? "record" : "records"}
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classroom or supervisor..."
                className="pl-9 h-9 text-xs rounded-xl bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* View Scope & Division Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40 mt-3">
            {/* Scope Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewScope("all")}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
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
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
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
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  viewScope === "archived"
                    ? "bg-amber-600 text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📦 Archived ({archivedEvaluations.length})
              </button>
            </div>

            {/* Division Pills */}
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={divisionFilter === "all" ? "default" : "outline"}
                onClick={() => setDivisionFilter("all")}
                className="h-7 text-[11px] rounded-full"
              >
                All Divisions
              </Button>
              {DIVISION_OPTIONS.map((d) => (
                <Button
                  key={d.value}
                  size="sm"
                  variant={divisionFilter === d.value ? "default" : "outline"}
                  onClick={() => setDivisionFilter(d.value)}
                  className="h-7 text-[11px] rounded-full"
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
              className="max-h-160 overflow-y-auto pr-1 select-none-scroll scrollbar-thin"
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

                          {evaluation.is_archived && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestore(evaluation.id)}
                              disabled={restoringId === evaluation.id}
                              className="rounded-xl text-xs h-8 hover:bg-primary/10 hover:text-primary"
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
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
