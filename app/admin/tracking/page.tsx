import { requirePageRole } from "@/lib/auth/server"
import { AdminDashboard } from "@/components/features/admin/admin-dashboard-view"

export default async function TrackingPage() {
  await requirePageRole(["super_admin", "admin", "stats"])
  return <AdminDashboard tabParam="tracking" />
}
