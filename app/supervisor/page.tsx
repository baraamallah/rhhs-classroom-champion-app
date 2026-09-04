"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SupervisorEvaluationsHistory } from "@/components/features/evaluations/supervisor-evaluations-history"
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
import {
  ClipboardCheck,
  Building2,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar as CalendarIcon,
  AlertCircle,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Check,
  CalendarOff,
} from "lucide-react"
import type { User, Classroom } from "@/lib/types"
import {
  getSupervisorDailyStatus,
  type SupervisorDailyOverview,
  type DayCalendarStatus,
} from "@/app/actions/calendar-actions"
import { cn } from "@/lib/utils"
import { format, addMonths, subMonths, parseISO, isToday } from "date-fns"

interface SupervisorDashboardContentProps {
  currentUser?: User
}

function SupervisorDashboardContent({ currentUser }: SupervisorDashboardContentProps) {
  const router = useRouter()
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date())
  const [overview, setOverview] = useState<SupervisorDailyOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Backfill Modal State
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<DayCalendarStatus | null>(null)
  const [isBackfillDialogOpen, setIsBackfillDialogOpen] = useState(false)

  const loadData = async (monthDate: Date) => {
    if (!currentUser) return
    setLoading(true)
    try {
      const monthStr = format(monthDate, "yyyy-MM-dd")
      const res = await getSupervisorDailyStatus(currentUser.id, monthStr)
      if (res.success && res.data) {
        setOverview(res.data)
      }
    } catch (err) {
      console.error("Error loading supervisor daily data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(currentMonthDate)
  }, [currentUser, currentMonthDate])

  const handlePrevMonth = () => setCurrentMonthDate((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonthDate((prev) => addMonths(prev, 1))
  const handleCurrentMonth = () => setCurrentMonthDate(new Date())

  const handleStartTodayEvaluation = (classroomId?: string) => {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    if (classroomId) {
      router.push(`/supervisor/evaluate?classroom=${classroomId}&date=${todayStr}`)
    } else {
      // Pick first pending classroom
      const firstPending = overview?.classrooms.find((c) => !c.isEvaluatedToday)
      if (firstPending) {
        router.push(`/supervisor/evaluate?classroom=${firstPending.id}&date=${todayStr}`)
      } else {
        router.push(`/supervisor/evaluate?date=${todayStr}`)
      }
    }
  }

  const handleStartBackfillEvaluation = (classroomId: string, dateStr: string) => {
    setIsBackfillDialogOpen(false)
    router.push(`/supervisor/evaluate?classroom=${classroomId}&date=${dateStr}`)
  }

  const handleCalendarDayClick = (day: DayCalendarStatus) => {
    // Only allow clicking on past working days that need evaluation, or today
    if (day.status === "missing" || day.status === "partial" || day.isToday) {
      setSelectedCalendarDay(day)
      setIsBackfillDialogOpen(true)
    }
  }

  if (!currentUser) return null

  const classrooms = overview?.classrooms || []
  const missedDays = overview?.missedDays || []
  const calendarDays = overview?.calendarDays || []
  const isTodayWorkingDay = overview?.isTodayWorkingDay ?? true
  const todayPendingCount = overview?.todayPendingCount ?? 0
  const todayCompletedCount = overview?.todayCompletedCount ?? 0
  const totalAssignedCount = overview?.totalAssignedCount ?? 0

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 flex flex-col">
      <DashboardHeader user={currentUser} />

      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-5xl flex-1 space-y-5">
        {/* Dynamic Top Welcome & Profile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                Supervisor Portal
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Daily Inspection System
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Hello, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Submit your daily classroom eco-inspections and keep school rankings up to date.
            </p>
          </div>

          {/* Quick Action Button */}
          {isTodayWorkingDay && todayPendingCount > 0 && (
            <Button
              size="lg"
              onClick={() => handleStartTodayEvaluation()}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95"
            >
              <ClipboardCheck className="mr-2 h-5 w-5" /> Start Today&apos;s Inspection ({todayPendingCount} pending)
            </Button>
          )}
        </div>

        {/* 1. DYNAMIC TOP ALERT BANNER (Today's Status & Missed Days) */}
        {loading ? (
          <Card className="p-6 rounded-2xl border-border animate-pulse bg-muted/20">
            <div className="h-5 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-72 bg-muted rounded" />
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Primary Banner: Today's Status */}
            {isTodayWorkingDay ? (
              todayPendingCount > 0 ? (
                <Card className="rounded-2xl border-amber-500/40 bg-amber-500/10 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100">
                            Today&apos;s Inspection Pending
                          </h3>
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px]">
                            {todayPendingCount} Room{todayPendingCount !== 1 ? "s" : ""} Left
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                          Daily inspections for <strong>{format(new Date(), "EEEE, MMMM d")}</strong> are not yet completed for all assigned rooms.
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleStartTodayEvaluation()}
                      className="w-full sm:w-auto h-9 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs shrink-0"
                    >
                      Inspect Today <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="rounded-2xl border-emerald-500/40 bg-emerald-500/10 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-100">
                        All Caught Up for Today!
                      </h3>
                      <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                        All {totalAssignedCount} assigned classrooms have been inspected and locked for today. Great job!
                      </p>
                    </div>
                  </div>
                </Card>
              )
            ) : (
              <Card className="rounded-2xl border-border bg-card/60 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <CalendarOff className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      School Day Off ({overview?.todayReason || "Weekend"})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Today is marked as a non-working day. Daily evaluations are not required.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Secondary Banner: Missed Past Working Days */}
            {missedDays.length > 0 && (
              <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {missedDays.length} Missed Inspection Day{missedDays.length !== 1 ? "s" : ""} in Active Term
                        </h3>
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px]">
                          Backfill Available
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You can backfill points for past missed working days so classrooms don&apos;t lose points.
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Select the most recent missed day
                      const firstMissed = missedDays[0]
                      if (firstMissed) {
                        const targetCalDay = calendarDays.find((d) => d.date === firstMissed.date)
                        if (targetCalDay) {
                          setSelectedCalendarDay(targetCalDay)
                        } else {
                          setSelectedCalendarDay({
                            date: firstMissed.date,
                            dayNumber: parseInt(firstMissed.date.split("-")[2], 10),
                            isCurrentMonth: true,
                            isWeekend: false,
                            isHoliday: false,
                            isToday: false,
                            isPast: true,
                            isFuture: false,
                            status: "missing",
                            evaluatedCount: 0,
                            totalAssigned: totalAssignedCount,
                          })
                        }
                        setIsBackfillDialogOpen(true)
                      }
                    }}
                    className="w-full sm:w-auto h-9 rounded-xl text-xs font-semibold shrink-0"
                  >
                    Backfill Recent Day ({format(parseISO(missedDays[0].date), "MMM d")})
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 2. KPI OVERVIEW METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Card className="p-3 xs:p-4 rounded-2xl border-border bg-card shadow-xs">
            <span className="text-[10px] xs:text-[11px] font-semibold text-muted-foreground uppercase block">
              Assigned Classrooms
            </span>
            <p className="text-xl xs:text-2xl font-black text-foreground mt-0.5">{totalAssignedCount}</p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">In your division</span>
          </Card>

          <Card className="p-3 xs:p-4 rounded-2xl border-border bg-card shadow-xs">
            <span className="text-[10px] xs:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">
              Today&apos;s Done
            </span>
            <p className="text-xl xs:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {todayCompletedCount}
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
              {todayCompletedCount === totalAssignedCount && totalAssignedCount > 0
                ? "All rooms locked ✓"
                : `${todayPendingCount} awaiting`}
            </span>
          </Card>

          <Card className="p-3 xs:p-4 rounded-2xl border-border bg-card shadow-xs">
            <span className="text-[10px] xs:text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase block">
              Missed Past Days
            </span>
            <p className="text-xl xs:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {missedDays.length}
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">Eligible to backfill</span>
          </Card>

          <Card className="p-3 xs:p-4 rounded-2xl border-border bg-card shadow-xs">
            <span className="text-[10px] xs:text-[11px] font-semibold text-primary uppercase block">
              Inspection Rule
            </span>
            <p className="text-base xs:text-lg sm:text-xl font-bold text-foreground mt-1">1 / Day</p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">Locks once submitted</span>
          </Card>
        </div>

        {/* 3. TODAY'S CLASSROOM INSPECTIONS ACTION QUEUE */}
        <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" /> Today&apos;s Classroom Queue
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(new Date(), "EEEE, MMMM d, yyyy")} &bull;{" "}
                  {isTodayWorkingDay ? "Daily Working Inspection" : "Non-Working Day"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {todayCompletedCount} / {totalAssignedCount} Done
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5">
            {classrooms.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No classrooms currently assigned to your supervisor account.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classrooms.map((room) => (
                  <div
                    key={room.id}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-2xs",
                      room.isEvaluatedToday
                        ? "bg-card/70 border-border/70"
                        : "bg-card border-primary/30 hover:border-primary/60 hover:shadow-xs"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-foreground truncate">
                          {room.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Grade {room.grade} {room.division ? `• ${room.division}` : ""}
                        </p>
                      </div>

                      {room.isEvaluatedToday ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] shrink-0"
                        >
                          <Lock className="h-3 w-3 mr-1" /> Locked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] shrink-0"
                        >
                          Pending
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      {room.isEvaluatedToday ? (
                        <div className="text-xs">
                          <span className="font-bold text-foreground">
                            Score: {room.todayScore} / {room.todayMaxScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Not submitted today</span>
                      )}

                      {room.isEvaluatedToday ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartTodayEvaluation(room.id)}
                          className="min-h-11 px-3 text-xs rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          View Record
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleStartTodayEvaluation(room.id)}
                          disabled={!isTodayWorkingDay}
                          className="min-h-11 px-3.5 text-xs rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                        >
                          Inspect Room <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. SUPERVISOR MONTHLY INSPECTION CALENDAR (WITH BACKFILL ABILITY) */}
        <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" /> Daily Inspection Calendar
                </CardTitle>
                <CardDescription className="text-xs">
                  {overview?.monthLabel || format(currentMonthDate, "MMMM yyyy")} &bull; Click any missed day to backfill points.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="min-h-11 min-w-11 rounded-lg cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCurrentMonth}
                  className="min-h-11 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  className="min-h-11 min-w-11 rounded-lg cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5 space-y-0">
            {/* Days header bar */}
            <div className="grid grid-cols-7 border-t border-x border-border/80 text-center text-[11px] sm:text-xs font-bold tracking-wider text-muted-foreground uppercase bg-muted/40 py-2.5 rounded-t-xl">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-muted-foreground/60">Sat</div>
              <div className="text-muted-foreground/60">Sun</div>
            </div>

            {/* Calendar grid with 1px border dividers */}
            <div className="grid grid-cols-7 gap-px bg-border/80 border border-border/80 rounded-b-xl overflow-hidden shadow-xs">
              {calendarDays.map((day) => {
                const isClickable =
                  day.isCurrentMonth &&
                  (day.status === "missing" || day.status === "partial" || (day.isToday && day.status !== "weekend" && day.status !== "holiday" && day.status !== "outside_term"))

                return (
                  <button
                    key={day.date}
                    onClick={() => isClickable && handleCalendarDayClick(day)}
                    disabled={!isClickable}
                    type="button"
                    className={cn(
                      "min-h-16 sm:min-h-25 p-1.5 sm:p-2.5 text-left transition-all flex flex-col justify-between select-none relative group",
                      !day.isCurrentMonth
                        ? "bg-muted/15 text-muted-foreground/30 cursor-default"
                        : day.status === "outside_term"
                        ? "bg-muted/35 text-muted-foreground/50 cursor-not-allowed"
                        : day.status === "completed"
                        ? "bg-card hover:bg-emerald-500/5 text-foreground"
                        : day.status === "partial"
                        ? "bg-card hover:bg-amber-500/10 text-foreground cursor-pointer"
                        : day.status === "missing"
                        ? "bg-card hover:bg-destructive/10 text-foreground cursor-pointer"
                        : day.status === "holiday"
                        ? "bg-muted/30 text-muted-foreground/70 cursor-not-allowed"
                        : day.status === "weekend"
                        ? "bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-card text-muted-foreground/60 cursor-default"
                    )}
                  >
                    {/* Top Row: Day number & Quick Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold tracking-tight",
                          !day.isCurrentMonth && "text-muted-foreground/30 font-medium",
                          day.isToday && day.isCurrentMonth && "w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs"
                        )}
                      >
                        {day.dayNumber}
                      </span>

                      {/* Status indicator badge */}
                      {day.isCurrentMonth && (
                        <>
                          {day.status === "completed" && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Check className="h-3 w-3 stroke-3" />
                              <span className="sr-only">All inspections complete</span>
                            </span>
                          )}
                          {(day.status === "missing" || day.status === "partial") && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              {day.evaluatedCount}/{day.totalAssigned}
                            </span>
                          )}
                          {day.status === "holiday" && (
                            <span className="text-[9px] text-muted-foreground/60 uppercase font-semibold">Off</span>
                          )}
                          {day.status === "weekend" && (
                            <span className="text-[9px] text-muted-foreground/40 font-medium hidden sm:inline">Off</span>
                          )}
                          {day.status === "outside_term" && (
                            <span className="text-[9px] text-muted-foreground/50 font-medium hidden sm:inline">Break</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Event Pill inside the cell (like Google/Apple calendar) */}
                    <div className="mt-1 w-full">
                      {day.isCurrentMonth && day.status === "completed" && (
                        <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[9px] sm:text-[10px] font-semibold truncate flex items-center gap-1 shadow-2xs">
                          <Check className="h-2.5 w-2.5 stroke-3 shrink-0" /> All {day.totalAssigned} Done
                        </div>
                      )}
                      {day.isCurrentMonth && day.status === "partial" && (
                        <div className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-[9px] sm:text-[10px] font-semibold truncate group-hover:bg-amber-500/30 transition-colors shadow-2xs">
                          ⚠️ Finish Day
                        </div>
                      )}
                      {day.isCurrentMonth && day.status === "missing" && (
                        <div className="px-1.5 py-0.5 rounded-md bg-destructive/15 text-destructive border border-destructive/25 text-[9px] sm:text-[10px] font-semibold truncate group-hover:bg-destructive/25 transition-colors shadow-2xs">
                          + Backfill
                        </div>
                      )}
                      {day.isCurrentMonth && day.status === "holiday" && (
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate hidden sm:block">
                          🏖️ {day.holidayReason || "School Off"}
                        </div>
                      )}
                      {day.isCurrentMonth && day.status === "outside_term" && (
                        <div className="text-[9px] text-muted-foreground/50 truncate hidden sm:block">
                          {day.holidayReason || "Outside Term"}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>All Rooms Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Missed / Needs Backfill (Clickable)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted border" />
                <span>Holiday / Weekend Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. SUPERVISOR EVALUATION HISTORY */}
        <SupervisorEvaluationsHistory supervisorId={currentUser.id} />
      </main>

      {/* BACKFILL SELECTION DIALOG */}
      <Dialog open={isBackfillDialogOpen} onOpenChange={setIsBackfillDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold">
              {selectedCalendarDay?.isToday ? "Today's Inspection" : "Backfill Missed Inspection"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedCalendarDay?.date &&
                format(parseISO(selectedCalendarDay.date), "EEEE, MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Select an assigned classroom to evaluate for this date. Completed inspections will be locked.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {classrooms.map((room) => {
                // If it's today, check room.isEvaluatedToday
                const isRoomDone =
                  selectedCalendarDay?.isToday && room.isEvaluatedToday

                return (
                  <div
                    key={room.id}
                    className="p-3 rounded-xl border border-border flex items-center justify-between gap-3 bg-card"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{room.name}</p>
                      <p className="text-xs text-muted-foreground">Grade {room.grade}</p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() =>
                        selectedCalendarDay?.date &&
                        handleStartBackfillEvaluation(room.id, selectedCalendarDay.date)
                      }
                      className="min-h-11 px-3.5 text-xs rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer"
                    >
                      Inspect <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SupervisorPage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <SupervisorDashboardContent />
    </ProtectedRoute>
  )
}
