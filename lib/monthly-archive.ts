import type { SupabaseClient } from "@supabase/supabase-js"
import { getCurrentMonthPeriod } from "./month-period"

/** Move completed months only, with each batch archived in one DB transaction. */
export async function archiveCompletedMonths(supabase: SupabaseClient, now = new Date()) {
  const period = getCurrentMonthPeriod(now)
  let count = 0
  for (;;) {
    const { data, error } = await supabase.from("evaluations")
      .select("id").lt("evaluation_date", period.start).order("id").limit(200)
    if (error) throw error
    if (!data?.length) break
    const { data: result, error: archiveError } = await supabase.rpc("archive_selective_evaluations", {
      p_evaluation_ids: data.map((row) => row.id),
      p_archived_at: now.toISOString(),
    })
    if (archiveError) throw archiveError
    if (!result?.success || !result.archived_count) {
      throw new Error(result?.error || "The monthly archive could not be completed")
    }
    count += result.archived_count
  }
  return { success: true as const, archived: count > 0, count, fromMonth: "completed months" }
}
