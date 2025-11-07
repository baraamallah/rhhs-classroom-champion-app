"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon } from "@/components/icons"

interface EvaluationSuccessProps {
  onNewEvaluation: () => void
}

export function EvaluationSuccess({ onNewEvaluation }: EvaluationSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircleIcon className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Evaluation Submitted!</CardTitle>
          <CardDescription>Your evaluation has been recorded successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Thank you for helping make our school greener. The classroom's score has been updated on the leaderboard.
          </p>
          <Button onClick={onNewEvaluation} className="w-full" size="lg">
            Evaluate Another Classroom
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
