import { redirect } from "next/navigation"
import { requirePageRole } from "@/lib/auth/server"

export default async function AdminPage() {
  const user = await requirePageRole(["admin", "super_admin", "stats"])
  redirect(user.role === "stats" ? "/admin/tracking" : "/admin/classrooms")
}
