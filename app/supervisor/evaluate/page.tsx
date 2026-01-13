"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClassroomSelector } from "@/components/classroom-selector"
import { EvaluationForm } from "@/components/evaluation-form"
import { EvaluationSuccess } from "@/components/evaluation-success"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClassrooms } from "@/lib/supabase-data"
import type { Classroom, User } from "@/lib/types"

type ViewState = "select" | "evaluate" | "success"

interface SupervisorEvaluateContentProps {
  currentUser: User
}

function SupervisorEvaluateContent({ currentUser }: SupervisorEvaluateContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewState, setViewState] = useState<ViewState>("select")
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await getClassrooms()
        setClassrooms(data)
      } catch (error) {
        console.error("Error fetching classrooms:", error)
      }
    }

    fetchClassrooms()
  }, [])

  useEffect(() => {
    // Check if a specific classroom is selected via URL parameter
    const classroomId = searchParams.get("classroom")
    if (classroomId && classrooms.length > 0) {
      const classroom = classrooms.find(c => c.id === classroomId)
      if (classroom) {
        setSelectedClassroom(classroom)
        setViewState("evaluate")
      }
    }
  }, [searchParams, classrooms])

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
      </main>
    </div>
  )
}

export default function SupervisorEvaluatePage() {
  return (
    <ProtectedRoute allowedRoles={["supervisor"]}>
      <SupervisorEvaluateContent />
    </ProtectedRoute>
  )
}
