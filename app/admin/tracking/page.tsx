"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardHeader } from "@/components/dashboard-header"
import { SubmissionTracking } from "@/components/submission-tracking"
import type { User } from "@/lib/types"

interface TrackingDashboardContentProps {
  currentUser?: User
}

function TrackingDashboardContent({ currentUser }: TrackingDashboardContentProps) {
  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-8">
        <SubmissionTracking currentUser={currentUser} />
      </main>
    </div>
  )
}

export default function TrackingPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "stats"]}>
      <TrackingDashboardContent />
    </ProtectedRoute>
  )
}
