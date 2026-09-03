"use client"

import { ProtectedRoute } from "@/components/providers/protected-route"
import { AdminDashboard } from "@/components/features/admin/admin-dashboard-view"

export default function TrackingPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "stats"]}>
      <AdminDashboard tabParam="tracking" />
    </ProtectedRoute>
  )
}
