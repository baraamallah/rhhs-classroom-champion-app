"use server"

import { unstable_cache } from "next/cache"
import { readClassroomWinCounts } from "@/lib/classroom-win-counts"
import { createAdminClient } from "@/lib/supabase/server"
import { readMonthlyRankings, includeRecordedWinnerScores } from "@/lib/evaluation-history"
import { hasRecentMutation } from "@/lib/db-router"

async function fetchPublicMonthlyWinnersFromDB(year?: number, month?: number) {
  const supabase = await createAdminClient()

  let query = supabase
    .from("monthly_winners")
    .select(`
      id, classroom_id, classroom_name, classroom_grade, division, year, month, total_score, average_score, evaluation_count,
      classrooms:classroom_id (
        id,
        name,
        grade,
        division
      )
    `)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("division", { ascending: true })

  if (year) {
    query = query.eq("year", year)
  }
  if (month) {
    query = query.eq("month", month)
  }

  const { data, error: fetchError } = await query

  if (fetchError) {
    throw new Error(`Failed to fetch winners: ${fetchError.message}`)
  }

  const [winCounts, scoredData] = await Promise.all([
    data?.length ? readClassroomWinCounts(supabase) : Promise.resolve({} as Record<string, number>),
    includeRecordedWinnerScores(supabase, data || []),
  ])

  const formattedData = scoredData.map((row: any) => {
    const clsName = row.classroom_name || row.classrooms?.name || "Unknown Classroom"
    const clsGrade = row.classroom_grade || row.classrooms?.grade || ""
    const clsDivision = row.classrooms?.division || row.division

    const totalScore = Number(row.total_score)
    if (row.total_score == null || !Number.isFinite(totalScore)) {
      throw new Error("Invalid recorded winner score")
    }

    return {
      ...row,
      win_count: winCounts[row.classroom_id] || 0,
      total_score: totalScore,
      classroom_name: clsName,
      classroom_grade: clsGrade,
      classrooms: {
        id: row.classroom_id,
        name: clsName,
        grade: clsGrade,
        division: clsDivision,
      },
    }
  })

  return formattedData
}

const getCachedPublicMonthlyWinners = unstable_cache(
  async (yearKey: number | null, monthKey: number | null) =>
    fetchPublicMonthlyWinnersFromDB(yearKey ?? undefined, monthKey ?? undefined),
  ["public-monthly-winners"],
  {
    revalidate: 60,
    tags: ["winners", "leaderboard"],
  }
)

export async function getPublicMonthlyWinners(year?: number, month?: number) {
  try {
    const recentlyMutated = await hasRecentMutation()
    const data = recentlyMutated
      ? await fetchPublicMonthlyWinnersFromDB(year, month)
      : await getCachedPublicMonthlyWinners(year ?? null, month ?? null)

    return { success: true, data }
  } catch (dbError: any) {
    console.error("[getPublicMonthlyWinners] Unexpected error:", dbError)
    return { success: false, error: "Failed to fetch winners", data: [] }
  }
}

export async function getPublicTopClassroomsByDivision(division: string, year: number, month: number) {
  const supabase = await createAdminClient()

  try {
    return { success: true, data: await readMonthlyRankings(supabase, division, year, month) }
  } catch (dbError: any) {
    console.error("[getPublicTopClassroomsByDivision] Unexpected error:", dbError)
    return { success: false, error: "Failed to calculate top classrooms", data: [] }
  }
}
