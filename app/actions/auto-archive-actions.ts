"use server"

import { createAdminClient } from "@/lib/supabase/server"

/**
 * Checks if we're in a new month and automatically archives evaluations if needed.
 * This runs on every page load to ensure timely archiving without manual intervention.
 */
export async function checkAndAutoArchive() {
  try {
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

    // Perform the archive
    console.log(`[autoArchive] New month detected. Archiving evaluations from ${evalYear}-${evalMonth}`)

    // Fetch all evaluations to archive
    const { data: allEvaluations, error: fetchError } = await supabase
      .from("evaluations")
      .select("*")

    if (fetchError || !allEvaluations || allEvaluations.length === 0) {
      console.error("[autoArchive] Error fetching evaluations:", fetchError)
      return { success: false, archived: false }
    }

    // Add archived_at timestamp
    const evaluationsToArchive = allEvaluations.map(ev => ({
      ...ev,
      archived_at: now.toISOString()
    }))

    // Insert into archive
    const { error: archiveError } = await supabase
      .from("archive_evaluations")
      .insert(evaluationsToArchive)

    if (archiveError) {
      console.error("[autoArchive] Error archiving evaluations:", archiveError)
      return { success: false, archived: false }
    }

    // Delete from main table
    const { error: deleteError } = await supabase
      .from("evaluations")
      .delete()
      .neq("id", "") // Delete all

    if (deleteError) {
      console.error("[autoArchive] Error deleting evaluations:", deleteError)
      return { success: false, archived: false }
    }

    console.log(`[autoArchive] Successfully archived ${allEvaluations.length} evaluations`)

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
