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
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Evaluate {classroom.name}</CardTitle>
              <CardDescription>{classroom.grade}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Checklist Items */}
            <div className="space-y-4">
              {checklistItems.map((item) => {
                const isChecked = checkedItems.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                      isChecked ? "bg-primary/5 border-primary/50" : "bg-card border-border",
                    )}
                  >
                    <Checkbox
                      id={item.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={item.id} className="text-base font-medium cursor-pointer text-foreground">
                        {item.title}
                      </Label>
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground">{item.points} pts</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Score Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Items Completed</p>
                    <p className="text-2xl font-bold text-foreground">
                      {completedCount} / {checklistItems.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-3xl font-bold text-primary">
                      {totalScore} / {maxScore}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Submitting Evaluation..." : "Submit Evaluation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
