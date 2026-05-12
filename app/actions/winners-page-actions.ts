"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"
// import { getSessionFromCookies } from "@/lib/auth/session"
// TODO: Refactor this file to avoid using cookies for static rendering or switch to dynamic rendering for /winners.
async function requireAdmin(): Promise<{ currentUser?: { id: string; role: string }; error?: string }> {
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

export async function getWinnersPageVisibility(): Promise<{ success: boolean; visible?: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "winners_page_visible")
      .maybeSingle()

    if (error) {
      console.error("[getWinnersPageVisibility] Error:", error)
      return { success: false, error: error.message }
    }

    // Default to visible if setting doesn't exist
    // Handle cases where value might be a string "true"/"false" from database
    const rawValue = data?.value
    const visible = rawValue === null || rawValue === undefined ? true : (rawValue === true || rawValue === "true")
    
    console.log(`[getWinnersPageVisibility] Returning visible: ${visible} (raw: ${rawValue})`)
    return { success: true, visible }
  } catch (error: any) {
    console.error("[getWinnersPageVisibility] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get visibility setting" }
  }
}

export async function setWinnersPageVisibility(visible: boolean): Promise<{ success: boolean; error?: string }> {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  try {
    const supabase = await createAdminClient()

    const settingData = {
      key: "winners_page_visible",
      value: visible,
      description: "Controls visibility of the animated winners/leaderboard page",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(settingData, { onConflict: "key" })

    if (upsertError) {
      console.error("[setWinnersPageVisibility] Upsert error:", upsertError)
      return { success: false, error: upsertError.message }
    }

    console.log(`[setWinnersPageVisibility] Setting winners_page_visible to: ${visible}`)
    revalidatePath("/", "layout")
    revalidatePath("/winners")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[setWinnersPageVisibility] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update visibility setting" }
  }
}
