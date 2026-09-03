"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CalendarOff,
  CheckCircle2,
  Sun,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  GraduationCap,
  Save,
} from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns"
import {
  getCalendarExceptions,
  toggleCalendarException,
  getSchoolTermDates,
  updateSchoolTermDates,
  type CalendarException,
} from "@/app/actions/calendar-actions"
import { cn } from "@/lib/utils"

export function CalendarManager() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [exceptions, setExceptions] = useState<CalendarException[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isPending, startTransition] = useTransition()

  // School Term Dates State
  const [schoolStartDate, setSchoolStartDate] = useState<string>("")
  const [schoolEndDate, setSchoolEndDate] = useState<string>("")
  const [savingTerm, setSavingTerm] = useState<boolean>(false)
  const [termFeedback, setTermFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  // Dialog State
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)
  const [reasonInput, setReasonInput] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [excRes, termRes] = await Promise.all([
        getCalendarExceptions(),
        getSchoolTermDates(),
      ])

      if (excRes.success) {
        setExceptions(excRes.data)
      }
      if (termRes.success) {
        setSchoolStartDate(termRes.data.startDate)
        setSchoolEndDate(termRes.data.endDate)
      }
    } catch (e) {
      console.error("Error loading calendar data:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveTermDates = async () => {
    setSavingTerm(true)
    setTermFeedback(null)
    try {
      const res = await updateSchoolTermDates(schoolStartDate, schoolEndDate)
      if (res.success) {
        setTermFeedback({ type: "success", msg: "School year opening and closing dates updated successfully!" })
      } else {
        setTermFeedback({ type: "error", msg: res.error || "Failed to update school dates." })
      }
    } catch (e: any) {
      setTermFeedback({ type: "error", msg: e.message || "Failed to update school dates." })
    } finally {
      setSavingTerm(false)
    }
  }

  const exceptionMap = new Map<string, CalendarException>(
    exceptions.map((e) => [e.exception_date, e])
  )

  // Month grid calculations (true full Monday-to-Sunday wall/desk calendar grid)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const gridDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    if (isWeekend(date)) return // Weekends are naturally off
    if (schoolStartDate && dateStr < schoolStartDate) return // Before school started
    if (schoolEndDate && dateStr > schoolEndDate) return // After school ended

    const existing = exceptionMap.get(dateStr)

    setSelectedDateStr(dateStr)
    setReasonInput(existing ? existing.reason : "")
    setErrorMsg(null)
    setIsDialogOpen(true)
  }

  const handleToggleException = () => {
    if (!selectedDateStr) return

    startTransition(async () => {
      const res = await toggleCalendarException(selectedDateStr, reasonInput)
      if (res.success) {
        setIsDialogOpen(false)
        const excRes = await getCalendarExceptions()
        if (excRes.success) setExceptions(excRes.data)
      } else {
        setErrorMsg(res.error || "Failed to update calendar exception")
      }
    })
  }

  const handleRemoveExceptionDirect = (dateStr: string) => {
    startTransition(async () => {
      const res = await toggleCalendarException(dateStr)
      if (res.success) {
        const excRes = await getCalendarExceptions()
        if (excRes.success) setExceptions(excRes.data)
      }
    })
  }

  // Monthly stats
  const totalDaysInMonth = daysInMonth.length
  const weekendDaysCount = daysInMonth.filter((d) => isWeekend(d)).length
  const holidaysInMonth = daysInMonth.filter((d) => {
    const dStr = format(d, "yyyy-MM-dd")
    return !isWeekend(d) && exceptionMap.has(dStr)
  }).length
  const activeWorkingDaysCount = totalDaysInMonth - weekendDaysCount - holidaysInMonth

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Academic Scheduling
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Mon–Fri Working Days
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            School Calendar & Term Manager
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Set the official academic school start/end dates and dismiss holidays, teacher workshops, or weather closures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="rounded-xl text-xs h-9">
            Current Month
          </Button>
        </div>
      </div>

      {/* 1. ACADEMIC YEAR START & END DATE CARD */}
      <Card className="rounded-2xl border-primary/30 bg-primary/5 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Official Academic Year Dates
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily evaluations are only required and tracked between School Start and School End.
                </CardDescription>
              </div>
            </div>

            {schoolStartDate && schoolEndDate && (
              <Badge variant="outline" className="bg-background text-foreground text-xs py-1 px-3 self-start sm:self-auto rounded-xl">
                {format(parseISO(schoolStartDate), "MMM d, yyyy")} → {format(parseISO(schoolEndDate), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="school-start-date" className="text-xs font-semibold text-foreground">
                School Starts (Opening Date)
              </Label>
              <Input
                id="school-start-date"
                type="date"
                value={schoolStartDate}
                onChange={(e) => setSchoolStartDate(e.target.value)}
                className="rounded-xl text-xs sm:text-sm bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="school-end-date" className="text-xs font-semibold text-foreground">
                School Ends (Closing Date)
              </Label>
              <Input
                id="school-end-date"
                type="date"
                value={schoolEndDate}
                onChange={(e) => setSchoolEndDate(e.target.value)}
                className="rounded-xl text-xs sm:text-sm bg-background"
              />
            </div>

            <Button
              onClick={handleSaveTermDates}
              disabled={savingTerm || !schoolStartDate || !schoolEndDate}
              className="rounded-xl h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingTerm ? (
                "Saving Dates..."
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Save Academic Dates
                </>
              )}
            </Button>
          </div>

          {termFeedback && (
            <div
              className={cn(
                "p-2.5 rounded-xl text-xs flex items-center gap-2",
                termFeedback.type === "success"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-destructive/15 text-destructive border border-destructive/30"
              )}
            >
              {termFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{termFeedback.msg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-2xl border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
            Schedule Rule
          </span>
          <p className="text-lg sm:text-xl font-bold text-foreground mt-1">Mon – Fri</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Weekends auto-dismissed</span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">
            Active School Days
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {activeWorkingDaysCount}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">In {format(currentDate, "MMMM")}</span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase block">
            Holidays Dismissed
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {holidaysInMonth}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Exceptions this month</span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
            Total Exceptions
          </span>
          <p className="text-2xl font-black text-foreground mt-0.5">{exceptions.length}</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Configured for school term</span>
        </Card>
      </div>

      {/* 3. Calendar Grid & Controls */}
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg sm:text-xl font-bold">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Click any weekday to toggle between a <strong>Working Inspection Day</strong> and a <strong>Dismissed Holiday / School Off</strong>.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 space-y-0">
          {/* Days of week header bar */}
          <div className="grid grid-cols-7 border-t border-x border-border/80 text-center text-[11px] sm:text-xs font-bold tracking-wider text-muted-foreground uppercase bg-muted/40 py-3 rounded-t-2xl">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-muted-foreground/60">Sat</div>
            <div className="text-muted-foreground/60">Sun</div>
          </div>

          {/* Real Calendar Grid with 1px border dividers */}
          <div className="grid grid-cols-7 gap-px bg-border/80 border border-border/80 rounded-b-2xl overflow-hidden shadow-xs">
            {gridDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const isCurrentMonth = isSameMonth(day, currentDate)
              const dayIsWeekend = isWeekend(day)
              const exception = exceptionMap.get(dateStr)
              const isHoliday = !dayIsWeekend && !!exception
              const dayIsToday = isToday(day)

              const isBeforeTerm = Boolean(schoolStartDate && dateStr < schoolStartDate)
              const isAfterTerm = Boolean(schoolEndDate && dateStr > schoolEndDate)
              const isOutsideTerm = isBeforeTerm || isAfterTerm

              const isDayDisabled = !isCurrentMonth || dayIsWeekend || isOutsideTerm

              return (
                <button
                  key={dateStr}
                  onClick={() => isCurrentMonth && handleDayClick(day)}
                  disabled={isDayDisabled}
                  type="button"
                  className={cn(
                    "min-h-25 sm:min-h-30 p-2 sm:p-2.5 text-left transition-all relative flex flex-col justify-between group",
                    !isCurrentMonth
                      ? "bg-muted/15 text-muted-foreground/30 cursor-default"
                      : isOutsideTerm
                      ? "bg-muted/35 text-muted-foreground/50 cursor-not-allowed"
                      : dayIsWeekend
                      ? "bg-muted/25 text-muted-foreground/60 cursor-not-allowed"
                      : isHoliday
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/15 cursor-pointer"
                      : "bg-card hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  {/* Day header row */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold tracking-tight",
                        !isCurrentMonth && "text-muted-foreground/30 font-medium",
                        dayIsToday && isCurrentMonth && "w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shadow-xs"
                      )}
                    >
                      {day.getDate()}
                    </span>

                    {/* Status badges */}
                    {isCurrentMonth && (
                      <>
                        {isOutsideTerm ? (
                          <span className="text-[9px] font-medium text-muted-foreground/50 px-1 py-0.5 rounded bg-muted/60 hidden sm:inline">
                            {isBeforeTerm ? "Pre-Term" : "Summer"}
                          </span>
                        ) : isHoliday ? (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider">
                            Off
                          </Badge>
                        ) : dayIsWeekend ? (
                          <span className="text-[9px] text-muted-foreground/50 hidden sm:inline font-medium">Off</span>
                        ) : (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
                            Work
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Event Chips inside the cell (like real Google/Apple Calendar) */}
                  <div className="mt-1.5 w-full">
                    {isCurrentMonth && isHoliday && (
                      <div className="px-2 py-1 rounded-lg bg-destructive/15 text-destructive border border-destructive/25 text-[10px] sm:text-xs font-semibold truncate leading-tight shadow-2xs">
                        🏖️ {exception?.reason}
                      </div>
                    )}
                    {isCurrentMonth && isOutsideTerm && (
                      <div className="text-[10px] text-muted-foreground/50 truncate hidden sm:block">
                        {isBeforeTerm ? "Before School Year" : "Summer Break"}
                      </div>
                    )}
                    {isCurrentMonth && !isHoliday && !dayIsWeekend && !isOutsideTerm && (
                      <div className="text-[10px] text-muted-foreground/40 hidden sm:block group-hover:text-primary transition-colors font-medium">
                        Inspection day
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-card border border-border" />
              <span>Working Day (Inspections Required)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-destructive/15 border border-destructive/40" />
              <span>Dismissed Holiday / School Closure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-muted/40 border border-dashed border-border" />
              <span>Outside Academic Term / Weekend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. List of Configured Calendar Exceptions */}
      <Card className="rounded-2xl border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <CalendarOff className="h-5 w-5 text-amber-500" /> Configured Holidays & Dismissed Days
              </CardTitle>
              <CardDescription className="text-xs">
                All customized non-working days currently active in the school database.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {exceptions.length} Total
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading calendar exceptions...</div>
          ) : exceptions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No holidays or dismissed days configured</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any weekday on the calendar above to mark it as a holiday or school closure.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {exceptions.map((item) => {
                const parsed = parseISO(item.exception_date)
                const isItemPast = parsed < new Date()

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold text-xs shrink-0">
                        {format(parsed, "MMM d")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parsed, "EEEE, MMMM d, yyyy")}{" "}
                          {isItemPast && <span className="text-muted-foreground/60">(Past)</span>}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExceptionDirect(item.exception_date)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Restore Day
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle Holiday Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedDateStr && exceptionMap.has(selectedDateStr)
                ? "Manage Dismissed Day"
                : "Dismiss School Day / Add Holiday"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDateStr && format(parseISO(selectedDateStr), "EEEE, MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedDateStr && exceptionMap.has(selectedDateStr) ? (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                <p className="font-bold">Currently Dismissed: {exceptionMap.get(selectedDateStr)?.reason}</p>
                <p className="text-muted-foreground">
                  Supervisors will not be alerted for inspections on this date.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="holiday-reason" className="text-xs font-semibold">
                  Reason for School Closure / Holiday
                </Label>
                <Input
                  id="holiday-reason"
                  placeholder="e.g. National Holiday, Teacher In-Service, Weather Day"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="rounded-xl text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  This label will appear on the calendar and informs supervisors of why the day is off.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-2 rounded-lg bg-destructive/15 text-destructive text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            {selectedDateStr && exceptionMap.has(selectedDateStr) ? (
              <Button
                variant="default"
                onClick={handleToggleException}
                disabled={isPending}
                className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending ? "Restoring..." : "✓ Restore as Working Day"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleToggleException}
                disabled={isPending}
                className="rounded-xl text-xs"
              >
                {isPending ? "Saving..." : "Mark as School Off / Holiday"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
