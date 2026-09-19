"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"

/**
 * Checks if we're in a new month and automatically archives evaluations if needed.
 * This runs on every page load to ensure timely archiving without manual intervention.
 */
export async function checkAndAutoArchive() {
  try {
    const session = await getSessionFromCookies()
    if (!session) return { success: false, archived: false, reason: "not_authenticated" }

    const supabase = await createAdminClient()
    
    // Get current date
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // Check if there are any evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from("evaluations")
      .select("id, evaluation_date")
      .limit(1)

    if (evalError) {
      console.error("[autoArchive] Error checking evaluations:", evalError)
      return { success: false, archived: false }
    }

    // If no evaluations, nothing to archive
    if (!evaluations || evaluations.length === 0) {
      return { success: true, archived: false, reason: "no_evaluations" }
    }

    // Get the most recent evaluation date
    const { data: recentEval } = await supabase
      .from("evaluations")
      .select("evaluation_date")
      .order("evaluation_date", { ascending: false })
      .limit(1)
      .single()

    if (!recentEval) {
      return { success: true, archived: false, reason: "no_evaluations" }
    }

    const latestEvalDate = new Date(recentEval.evaluation_date)
    const evalYear = latestEvalDate.getFullYear()
    const evalMonth = latestEvalDate.getMonth() + 1

    // Check if the latest evaluation is from a previous month
    const isNewMonth = (currentYear > evalYear) || (currentYear === evalYear && currentMonth > evalMonth)

    if (!isNewMonth) {
      // Still in the same month, no need to archive
      return { success: true, archived: false, reason: "same_month" }
    }

    // Check if we already archived this transition (prevent duplicate archives)
    const { data: archiveCheck } = await supabase
      .from("archive_evaluations")
      .select("id")
      .gte("archived_at", `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .limit(1)

    if (archiveCheck && archiveCheck.length > 0) {
      // Already archived for this month
      return { success: true, archived: false, reason: "already_archived" }
    }

    // Perform the archive atomically via PostgreSQL RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("archive_monthly_evaluations", {
      p_archived_at: now.toISOString(),
    })

    if (!rpcError && rpcData?.success) {
      return { 
        success: true, 
        archived: true, 
        count: rpcData.archived_count || 0,
        fromMonth: `${evalYear}-${String(evalMonth).padStart(2, '0')}`
      }
    }

    // Graceful fallback if RPC is not yet registered in database
    console.warn("[autoArchive] RPC unavailable, falling back to batch transfer:", rpcError?.message)

    // Fetch all evaluations with classroom & supervisor details
    const { data: allEvaluations, error: fetchError } = await supabase
      .from("evaluations")
      .select(`
        *,
        classrooms:classroom_id (name, grade, division),
        users:supervisor_id (name)
      `)

    if (fetchError || !allEvaluations || allEvaluations.length === 0) {
      console.error("[autoArchive] Error fetching evaluations:", fetchError)
      return { success: false, archived: false }
    }

    // Add frozen denormalized details and archived_at timestamp
    const evaluationsToArchive = allEvaluations.map((ev: any) => ({
      id: ev.id,
      classroom_id: ev.classroom_id,
      classroom_name: ev.classrooms?.name || "Unknown",
      classroom_grade: ev.classrooms?.grade || "",
      classroom_division: ev.classrooms?.division || "",
      supervisor_id: ev.supervisor_id,
      supervisor_name: ev.users?.name || "Unknown",
      evaluation_date: ev.evaluation_date,
      items: ev.items || {},
      total_score: ev.total_score,
      max_score: ev.max_score,
      notes: ev.notes || null,
      created_at: ev.created_at,
      archived_at: now.toISOString(),
    }))

    // Chunk in batches of 40 to avoid 16KB HTTP headers limit
    for (let i = 0; i < evaluationsToArchive.length; i += 40) {
      const chunk = evaluationsToArchive.slice(i, i + 40)
      const { error: archiveError } = await supabase
        .from("archive_evaluations")
        .upsert(chunk, { onConflict: "id" })

      if (archiveError) {
        console.error("[autoArchive] Error archiving evaluations chunk:", archiveError)
        return { success: false, archived: false }
      }
    }

    // Delete archived evaluations in chunks
    const ids = allEvaluations.map((e: any) => e.id)
    for (let i = 0; i < ids.length; i += 40) {
      const idChunk = ids.slice(i, i + 40)
      const { error: deleteError } = await supabase
        .from("evaluations")
        .delete()
        .in("id", idChunk)

      if (deleteError) {
        console.error("[autoArchive] Error deleting evaluations chunk:", deleteError)
        return { success: false, archived: false }
      }
    }

    return { 
      success: true, 
      archived: true, 
      count: allEvaluations.length,
      fromMonth: `${evalYear}-${String(evalMonth).padStart(2, '0')}`
    }

  } catch (error) {
    console.error("[autoArchive] Unexpected error:", error)
    return { success: false, archived: false }
  }
}
