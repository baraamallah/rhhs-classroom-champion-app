"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ClassroomSelector } from "@/components/features/evaluations/classroom-selector"
import { EvaluationForm } from "@/components/features/evaluations/evaluation-form"
import { EvaluationSuccess } from "@/components/features/evaluations/evaluation-success"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClassrooms } from "@/lib/supabase-data"
import type { Classroom, User } from "@/lib/types"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"
import { AlertCircle } from "lucide-react"

type ViewState = "select" | "evaluate" | "success" | "closed"

interface SupervisorEvaluateContentProps {
  currentUser?: User
}

function SupervisorEvaluateContent({ currentUser }: SupervisorEvaluateContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewState, setViewState] = useState<ViewState>("select")
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatusAndFetchClassrooms = async () => {
      try {
        const statusResult = await getEvaluationsStatus()
        if (statusResult.success && statusResult.enabled === false) {
          setViewState("closed")
          setLoading(false)
          return
        }

        const data = await getClassrooms()
        setClassrooms(data)
      } catch (error) {
        console.error("Error fetching classrooms:", error)
      } finally {
        setLoading(false)
      }
    }

    checkStatusAndFetchClassrooms()
  }, [])

  useEffect(() => {
    // Check if a specific classroom is selected via URL parameter
    if (viewState === "closed") return

    const classroomId = searchParams.get("classroom")
    if (classroomId && classrooms.length > 0) {
      const classroom = classrooms.find(c => c.id === classroomId)
      if (classroom) {
        setSelectedClassroom(classroom)
        setViewState("evaluate")
      }
    }
  }, [searchParams, classrooms, viewState])

  const handleClassroomSelect = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setViewState("evaluate")
  }

  const handleEvaluationComplete = () => {
    setViewState("success")
  }

  const handleNewEvaluation = () => {
    setSelectedClassroom(null)
    setViewState("select")
  }

  const handleCancel = () => {
    router.push("/supervisor")
  }

  const handleBackToDashboard = () => {
    router.push("/supervisor")
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={handleBackToDashboard}
              className="text-sm sm:text-base h-9 sm:h-auto"
            >
              ← Back
            </Button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Classroom Evaluation</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Evaluate classroom eco-friendly practices</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {viewState === "closed" && (
              <Card className="border-destructive/50 bg-destructive/5">
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
                  <Button onClick={handleBackToDashboard} className="mt-6">
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {viewState === "select" && (
              <Card>
                <CardHeader>
                  <CardTitle>Select a Classroom to Evaluate</CardTitle>
                  <CardDescription>Choose the classroom you want to evaluate today</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClassroomSelector onSelect={handleClassroomSelect} />
                </CardContent>
              </Card>
            )}

            {viewState === "evaluate" && selectedClassroom && (
              <Card>
                <CardHeader>
                  <CardTitle>Evaluating Classroom</CardTitle>
                  <CardDescription>{selectedClassroom.name} - Grade {selectedClassroom.grade}</CardDescription>
                </CardHeader>
                <CardContent>
                  <EvaluationForm
                    classroom={selectedClassroom}
                    user={currentUser}
                    onComplete={handleEvaluationComplete}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {viewState === "success" && (
              <Card>
                <CardContent className="py-8">
                  <EvaluationSuccess onNewEvaluation={handleNewEvaluation} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
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
