"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getClassrooms, getClassroomsBySupervisor } from "@/lib/supabase-data"
import type { Classroom } from "@/lib/types"
import type { DateClassroomStatus } from "@/app/actions/calendar-actions"
import { useAuth } from "@/components/providers/auth-provider"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { m } from "framer-motion"
import {
  Search,
  Lock,
  Clock,
  ArrowRight,
  Check,
  Filter,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { getDivisionDisplayName } from "@/lib/division-display"
import { cn } from "@/lib/utils"

interface ClassroomSelectorProps {
  onSelect: (classroom: Classroom) => void
  targetDate?: string
  dateStatuses?: Record<string, DateClassroomStatus>
  isLoadingStatuses?: boolean
  isPastDate?: boolean
}

type FilterTab = "all" | "pending" | "evaluated"

export function ClassroomSelector({
  onSelect,
  targetDate,
  dateStatuses,
  isLoadingStatuses = false,
  isPastDate = false,
}: ClassroomSelectorProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false
    const fetchClassrooms = async () => {
      try {
        let data: Classroom[] = []

        if (user?.role === "supervisor") {
          data = await getClassroomsBySupervisor(user.id)
        } else {
          data = await getClassrooms()
        }

        if (!cancelled) {
          setClassrooms(data)
        }
      } catch (error) {
        console.error("Error fetching classrooms:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchClassrooms()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role])

  // Compute counts
  const { pendingCount, evaluatedCount } = useMemo(() => {
    if (!dateStatuses) return { pendingCount: 0, evaluatedCount: 0 }
    let done = 0
    let pending = 0
    classrooms.forEach((c) => {
      if (dateStatuses[c.id]?.isEvaluated) {
        done++
      } else {
        pending++
      }
    })
    return { pendingCount: pending, evaluatedCount: done }
  }, [classrooms, dateStatuses])

  // Filter classrooms by search query and active tab
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.grade.toString().includes(searchQuery) ||
        (c.division && c.division.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      if (!dateStatuses || activeTab === "all") return true

      const isEvaluated = !!dateStatuses[c.id]?.isEvaluated
      if (activeTab === "pending") return !isEvaluated
      if (activeTab === "evaluated") return isEvaluated

      return true
    })
  }, [classrooms, searchQuery, activeTab, dateStatuses])

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-2 animate-pulse">
          <Clock className="h-5 w-5 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-foreground">Loading assigned classrooms...</p>
        <p className="text-xs text-muted-foreground mt-0.5">Fetching room listings</p>
      </div>
    )
  }

  return (
    <LazyMotionProvider>
      <div className="space-y-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classrooms by name, grade, division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 min-h-11 rounded-xl bg-background"
            />
          </div>

          {/* Filter Tabs if date status is active */}
          {dateStatuses && (
            <div className="flex items-center p-1 bg-muted/60 rounded-xl self-start sm:self-auto border border-border/60">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "all"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({classrooms.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  activeTab === "pending"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pending
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  {pendingCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("evaluated")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  activeTab === "evaluated"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Completed
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  {evaluatedCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredClassrooms.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/10 p-6">
            <Filter className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No classrooms found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery
                ? "Try adjusting your search criteria"
                : activeTab === "pending"
                ? "All classrooms are inspected and locked for this date! 🎉"
                : "No completed classrooms found for this date."}
            </p>
            {activeTab !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("all")}
                className="mt-3 rounded-xl text-xs h-8"
              >
                Show All Classrooms
              </Button>
            )}
          </div>
        ) : (
          /* Classroom Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredClassrooms.map((classroom, index) => {
              const status = dateStatuses ? dateStatuses[classroom.id] : undefined
              const isEvaluated = !!status?.isEvaluated

              return (
                <m.div
                  key={classroom.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div
                    onClick={() => onSelect(classroom)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect(classroom)
                      }
                    }}
                    className={cn(
                      "w-full p-4 sm:p-5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer select-none",
                      isEvaluated
                        ? "bg-card/70 border-emerald-500/30 hover:border-emerald-500/50"
                        : "bg-card border-border/80 hover:border-primary/60 hover:bg-primary/5"
                    )}
                  >
                    {/* Top Row: Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base sm:text-lg text-foreground truncate">
                            {classroom.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">Grade {classroom.grade}</span>
                          {classroom.division && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium text-[11px]">
                                {getDivisionDisplayName(classroom.division)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      {dateStatuses && (
                        <div className="shrink-0">
                          {isEvaluated ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold"
                            >
                              <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{status.score} / {status.maxScore} pts</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold",
                                isPastDate
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{isPastDate ? "Pending Backfill" : "Pending"}</span>
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs w-full">
                      <div className="text-muted-foreground truncate">
                        {isEvaluated ? (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-500" />
                            {status?.supervisorName ? `Evaluated by ${status.supervisorName}` : "Locked for this date"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {isPastDate ? "Missed date • Ready to backfill" : "Ready for inspection"}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isEvaluated ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-xs text-muted-foreground hover:text-foreground">
                            View Record <ArrowRight className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:translate-x-0.5 transition-transform">
                            {isPastDate ? "Backfill Room" : "Inspect Room"} <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        )}
      </div>
    </LazyMotionProvider>
  )
}
