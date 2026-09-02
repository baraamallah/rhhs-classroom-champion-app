"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"

export type AdminSettings = {
  winners_page_visible: boolean
  leaderboard_show_monthly: boolean
  calculation_mode: boolean
  winner_reveal_mode: boolean
  evaluations_enabled: boolean
  winners_display_month: { year: number; month: number } | null
  leaderboard_display_month: { year: number; month: number } | null
}

export async function getAdminSettings(): Promise<{ success: boolean; settings?: AdminSettings; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")

    if (error) {
      console.error("[getAdminSettings] Error:", error)
      return { success: false, error: error.message }
    }

    const map = new Map(data?.map(s => [s.key, s.value]) || [])

    const parseBool = (key: string, defaultVal: boolean): boolean => {
      const raw = map.get(key)
      return raw === null || raw === undefined ? defaultVal : (raw === true || raw === "true")
    }

    const settings: AdminSettings = {
      winners_page_visible: parseBool("winners_page_visible", true),
      leaderboard_show_monthly: parseBool("leaderboard_show_monthly", true),
      calculation_mode: parseBool("calculation_mode", false),
      winner_reveal_mode: parseBool("winner_reveal_mode", false),
      evaluations_enabled: parseBool("evaluations_enabled", true),
      winners_display_month: (map.get("winners_display_month") as AdminSettings["winners_display_month"]) || null,
      leaderboard_display_month: (map.get("leaderboard_display_month") as AdminSettings["leaderboard_display_month"]) || null,
    }

    return { success: true, settings }
  } catch (error: any) {
    console.error("[getAdminSettings] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to fetch admin settings" }
  }
}

// TODO: Refactor this file to avoid using cookies for static rendering or switch to dynamic rendering for /winners.
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

    revalidatePath("/", "layout")
    revalidatePath("/winners")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[setWinnersPageVisibility] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update visibility setting" }
  }
}

export async function getLeaderboardPointsSetting(): Promise<{ success: boolean; showMonthly?: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "leaderboard_show_monthly")
      .maybeSingle()

    if (error) {
      console.error("[getLeaderboardPointsSetting] Error:", error)
      return { success: false, error: error.message }
    }

    // Default to true (show points per month) if setting doesn't exist
    const rawValue = data?.value
    const showMonthly = rawValue === null || rawValue === undefined ? true : (rawValue === true || rawValue === "true")
    
    return { success: true, showMonthly }
  } catch (error: any) {
    console.error("[getLeaderboardPointsSetting] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get leaderboard setting" }
  }
}

export async function setLeaderboardPointsSetting(showMonthly: boolean): Promise<{ success: boolean; error?: string }> {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  try {
    const supabase = await createAdminClient()

    const settingData = {
      key: "leaderboard_show_monthly",
      value: showMonthly,
      description: "Controls whether the leaderboard displays monthly points (true) or total points (false)",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(settingData, { onConflict: "key" })

    if (upsertError) {
      console.error("[setLeaderboardPointsSetting] Upsert error:", upsertError)
      return { success: false, error: upsertError.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[setLeaderboardPointsSetting] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update leaderboard setting" }
  }
}

export async function getCalculationMode(): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "calculation_mode")
      .maybeSingle()

    if (error) {
      console.error("[getCalculationMode] Error:", error)
      return { success: false, error: error.message }
    }

    // Default to false if setting doesn't exist
    const rawValue = data?.value
    const enabled = rawValue === true || rawValue === "true"

    return { success: true, enabled }
  } catch (error: any) {
    console.error("[getCalculationMode] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get calculation mode setting" }
  }
}

export async function setCalculationMode(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  try {
    const supabase = await createAdminClient()

    const settingData = {
      key: "calculation_mode",
      value: enabled,
      description: "Hides the leaderboard and shows a calculation animation on the homepage",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(settingData, { onConflict: "key" })

    if (upsertError) {
      console.error("[setCalculationMode] Upsert error:", upsertError)
      return { success: false, error: upsertError.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/winners")
    return { success: true }
  } catch (error: any) {
    console.error("[setCalculationMode] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update calculation mode setting" }
  }
}

export async function getWinnerRevealMode(): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "winner_reveal_mode")
      .maybeSingle()

    if (error) {
      console.error("[getWinnerRevealMode] Error:", error)
      return { success: false, error: error.message }
    }

    // Default to false if setting doesn't exist
    const rawValue = data?.value
    const enabled = rawValue === true || rawValue === "true"

    return { success: true, enabled }
  } catch (error: any) {
    console.error("[getWinnerRevealMode] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get winner reveal mode setting" }
  }
}

export async function setWinnerRevealMode(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  try {
    const supabase = await createAdminClient()

    const settingData = {
      key: "winner_reveal_mode",
      value: enabled,
      description: "Hides the leaderboard and shows a winner reveal button on the homepage",
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(settingData, { onConflict: "key" })

    if (upsertError) {
      console.error("[setWinnerRevealMode] Upsert error:", upsertError)
      return { success: false, error: upsertError.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/winners")
    return { success: true }
  } catch (error: any) {
    console.error("[setWinnerRevealMode] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update winner reveal mode setting" }
  }
}

export interface MonthSetting {
  year: number
  month: number
}

export async function getDefaultMonthSettings(): Promise<{
  success: boolean;
  winnersMonth?: MonthSetting | null;
  leaderboardMonth?: MonthSetting | null;
  error?: string
}> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["winners_display_month", "leaderboard_display_month"])

    if (error) {
      console.error("[getDefaultMonthSettings] Error:", error)
      return { success: false, error: error.message }
    }

    const winnersMonth = data?.find(s => s.key === "winners_display_month")?.value as MonthSetting | null
    const leaderboardMonth = data?.find(s => s.key === "leaderboard_display_month")?.value as MonthSetting | null

    return {
      success: true,
      winnersMonth: winnersMonth || null,
      leaderboardMonth: leaderboardMonth || null
    }
  } catch (error: any) {
    console.error("[getDefaultMonthSettings] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get default month settings" }
  }
}

export async function setDefaultMonthSetting(
  key: "winners_display_month" | "leaderboard_display_month",
  setting: MonthSetting | null
): Promise<{ success: boolean; error?: string }> {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  try {
    const supabase = await createAdminClient()

    if (setting === null) {
      // Deleting the setting key restores the system to the default (Current Month)
      const { error: deleteError } = await supabase
        .from("system_settings")
        .delete()
        .eq("key", key)

      if (deleteError) {
        console.error("[setDefaultMonthSetting] Delete error:", deleteError)
        return { success: false, error: deleteError.message }
      }
    } else {
      const settingData = {
        key,
        value: setting,
        description: key === "winners_display_month"
          ? "Sets a specific month to display on the winners page (null for current)"
          : "Sets a specific month to display on the leaderboard when in monthly mode (null for current)",
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase
        .from("system_settings")
        .upsert(settingData, { onConflict: "key" })

      if (upsertError) {
        console.error("[setDefaultMonthSetting] Upsert error:", upsertError)
        return { success: false, error: upsertError.message }
      }
    }

    revalidatePath("/")
    revalidatePath("/winners")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[setDefaultMonthSetting] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to update default month setting" }
  }
}
