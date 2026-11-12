import type { SupabaseClient } from "@supabase/supabase-js"

/** Count distinct awarded months across all recorded monthly declarations. */
export async function readClassroomWinCounts(supabase: SupabaseClient) {
  const monthsByClassroom = new Map<string, Set<string>>()
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("monthly_winners")
      .select("id, classroom_id, year, month")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    for (const winner of data || []) {
      if (!winner.classroom_id) continue
      const months = monthsByClassroom.get(winner.classroom_id) || new Set<string>()
      months.add(`${winner.year}-${winner.month}`)
      monthsByClassroom.set(winner.classroom_id, months)
    }
    if (!data || data.length < pageSize) break
  }
  return Object.fromEntries([...monthsByClassroom].map(([id, months]) => [id, months.size]))
}
