"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getChecklistItems, submitEvaluation } from "@/lib/supabase-data"
import { m } from "framer-motion"
import { CheckCircleIcon, XCircleIcon } from "@/components/common/icons"
import { cn } from "@/lib/utils"
import type { Classroom, ChecklistItem, User } from "@/lib/types"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

interface EvaluationFormProps {
  classroom: Classroom
  user: User
  onComplete: () => void
  onCancel: () => void
}

export function EvaluationForm({ classroom, user, onComplete, onCancel }: EvaluationFormProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchChecklist = async () => {
      try {
        const items = await getChecklistItems()
        if (!cancelled) setChecklistItems(items)
      } catch (error) {
        console.error("Error fetching checklist items:", error)
        if (!cancelled) setError("Failed to load checklist. Please try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchChecklist()
    return () => { cancelled = true }
  }, [])

  const handleCheckChange = (itemId: string, checked: boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const totalScore = calculateTotalScore()
      const maxScore = checklistItems.reduce((sum, item) => sum + item.points, 0)

      const result = await submitEvaluation(classroom.id, user.id, checkedItems, totalScore, maxScore)

      if (result.success) {
        onComplete()
      } else {
        setError(result.error || "Failed to submit evaluation. Please try again.")
      }
    } catch (error) {
      console.error("[Evaluations] Error submitting evaluation:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading checklist...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={onCancel}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalScore = calculateTotalScore()
  const maxScore = checklistItems.reduce((sum, item) => sum + item.points, 0)
  const completedCount = checkedItems.length

  return (
    <LazyMotionProvider>
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        <Card className="shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl mb-1">Evaluate {classroom.name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Grade {classroom.grade}</CardDescription>
              </div>
              <Button variant="ghost" onClick={onCancel} className="shrink-0 text-sm sm:text-base">
                ✕ Cancel
              </Button>
            </div>
            {/* Progress Indicator */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  {completedCount} of {checklistItems.length} items completed
                </span>
                <span className="font-semibold text-primary">
                  Score: {totalScore} / {maxScore}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <m.div
                  className="h-full w-full origin-left bg-linear-to-r from-primary to-green-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: checklistItems.length ? completedCount / checklistItems.length : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Checklist Items */}
              <div className="space-y-4">
                {checklistItems.map((item, index) => {
                  const isChecked = checkedItems.includes(item.id)
                  return (
                    <m.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-[background-color,border-color,box-shadow] duration-200",
                        isChecked
                          ? "bg-primary/10 border-primary/50 shadow-sm"
                          : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="mt-1">
                        <Checkbox
                          id={item.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={item.id}
                          className="text-sm sm:text-base font-medium cursor-pointer text-foreground block leading-tight"
                        >
                          {item.title}
                        </Label>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <m.div
                            initial={false}
                            animate={{ scale: isChecked ? 1 : 0.8, opacity: isChecked ? 1 : 0.5 }}
                          >
                            {isChecked ? (
                              <CheckCircleIcon className="h-5 w-5 text-primary" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-muted-foreground/50" />
                            )}
                          </m.div>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            isChecked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.points} pts
                        </span>
                      </div>
                    </m.div>
                  )
                })}
              </div>

              {/* Score Summary */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-linear-to-br from-primary/10 to-green-500/10 border-primary/20">
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-foreground">Total Score</p>
                        <p className="text-xs text-muted-foreground">All checklist items</p>
                      </div>
                      <m.div
                        className="text-right"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <p className="text-3xl sm:text-4xl font-bold text-primary">
                          {totalScore} <span className="text-lg sm:text-xl text-muted-foreground">/ {maxScore}</span>
                        </p>
                      </m.div>
                    </div>
                  </CardContent>
                </Card>
              </m.div>

              {/* Submit Button */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 sm:h-auto text-base sm:text-lg font-semibold shadow-lg transition-shadow hover:shadow-xl"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "✓ Submit Evaluation"}
                </Button>
              </m.div>
            </form>
          </CardContent>
        </Card>
      </div>
    </LazyMotionProvider>
  )
}
