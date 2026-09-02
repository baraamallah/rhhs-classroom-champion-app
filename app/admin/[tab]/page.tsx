"use client"

import { use } from "react"
import { AdminDashboard } from "@/components/features/admin/admin-dashboard-view"

interface AdminTabPageProps {
  params: Promise<{ tab: string }>
}

export default function AdminTabPage({ params }: AdminTabPageProps) {
  const resolvedParams = use(params)
  return <AdminDashboard tabParam={resolvedParams.tab} />
}
