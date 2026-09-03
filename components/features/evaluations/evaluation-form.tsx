"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getChecklistItems } from "@/lib/supabase-data"
import {
  submitEvaluation,
  checkClassroomDateEvaluation,
  type ExistingEvaluationInfo,
} from "@/app/actions/evaluation-actions"
import { m, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Calendar,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Check,
  X,
  Clock,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Classroom, ChecklistItem, User } from "@/lib/types"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { format, parseISO, isToday, isWeekend } from "date-fns"

interface EvaluationFormProps {
  classroom: Classroom
  user: User
  onComplete: () => void
  onCancel: () => void
  initialDate?: string
}

export function EvaluationForm({
  classroom,
  user,
  onComplete,
  onCancel,
  initialDate,
}: EvaluationFormProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const [targetDate, setTargetDate] = useState<string>(initialDate || todayStr)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checkedItems, setCheckedItems] = useState<string[]>([])

  // Loading & submission state
  const [loading, setLoading] = useState(true)
  const [checkingLock, setCheckingLock] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [existingEval, setExistingEval] = useState<ExistingEvaluationInfo | null>(null)
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [holidayReason, setHolidayReason] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch checklist items
  useEffect(() => {
    let cancelled = false
    const fetchChecklist = async () => {
      try {
        const items = await getChecklistItems()
        if (!cancelled) setChecklistItems(items)
      } catch (err) {
        console.error("Error fetching checklist items:", err)
        if (!cancelled) setError("Failed to load checklist. Please try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchChecklist()
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Check if classroom is locked for targetDate
  useEffect(() => {
    let cancelled = false
    const verifyDailyLock = async () => {
      setCheckingLock(true)
      setError(null)
      try {
        const result = await checkClassroomDateEvaluation(classroom.id, targetDate)
        if (!cancelled) {
          setIsWorkingDay(result.isWorkingDay)
          setHolidayReason(result.holidayReason)
          if (result.isEvaluated && result.evaluation) {
            setIsLocked(true)
            setExistingEval(result.evaluation)
            // Pre-populate checked items from existing evaluation for review
            const existingChecked = Object.keys(result.evaluation.items).filter(
              (k) => result.evaluation?.items[k]
            )
            setCheckedItems(existingChecked)
          } else {
            setIsLocked(false)
            setExistingEval(null)
            setCheckedItems([])
          }
        }
      } catch (err) {
        console.error("Error verifying daily lock:", err)
      } finally {
        if (!cancelled) setCheckingLock(false)
      }
    }

    void verifyDailyLock()
    return () => {
      cancelled = true
    }
  }, [classroom.id, targetDate])

  const handleCheckChange = (itemId: string, checked: boolean) => {
    if (isLocked) return // Read-only if locked
    if (checked) {
      setCheckedItems((prev) => [...prev, itemId])
    } else {
      setCheckedItems((prev) => prev.filter((id) => id !== itemId))
    }
  }

  const calculateTotalScore = () => {
    return checkedItems.reduce((total, itemId) => {
      const item = checklistItems.find((i) => i.id === itemId)
      return total + (item ? item.points : 0)
    }, 0)
  }

  const maxScore = checklistItems.reduce((sum, item) => sum + item.points, 0)
  const totalScore = calculateTotalScore()
  const completedCount = checkedItems.length
  const progressPercent = checklistItems.length > 0 ? (completedCount / checklistItems.length) * 100 : 0

  const parsedTargetDate = parseISO(targetDate)
  const isDateToday = isToday(parsedTargetDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await submitEvaluation(
        classroom.id,
        user.id,
        checkedItems,
        totalScore,
        maxScore,
        targetDate
      )

      if (result.success) {
        onComplete()
      } else {
        setError(result.error || "Failed to submit evaluation. Please try again.")
      }
    } catch (err: any) {
      console.error("[Evaluations] Error submitting evaluation:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || checkingLock) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3 animate-pulse">
          <Clock className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-foreground">Loading inspection checklist...</p>
        <p className="text-xs text-muted-foreground mt-1">Verifying daily submission status</p>
      </div>
    )
  }

  return (
    <LazyMotionProvider>
      <div className="max-w-3xl mx-auto pb-24 sm:pb-8">
        {/* Navigation & Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground -ml-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Selector
          </Button>

          {/* Date Indicator Badge */}
          <div className="flex items-center gap-1.5">
            {isDateToday ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1 rounded-lg">
                <Sparkles className="h-3 w-3 mr-1" /> Today&apos;s Inspection
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs px-2.5 py-1 rounded-lg">
                <Calendar className="h-3 w-3 mr-1" /> Backfilling: {format(parsedTargetDate, "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </div>

        {/* Classroom Info Card */}
        <Card className="mb-4 rounded-2xl border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 bg-muted/20">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{classroom.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  Grade {classroom.grade}
                </Badge>
                {classroom.division && (
                  <Badge variant="outline" className="text-xs">
                    {classroom.division}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Inspection Date:{" "}
                <span className="font-semibold text-foreground">
                  {format(parsedTargetDate, "EEEE, MMMM d, yyyy")}
                </span>
              </p>
            </div>

            {/* Score Pill in Header */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-primary">
                  {totalScore} <span className="text-xs sm:text-sm font-semibold text-muted-foreground">/ {maxScore} pts</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {completedCount} of {checklistItems.length} passed
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted h-1.5 overflow-hidden">
            <m.div
              className="h-full bg-linear-to-r from-primary to-emerald-500 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: checklistItems.length ? completedCount / checklistItems.length : 0 }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </Card>

        {/* Locked State Alert (Day Locked) */}
        {isLocked && existingEval && (
          <Card className="mb-4 rounded-2xl border-amber-500/40 bg-amber-500/10 shadow-xs overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                    Classroom Already Evaluated & Locked for This Date
                  </h3>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px]">
                    Locked
                  </Badge>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  An inspection of <strong>{existingEval.total_score} / {existingEval.max_score} points</strong> was recorded for this classroom on{" "}
                  <strong>{format(parsedTargetDate, "MMMM d, yyyy")}</strong>
                  {existingEval.supervisor?.name ? ` by ${existingEval.supervisor.name}` : ""}.
                  Daily evaluations are locked once submitted.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl text-xs h-8 bg-background/80"
                  >
                    Inspect Another Room
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Holiday / Weekend Warning */}
        {!isWorkingDay && (
          <Card className="mb-4 rounded-2xl border-destructive/40 bg-destructive/10 shadow-xs overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-destructive">
                  Non-Working Calendar Day
                </h3>
                <p className="text-xs text-destructive/80 mt-1">
                  {holidayReason
                    ? `This date is marked as a dismissed school closure (${holidayReason}). Daily evaluations cannot be submitted.`
                    : "This date is a weekend (Saturday/Sunday). Daily evaluations are only conducted on Mon–Fri working days."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="rounded-xl text-xs h-8 mt-3 bg-background/80"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Checklist Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2.5">
            {checklistItems.map((item, index) => {
              const isChecked = checkedItems.includes(item.id)

              return (
                <div
                  key={item.id}
                  onClick={() => !isLocked && isWorkingDay && handleCheckChange(item.id, !isChecked)}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3.5 select-none",
                    isLocked || !isWorkingDay ? "opacity-75 cursor-default" : "cursor-pointer active:scale-[0.99]",
                    isChecked
                      ? "bg-primary/10 border-primary/50 shadow-2xs dark:bg-primary/15"
                      : "bg-card border-border/80 hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  {/* Big Touch Checkbox */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isChecked
                          ? "bg-primary border-primary text-primary-foreground shadow-xs"
                          : "border-muted-foreground/40 bg-background"
                      )}
                    >
                      {isChecked && <Check className="h-4 w-4 stroke-3" />}
                    </div>
                  </div>

                  {/* Item Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-foreground leading-snug">
                        {item.title}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Points Badge */}
                  <div className="shrink-0 flex items-center self-center">
                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-xl transition-all",
                        isChecked
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/80 text-muted-foreground"
                      )}
                    >
                      +{item.points} pts
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Submit Button (Hidden on small screens, shown above md) */}
          {!isLocked && isWorkingDay && (
            <div className="hidden sm:block pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full h-12 rounded-2xl font-bold text-base shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? (
                  <>Submitting Inspection...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Daily Inspection ({totalScore} / {maxScore} pts)
                  </>
                )}
              </Button>
            </div>
          )}
        </form>

        {/* Mobile Sticky Bottom Floating Action Bar */}
        {!isLocked && isWorkingDay && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl z-40">
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-black text-primary leading-tight">
                  {totalScore} <span className="text-xs text-muted-foreground">/ {maxScore}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {completedCount}/{checklistItems.length} passed
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-11 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                {submitting ? "Submitting..." : `Submit (${totalScore} pts)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </LazyMotionProvider>
  )
}
