"use server"

import { readClassroomWinCounts } from "@/lib/classroom-win-counts"
import { createAdminClient } from "@/lib/supabase/server"
import { readMonthlyRankings, includeRecordedWinnerScores } from "@/lib/evaluation-history"

export async function getPublicMonthlyWinners(year?: number, month?: number) {
  // Use admin client for public access (bypasses RLS)
  const supabase = await createAdminClient()

  try {
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
      console.error("[getPublicMonthlyWinners] Fetch error:", fetchError)
      return { success: false, error: `Failed to fetch winners: ${fetchError.message}`, data: [] }
    }

    const winCounts = data?.length ? await readClassroomWinCounts(supabase) : {}
    const scoredData = await includeRecordedWinnerScores(supabase, data || [])
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

    return { success: true, data: formattedData }
  } catch (dbError: any) {
    console.error("[getPublicMonthlyWinners] Unexpected error:", dbError)
    return { success: false, error: "Failed to fetch winners", data: [] }
  }
}

export async function getPublicTopClassroomsByDivision(division: string, year: number, month: number) {
  // Use admin client for public access (bypasses RLS)
  const supabase = await createAdminClient()

  try {
    return { success: true, data: await readMonthlyRankings(supabase, division, year, month) }
  } catch (dbError: any) {
    console.error("[getPublicTopClassroomsByDivision] Unexpected error:", dbError)
    return { success: false, error: "Failed to calculate top classrooms", data: [] }
  }
}
