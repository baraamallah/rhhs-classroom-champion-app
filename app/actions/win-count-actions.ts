"use server"

import { readClassroomWinCounts } from "@/lib/classroom-win-counts"
import { createAdminClient } from "@/lib/supabase/server"

export async function getClassroomWinCounts(): Promise<{ success: boolean; data?: Record<string, number>; error?: string }> {
  try {
    // Use admin client for public access (bypasses RLS)
    const supabase = await createAdminClient()
    
    const winCounts = await readClassroomWinCounts(supabase)

    return { success: true, data: winCounts }
  } catch (error: any) {
    console.error("[getClassroomWinCounts] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get win counts" }
  }
}
