"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"
import { archiveCompletedMonths } from "@/lib/monthly-archive"

export async function checkAndAutoArchive() {
  try {
    const session = await getSessionFromCookies()
    if (!session) return { success: false, archived: false, reason: "not_authenticated" }
    const supabase = await createAdminClient()
    const { data: user, error } = await supabase.from("users")
      .select("is_active, role").eq("id", session.userId).single()
    if (error || !user?.is_active || !["admin", "super_admin", "supervisor"].includes(user.role)) {
      return { success: false, archived: false, reason: "not_authorized" }
    }
    const result = await archiveCompletedMonths(supabase)
    if (result.archived) {
      revalidateTag("leaderboard", { expire: 0 })
      revalidatePath("/", "layout")
    }
    return result
  } catch (error) {
    console.error("[autoArchive] Monthly archive failed:", error)
    return { success: false, archived: false, reason: "archive_failed" }
  }
}
