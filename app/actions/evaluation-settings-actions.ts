"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"

export async function requireAdmin(): Promise<{ currentUser?: { id: string; role: string }; error?: string }> {
  const session = await getSessionFromCookies()
  if (!session) {
    return { error: "Not authenticated" }
  }

  const supabase = await createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError || !userData || !userData.is_active) {
    return { error: "Not authenticated" }
  }

  if (userData.role !== "super_admin" && userData.role !== "admin") {
    return { error: "Unauthorized: Admin access required" }
  }

  return { currentUser: { id: userData.id, role: userData.role } }
}

export async function getEvaluationsStatus(): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "evaluations_enabled")
      .maybeSingle()

    if (error) {
      console.error("[getEvaluationsStatus] Error:", error)
      return { success: false, error: error.message }
    }

    // Default to true if setting doesn't exist
    const rawValue = data?.value
    const enabled = rawValue === null || rawValue === undefined ? true : (rawValue === true || rawValue === "true")

    return { success: true, enabled }
  } catch (error: any) {
    console.error("[getEvaluationsStatus] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get evaluations status" }
  }
}

export async function setEvaluationsStatus(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  try {
    const supabase = await createAdminClient()

    const settingData = {
      key: "evaluations_enabled",
      value: enabled,
      description: "Controls whether the system is accepting new evaluations",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(settingData, { onConflict: "key" })

    if (upsertError) {
      console.error("[setEvaluationsStatus] Upsert error:", upsertError)
      return { success: false, error: upsertError.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/supervisor/evaluate")
    return { success: true }
  } catch (error: any) {
    console.error("[setEvaluationsStatus] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update evaluations status" }
  }
}
