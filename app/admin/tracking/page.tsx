"use client"

import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SubmissionTracking } from "@/components/features/evaluations/submission-tracking"
import { AdminDashboard } from "@/components/features/admin/admin-dashboard-view"
import type { User } from "@/lib/types"

interface TrackingDashboardContentProps {
  currentUser?: User
}

function TrackingDashboardContent({ currentUser }: TrackingDashboardContentProps) {
  if (!currentUser) {
    return null
  }

  // Stats role sees focused single-page view
  if (currentUser.role === "stats") {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={currentUser} />

        <main className="container mx-auto px-4 py-8">
          <SubmissionTracking currentUser={currentUser} />
        </main>
      </div>
    )
  }

  // Admin & Super Admin see full admin shell with tracking tab
  return <AdminDashboard tabParam="tracking" />
}

export default function TrackingPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "stats"]}>
      <TrackingDashboardContent />
    </ProtectedRoute>
  )
}
