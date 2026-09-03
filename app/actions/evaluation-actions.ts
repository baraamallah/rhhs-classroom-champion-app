"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"

/**
 * Server Action for supervisors to securely submit an evaluation.
 * Uses service role on the server, bypassing client-side anon RLS restrictions (fixes 401).
 */
export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItemIds: string[],
  totalScore: number,
  maxScore: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return { success: false, error: "Not authenticated. Please log in again." }
    }

    // Check if evaluations are open
    const statusResult = await getEvaluationsStatus()
    const enabled = statusResult.success ? statusResult.enabled !== false : true

    if (!enabled) {
      return { success: false, error: "System is closed and not accepting evaluations anymore." }
    }

    if (!classroomId) {
      return { success: false, error: "Classroom ID is required." }
    }

    const itemsMap = checkedItemIds.reduce((acc, id) => {
      acc[id] = true
      return acc
    }, {} as Record<string, boolean>)

    const supabase = await createAdminClient()

    // Determine actual supervisor ID (from parameter or current session)
    const effectiveSupervisorId = supervisorId || session.userId

    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        classroom_id: classroomId,
        supervisor_id: effectiveSupervisorId,
        items: itemsMap,
        total_score: totalScore,
        max_score: maxScore,
        evaluation_date: new Date().toISOString().split("T")[0],
      })
      .select("id")
      .single()

    if (error) {
      console.error("[Server Action] Error submitting evaluation:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths so leaderboards, history, and tracking reflect the submission immediately
    revalidatePath("/", "layout")
    revalidatePath("/admin")
    revalidatePath("/admin/tracking")
    revalidatePath("/supervisor")
    revalidatePath("/supervisor/evaluate")
    revalidatePath("/winners")

    return { success: true }
  } catch (error: any) {
    console.error("[Server Action] Exception submitting evaluation:", error)
    return { success: false, error: error.message || "Failed to submit evaluation" }
  }
}
