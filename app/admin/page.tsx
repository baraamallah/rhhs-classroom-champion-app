"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { AdminDashboard } from "@/components/features/admin/admin-dashboard-view"
import type { User } from "@/lib/types"

interface AdminIndexContentProps {
  currentUser?: User
}

function AdminIndexContent({ currentUser }: AdminIndexContentProps) {
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === "stats") {
      router.replace("/admin/tracking")
    } else {
      window.history.replaceState(null, "", "/admin/classrooms")
    }
  }, [currentUser, router])

  return <AdminDashboard tabParam="classrooms" />
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "stats"]}>
      <AdminIndexContent />
    </ProtectedRoute>
  )
}
