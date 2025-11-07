"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardHeader } from "@/components/dashboard-header"
import { SupervisorEvaluationsHistory } from "@/components/supervisor-evaluations-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

interface SupervisorDashboardContentProps {
  currentUser: User
}

function SupervisorDashboardContent({ currentUser }: SupervisorDashboardContentProps) {
  const router = useRouter()

  const handleNewEvaluation = () => {
    router.push("/supervisor/evaluate")
  }

  const handleEvaluateClassroom = (classroom: any) => {
    router.push(`/supervisor/evaluate?classroom=${classroom.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Supervisor Dashboard</h2>
          <p className="text-muted-foreground">Evaluate classrooms and track eco-friendly practices</p>
        </div>

        {/* New Evaluation Button */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Start New Evaluation</CardTitle>
              <CardDescription>Evaluate a classroom's eco-friendly practices</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleNewEvaluation} size="lg" className="w-full sm:w-auto">
                Evaluate New Classroom
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Evaluation History */}
        <SupervisorEvaluationsHistory 
          supervisorId={currentUser.id} 
          onEvaluateClassroom={handleEvaluateClassroom}
        />
      </main>
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
