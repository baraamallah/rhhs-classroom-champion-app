import { redirect } from "next/navigation"
import { requirePageRole } from "@/lib/auth/server"
import { AdminDashboard } from "@/components/features/admin/admin-dashboard-view"
import { STATS_ALLOWED_TAB_IDS } from "@/lib/admin-navigation"

export default async function AdminTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const [user, { tab }] = await Promise.all([requirePageRole(["admin", "super_admin", "stats"]), params])
  if (user.role === "stats" && !STATS_ALLOWED_TAB_IDS.includes(tab)) redirect("/admin/tracking")
  return <AdminDashboard tabParam={tab} />
}
