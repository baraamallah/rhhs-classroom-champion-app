import type { SupabaseClient } from "@supabase/supabase-js"
import type { Evaluation } from "./types"
import { getMonthPeriod } from "./month-period"
import { calculateLeaderboard } from "./utils-leaderboard"

interface HistoryOptions {
  start?: string
  end?: string
  endInclusive?: boolean
  includeArchives?: boolean
  archivesOnly?: boolean
  supervisorId?: string
  classroomId?: string
  classroomIds?: string[]
}

/** Evaluation date determines the scoring month; archive date never changes it. */
export async function readEvaluationHistory(
  supabase: SupabaseClient,
  options: HistoryOptions = {}
): Promise<Evaluation[]> {
  const byId = new Map<string, Evaluation>()
  const tables = options.archivesOnly
    ? ["archive_evaluations", "academic_archive_evaluations"]
    : options.includeArchives
      ? ["evaluations", "archive_evaluations", "academic_archive_evaluations"]
      : ["evaluations"]
  // Read live first: a partially completed archive/restore must not count twice.
  for (const table of tables) {
    for (let offset = 0; ; offset += 1000) {
      let query = supabase
        .from(table)
        .select(
          table === "evaluations"
            ? "id, classroom_id, supervisor_id, evaluation_date, items, total_score, max_score, notes, created_at, classrooms:classroom_id(name, grade, division), users:supervisor_id(name, email)"
            : "id, classroom_id, supervisor_id, evaluation_date, items, total_score, max_score, notes, created_at, archived_at, classroom_name, classroom_grade, classroom_division, supervisor_name"
        )
      if (options.start) query = query.gte("evaluation_date", options.start)
      if (options.end)
        query = options.endInclusive
          ? query.lte("evaluation_date", options.end)
          : query.lt("evaluation_date", options.end)
      if (options.supervisorId) query = query.eq("supervisor_id", options.supervisorId)
      if (options.classroomId) query = query.eq("classroom_id", options.classroomId)
      if (options.classroomIds) query = query.in("classroom_id", options.classroomIds)
      const { data, error } = await query.order("id").range(offset, offset + 999)
      if (error) throw new Error(`Unable to read ${table}: ${error.message}`)
      for (const row of (data || []) as any[]) {
        if (byId.has(row.id)) continue
        const total = Number(row.total_score)
        if (row.total_score == null || !Number.isFinite(total)) throw new Error("Invalid evaluation score")
        const classroom =
          row.classrooms ||
          (row.classroom_name
            ? {
                name: row.classroom_name,
                grade: row.classroom_grade,
                division: row.classroom_division
              }
            : undefined)
        byId.set(row.id, {
          id: row.id,
          classroom_id: row.classroom_id,
          supervisor_id: row.supervisor_id,
          evaluation_date: row.evaluation_date,
          items: row.items || {},
          total_score: total,
          max_score: Number(row.max_score),
          notes: row.notes,
          created_at: row.created_at,
          archived_at: row.archived_at,
          is_archived: table !== "evaluations",
          archive_source:
            table === "evaluations" ? undefined : (table as "archive_evaluations" | "academic_archive_evaluations"),
          classroom_name: classroom?.name,
          classroom_grade: classroom?.grade,
          classroom_division: classroom?.division,
          supervisor_name: row.users?.name || row.supervisor_name,
          classroom: classroom
            ? { id: row.classroom_id, name: classroom.name, grade: classroom.grade || "", division: classroom.division }
            : undefined,
          supervisor: row.users || (row.supervisor_name ? { name: row.supervisor_name, email: "" } : undefined)
        })
      }
      if (!data || data.length < 1000) break
    }
  }
  return [...byId.values()].sort((a, b) => b.evaluation_date.localeCompare(a.evaluation_date))
}

export async function readMonthlyRankings(supabase: SupabaseClient, division: string, year: number, month: number) {
  const period = getMonthPeriod(year, month)
  const evaluations = await readEvaluationHistory(supabase, { ...period, includeArchives: true })
  return calculateLeaderboard(evaluations.filter((evaluation) => evaluation.classroom?.division === division))
}

export async function includeRecordedWinnerScores<T extends { classroom_id: string; year: number; month: number }>(
  supabase: SupabaseClient,
  winners: T[]
) {
  const months = new Map<string, ReturnType<typeof calculateLeaderboard>>()
  const periods = [
    ...new Map(
      winners.map((winner) => {
        const period = getMonthPeriod(winner.year, winner.month)
        return [period.key, period] as const
      })
    ).values()
  ]
  let nextPeriod = 0
  let failed = false
  let failure: unknown
  // Month reads are independent; cap database concurrency and drain in-flight reads before returning.
  async function readNextMonth(): Promise<void> {
    if (failed || nextPeriod >= periods.length) return
    const period = periods[nextPeriod++]
    try {
      const history = await readEvaluationHistory(supabase, { ...period, includeArchives: true })
      months.set(period.key, calculateLeaderboard(history))
    } catch (error) {
      failed = true
      failure = error
      return
    }
    return readNextMonth()
  }
  await Promise.all(Array.from({ length: Math.min(3, periods.length) }, () => readNextMonth()))
  if (failed) throw failure
  return winners.map((winner) => {
    const score = months
      .get(getMonthPeriod(winner.year, winner.month).key)
      ?.find((entry) => entry.classroom.id === winner.classroom_id)
    // Keep the recorded result if legacy evaluations are no longer available.
    return score
      ? {
          ...winner,
          total_score: score.totalScore,
          average_score: score.averageScore,
          evaluation_count: score.evaluationCount
        }
      : winner
  })
}
