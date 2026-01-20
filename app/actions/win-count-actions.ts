"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function getClassroomWinCounts(): Promise<{ success: boolean; data?: Record<string, number>; error?: string }> {
  try {
    // Use admin client for public access (bypasses RLS)
    const supabase = await createAdminClient()
    
    // Get all monthly winners
    const { data: winners, error } = await supabase
      .from("monthly_winners")
      .select("classroom_id")

    if (error) {
      console.error("[getClassroomWinCounts] Error:", error)
      return { success: false, error: error.message }
    }

    // Count wins per classroom
    const winCounts: Record<string, number> = {}
    if (winners) {
      winners.forEach((winner: any) => {
        const classroomId = winner.classroom_id
        winCounts[classroomId] = (winCounts[classroomId] || 0) + 1
      })
    }

    return { success: true, data: winCounts }
  } catch (error: any) {
    console.error("[getClassroomWinCounts] Unexpected error:", error)
    return { success: false, error: error.message || "Failed to get win counts" }
  }
}
