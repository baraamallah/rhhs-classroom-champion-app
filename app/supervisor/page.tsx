"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SupervisorEvaluationsHistory } from "@/components/features/evaluations/supervisor-evaluations-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getClassroomsBySupervisor, getEvaluationsBySupervisor } from "@/lib/supabase-data"
import {
  ClipboardCheck,
  Building2,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
} from "lucide-react"
import type { User, Classroom, Evaluation } from "@/lib/types"

interface SupervisorDashboardContentProps {
  currentUser?: User
}

function SupervisorDashboardContent({ currentUser }: SupervisorDashboardContentProps) {
  const router = useRouter()
  const [assignedClassrooms, setAssignedClassrooms] = useState<Classroom[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    async function loadData() {
      setLoading(true)
      try {
        const [rooms, evals] = await Promise.all([
          getClassroomsBySupervisor(currentUser!.id),
          getEvaluationsBySupervisor(currentUser!.id),
        ])
        setAssignedClassrooms(rooms || [])
        setEvaluations(evals || [])
      } catch (err) {
        console.error("Error loading supervisor portal data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser])

  if (!currentUser) return null

  // Calculate current month statistics
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const thisMonthEvaluations = evaluations.filter((e) => {
    const d = new Date(e.evaluation_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // Set of classroom IDs evaluated this month
  const evaluatedRoomIdsThisMonth = new Set(thisMonthEvaluations.map((e) => e.classroom_id))

  // Assigned classrooms pending this month
  const pendingClassrooms = assignedClassrooms.filter((c) => !evaluatedRoomIdsThisMonth.has(c.id))
  const completedCount = assignedClassrooms.length - pendingClassrooms.length
  const completionPercentage =
    assignedClassrooms.length > 0 ? Math.round((completedCount / assignedClassrooms.length) * 100) : 100

  // Assigned divisions list
  const assignedDivisions = Array.from(
    new Set(assignedClassrooms.map((c) => c.division).filter(Boolean))
  ) as string[]

  const handleStartEvaluation = (classroomId?: string) => {
    if (classroomId) {
      router.push(`/supervisor/evaluate?classroom=${classroomId}`)
    } else {
      router.push("/supervisor/evaluate")
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 flex flex-col">
      <DashboardHeader user={currentUser} />

      <main id="main-content" className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl flex-1 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                Supervisor Portal
              </Badge>
              {assignedDivisions.map((div) => (
                <Badge key={div} variant="secondary" className="text-xs">
                  {div}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Hello, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track your assigned classrooms and submit monthly eco-inspections.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => handleStartEvaluation()}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md h-11"
          >
            <ClipboardCheck className="mr-2 h-5 w-5" /> Start Inspection
          </Button>
        </div>

        {/* Division KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl border-border bg-card/70 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Assigned Rooms
            </span>
            <p className="text-2xl font-black text-foreground mt-0.5">{assignedClassrooms.length}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">In your division(s)</span>
          </Card>

          <Card className="p-4 rounded-2xl border-border bg-card/70 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">
              Completed
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedCount}
            </p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Evaluated this month</span>
          </Card>

          <Card className="p-4 rounded-2xl border-border bg-card/70 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase block">
              Pending
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {pendingClassrooms.length}
            </p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Awaiting evaluation</span>
          </Card>

          <Card className="p-4 rounded-2xl border-border bg-card/70 shadow-xs">
            <span className="text-[11px] font-semibold text-primary uppercase block">Monthly Pace</span>
            <p className="text-2xl font-black text-primary mt-0.5">{completionPercentage}%</p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Pending Inspections Action Queue (Mobile Touch-Friendly) */}
        {pendingClassrooms.length > 0 && (
          <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-amber-500" /> Pending Inspections This Month
                </CardTitle>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                  {pendingClassrooms.length} Remaining
                </Badge>
              </div>
              <CardDescription className="text-xs">
                These assigned rooms haven&apos;t been evaluated yet for this month&apos;s competition cycle.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {pendingClassrooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3 hover:border-primary/40 transition-all shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Grade {room.grade} &bull; {room.division || "Standard"}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleStartEvaluation(room.id)}
                      className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                    >
                      Evaluate <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evaluation History Component */}
        <SupervisorEvaluationsHistory
          supervisorId={currentUser.id}
          onEvaluateClassroom={(classroom) => handleStartEvaluation(classroom.id)}
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
