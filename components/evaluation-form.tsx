"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Classroom, ChecklistItem, User } from "@/lib/types"
import { getChecklistItems, submitEvaluation } from "@/lib/supabase-data"
import { CheckCircleIcon, XCircleIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface EvaluationFormProps {
  classroom: Classroom
  user: User
  onComplete: () => void
  onCancel: () => void
}

export function EvaluationForm({ classroom, user, onComplete, onCancel }: EvaluationFormProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await getChecklistItems()

        // Filter items:
        // 1. If no supervisors are assigned, it's global (visible to all)
        // 2. If supervisors are assigned, only they can see it
        const filteredItems = items.filter((item) => {
          const assignments = item.assigned_supervisors || []
          if (assignments.length === 0) return true
          return assignments.some((s) => s.id === user.id)
        })

        if (filteredItems.length === 0) {
          setError("No checklist items found for your account. Please contact an administrator.")
        }
        setChecklistItems(filteredItems)
      } catch (error) {
        console.error("[v0] Error fetching checklist items:", error)
        setError("Failed to load checklist items. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [user.id])

  const handleCheckChange = (itemId: string, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, itemId] : prev.filter((id) => id !== itemId)))
  }

  const calculateTotalScore = () => {
    return checklistItems.reduce((total, item) => {
      return total + (checkedItems.includes(item.id) ? item.points : 0)
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
      console.error("[v0] Error submitting evaluation:", error)
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
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      <Card className="shadow-lg">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl mb-1">Evaluate {classroom.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Grade {classroom.grade}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onCancel} className="flex-shrink-0 text-sm sm:text-base">
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
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
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
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200",
                      isChecked
                        ? "bg-primary/10 border-primary/50 shadow-sm"
                        : "bg-card border-border hover:bg-muted/50",
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
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          initial={false}
                          animate={{ scale: isChecked ? 1 : 0.8, opacity: isChecked ? 1 : 0.5 }}
                        >
                          {isChecked ? (
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </motion.div>
                      </div>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        isChecked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {item.points} pts
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Score Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-green-500/10 border-primary/20">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-foreground">Total Score</p>
                      <p className="text-xs text-muted-foreground">All checklist items</p>
                    </div>
                    <motion.div 
                      className="text-right"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <p className="text-3xl sm:text-4xl font-bold text-primary">
                        {totalScore} <span className="text-lg sm:text-xl text-muted-foreground">/ {maxScore}</span>
                      </p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-12 sm:h-auto text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block mr-2"
                    >
                      ⏳
                    </motion.span>
                    Submitting...
                  </>
                ) : (
                  <>
                    ✓ Submit Evaluation
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </div >
  )
}
