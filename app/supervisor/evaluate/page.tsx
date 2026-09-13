"use client"

import { Suspense, useState, useEffect, useMemo, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ClassroomSelector } from "@/components/features/evaluations/classroom-selector"
import { EvaluationForm } from "@/components/features/evaluations/evaluation-form"
import { EvaluationSuccess } from "@/components/features/evaluations/evaluation-success"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getClassrooms } from "@/lib/supabase-data"
import type { Classroom, User } from "@/lib/types"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"
import {
  getDateClassroomEvaluationOverview,
  type DateEvaluationOverview,
  type DateClassroomStatus,
  type MissedDayRecord,
} from "@/app/actions/calendar-actions"
import {
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  Info,
  RotateCcw,
} from "lucide-react"
import { format, parseISO, isToday, isPast, isFuture, isWeekend } from "date-fns"
import { cn } from "@/lib/utils"

type ViewState = "select" | "evaluate" | "success" | "closed"

interface SupervisorEvaluateContentProps {
  currentUser?: User
}

function SupervisorEvaluateContent({ currentUser }: SupervisorEvaluateContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const todayStr = format(new Date(), "yyyy-MM-dd")

  // URL state
  const dateParam = searchParams.get("date") || todayStr
  const classroomIdParam = searchParams.get("classroom")

  const [currentDate, setCurrentDate] = useState<string>(dateParam)
  const [viewState, setViewState] = useState<ViewState>("select")
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)

  // Date Evaluation Overview State
  const [dateOverview, setDateOverview] = useState<DateEvaluationOverview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [customDateInput, setCustomDateInput] = useState(currentDate)

  // Keep internal currentDate in sync with URL date param if it changes
  useEffect(() => {
    if (dateParam && dateParam !== currentDate) {
      setCurrentDate(dateParam)
      setCustomDateInput(dateParam)
    }
  }, [dateParam])

  // 1. Initial system check & fetch classrooms
  useEffect(() => {
    let cancelled = false
    const checkStatusAndFetchClassrooms = async () => {
      try {
        const statusResult = await getEvaluationsStatus()
        if (statusResult.success && statusResult.enabled === false) {
          if (!cancelled) {
            setViewState("closed")
            setLoading(false)
          }
          return
        }

        const data = await getClassrooms()
        if (!cancelled) {
          setClassrooms(data)
        }
      } catch (error) {
        console.error("Error fetching classrooms:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void checkStatusAndFetchClassrooms()
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Load evaluation overview for currentDate
  const loadDateOverview = async (targetDateStr: string) => {
    if (!currentUser) return
    setLoadingOverview(true)
    try {
      const res = await getDateClassroomEvaluationOverview(targetDateStr, currentUser.id)
      if (res.success && res.data) {
        setDateOverview(res.data)
      }
    } catch (err) {
      console.error("Error loading date overview:", err)
    } finally {
      setLoadingOverview(false)
    }
  }

  useEffect(() => {
    if (currentUser && currentDate) {
      void loadDateOverview(currentDate)
    }
  }, [currentUser?.id, currentDate])

  // 3. Synchronize selected classroom from URL parameters (without viewState dependency trap)
  useEffect(() => {
    if (viewState === "closed" || classrooms.length === 0) return

    const classroomId = searchParams.get("classroom")
    if (classroomId) {
      const classroom = classrooms.find((c) => c.id === classroomId)
      if (classroom) {
        setSelectedClassroom(classroom)
        setViewState("evaluate")
        return
      }
    }

    // If no classroom param in URL and not in success view, show selector
    if (!classroomId && viewState !== "success") {
      setSelectedClassroom(null)
      setViewState("select")
    }
  }, [searchParams, classrooms])

  // Helpers for date status map
  const dateStatusMap = useMemo<Record<string, DateClassroomStatus>>(() => {
    if (!dateOverview) return {}
    const map: Record<string, DateClassroomStatus> = {}
    dateOverview.classrooms.forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [dateOverview])

  const parsedCurrentDate = parseISO(currentDate)
  const isDateToday = isToday(parsedCurrentDate)
  const isDateInPast = isPast(parsedCurrentDate) && !isDateToday
  const missedDaysList: MissedDayRecord[] = dateOverview?.missedDays || []

  // Handlers
  const handleSwitchDate = (newDate: string) => {
    if (newDate === currentDate) {
      setIsDatePickerOpen(false)
      return
    }
    setCurrentDate(newDate)
    setCustomDateInput(newDate)
    setIsDatePickerOpen(false)
    // Clear classroom selection on date switch and update URL
    setSelectedClassroom(null)
    setViewState("select")
    router.replace(`/supervisor/evaluate?date=${newDate}`)
  }

  const handleClassroomSelect = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setViewState("evaluate")
    router.replace(`/supervisor/evaluate?classroom=${classroom.id}&date=${currentDate}`)
  }

  const handleEvaluationComplete = () => {
    setViewState("success")
    // Refresh date overview to update scores
    void loadDateOverview(currentDate)
  }

  const handleNewEvaluation = () => {
    setSelectedClassroom(null)
    setViewState("select")
    router.replace(`/supervisor/evaluate?date=${currentDate}`)
  }

  const handleCancel = () => {
    setSelectedClassroom(null)
    setViewState("select")
    router.replace(`/supervisor/evaluate?date=${currentDate}`)
  }

  const handleBackToDashboard = () => {
    router.push("/supervisor")
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-5xl space-y-4">
        {/* Top Header & Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
                className="text-xs h-8 rounded-xl px-2.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Dashboard
              </Button>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-semibold text-foreground">Classroom Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Classroom Evaluation
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Record daily eco-friendly practices and points for RHHS classrooms
            </p>
          </div>

          {/* Today Quick Action if currently viewing a backfill date */}
          {!isDateToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSwitchDate(todayStr)}
              className="rounded-xl text-xs h-9 bg-primary/5 hover:bg-primary/10 text-primary border-primary/30 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Return to Today&apos;s Inspection
            </Button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE DATE & BACKFILL CONTROL BAR */}
        {/* ========================================================================= */}
        {viewState !== "closed" && (
          <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Row 1: Active Date Banner & Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs",
                      isDateToday
                        ? "bg-primary/15 text-primary"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {isDateToday ? <Sparkles className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        {format(parsedCurrentDate, "EEEE, MMMM d, yyyy")}
                      </span>
                      {isDateToday ? (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5 rounded-md"
                        >
                          Today&apos;s Live
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] px-2 py-0.5 rounded-md"
                        >
                          Backfilling Past Day
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isDateToday
                        ? "Evaluations recorded now will count towards today's daily points."
                        : "Backfilling points for this past date. Completed evaluations will be locked."}
                    </p>
                  </div>
                </div>

                {/* Date Switcher Trigger Button */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {dateOverview && (
                    <div className="text-right hidden md:block mr-2">
                      <div className="text-xs font-bold text-foreground">
                        {dateOverview.completedCount} / {dateOverview.totalAssigned} Rooms Done
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {dateOverview.pendingCount} pending for this date
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDatePickerOpen(true)}
                    className="rounded-xl text-xs h-9 px-3 border-border hover:border-primary/50 cursor-pointer shadow-2xs font-semibold"
                  >
                    <CalendarDays className="h-4 w-4 mr-1.5 text-primary" />
                    Change Date
                  </Button>
                </div>
              </div>

              {/* Row 2: Quick Missed Days Shortcuts (Accessible Backfilling) */}
              {missedDaysList.length > 0 && (
                <div className="pt-3 border-t border-border/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Missed Days to Backfill:
                    </span>

                    {missedDaysList.slice(0, 5).map((missed) => {
                      const isSelected = missed.date === currentDate
                      const parsedMissed = parseISO(missed.date)
                      return (
                        <button
                          key={missed.date}
                          type="button"
                          onClick={() => handleSwitchDate(missed.date)}
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border select-none",
                            isSelected
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/50 shadow-2xs font-bold"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border/70"
                          )}
                        >
                          <span>{format(parsedMissed, "EEE, MMM d")}</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                              isSelected
                                ? "bg-amber-600 text-white"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            )}
                          >
                            {missed.missingClassroomIds.length} left
                          </span>
                        </button>
                      )
                    })}

                    {missedDaysList.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(true)}
                        className="text-xs text-primary hover:underline font-semibold px-1 cursor-pointer"
                      >
                        +{missedDaysList.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Non-working day warning if selected date is weekend/holiday */}
              {dateOverview && !dateOverview.isWorkingDay && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {dateOverview.holidayReason
                        ? `Non-working day: ${dateOverview.holidayReason}. Evaluations cannot be recorded.`
                        : "Selected date is a weekend (Saturday/Sunday). Daily evaluations are not conducted."}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchDate(todayStr)}
                    className="text-[11px] h-7 px-2.5 rounded-lg border-destructive/40 bg-background text-foreground"
                  >
                    Switch to Today
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Main Content Areas */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-2">
              <Clock className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm font-semibold">Loading evaluation center...</p>
            </div>
          </div>
        ) : (
          <>
            {/* System Closed */}
            {viewState === "closed" && (
              <Card className="border-destructive/50 bg-destructive/5 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    System Closed
                  </CardTitle>
                  <CardDescription>
                    The evaluation system is currently closed and not accepting new submissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Please check back later or contact an administrator if you believe this is an error.
                  </p>
                  <Button onClick={handleBackToDashboard} className="mt-6 rounded-xl">
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Classroom Selection View */}
            {viewState === "select" && (
              <Card className="rounded-2xl border-border shadow-xs">
                <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold">
                        Select Classroom to Inspect
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Choose a room below. Rooms already inspected for{" "}
                        <strong>{format(parsedCurrentDate, "MMM d, yyyy")}</strong> are locked.
                      </CardDescription>
                    </div>

                    {dateOverview && (
                      <Badge variant="outline" className="text-xs">
                        {dateOverview.completedCount} / {dateOverview.totalAssigned} Evaluated
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5">
                  <ClassroomSelector
                    onSelect={handleClassroomSelect}
                    targetDate={currentDate}
                    dateStatuses={dateStatusMap}
                    isLoadingStatuses={loadingOverview}
                    isPastDate={isDateInPast}
                  />
                </CardContent>
              </Card>
            )}

            {/* Evaluation Form View */}
            {viewState === "evaluate" && selectedClassroom && (
              <EvaluationForm
                classroom={selectedClassroom}
                user={currentUser}
                initialDate={currentDate}
                onComplete={handleEvaluationComplete}
                onCancel={handleCancel}
                onChangeDate={() => setIsDatePickerOpen(true)}
                onBackToDashboard={handleBackToDashboard}
              />
            )}

            {/* Evaluation Success View */}
            {viewState === "success" && (
              <Card className="rounded-2xl border-border shadow-xs">
                <CardContent className="py-8">
                  <EvaluationSuccess onNewEvaluation={handleNewEvaluation} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DATE PICKER & BACKFILL SELECTOR DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Select Inspection Date
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose today&apos;s date or pick a past working day within the active school year to backfill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Option: Today */}
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Today&apos;s Date</p>
                <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSwitchDate(todayStr)}
                className="rounded-xl text-xs h-8 font-semibold cursor-pointer"
              >
                Inspect Today
              </Button>
            </div>

            {/* Custom Date Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Choose Specific Date (Backfill)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customDateInput}
                  max={todayStr}
                  min={dateOverview?.schoolStartDate || "2026-09-01"}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="rounded-xl text-xs h-10 flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => customDateInput && handleSwitchDate(customDateInput)}
                  disabled={!customDateInput}
                  className="rounded-xl text-xs h-10 px-4 font-semibold cursor-pointer"
                >
                  Set Date
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only valid school working days (Mon–Fri) within the academic term will accept submissions.
              </p>
            </div>

            {/* All Missed Working Days List */}
            {missedDaysList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  All Missed Days in Term ({missedDaysList.length})
                </p>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {missedDaysList.map((missed) => {
                    const parsedM = parseISO(missed.date)
                    const isSelected = missed.date === currentDate

                    return (
                      <div
                        key={missed.date}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all",
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/40"
                            : "bg-card border-border/70 hover:border-border"
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {format(parsedM, "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {missed.missingClassroomIds.length} classroom
                            {missed.missingClassroomIds.length !== 1 ? "s" : ""} pending
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleSwitchDate(missed.date)}
                          className="rounded-lg text-xs h-7 px-2.5 cursor-pointer font-semibold"
                        >
                          {isSelected ? "Active" : "Backfill"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SupervisorEvaluatePageContent() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <SupervisorEvaluateContent />
    </ProtectedRoute>
  )
}

export default function SupervisorEvaluatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SupervisorEvaluatePageContent />
    </Suspense>
  )
}

