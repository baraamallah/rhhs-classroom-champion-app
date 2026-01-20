"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function getPublicMonthlyWinners(year?: number, month?: number) {
  // Use admin client for public access (bypasses RLS)
  const supabase = await createAdminClient()

  try {
    let query = supabase
      .from("monthly_winners")
      .select(`
        *,
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

    return { success: true, data: data || [] }
  } catch (dbError: any) {
    console.error("[getPublicMonthlyWinners] Unexpected error:", dbError)
    return { success: false, error: "Failed to fetch winners", data: [] }
  }
}

export async function getPublicTopClassroomsByDivision(division: string, year: number, month: number) {
  // Use admin client for public access (bypasses RLS)
  const supabase = await createAdminClient()

  try {
    // Get all evaluations for the specified month and division
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: evaluations, error: evalError } = await supabase
      .from("evaluations")
      .select(`
        *,
        classrooms:classroom_id (
          id,
          name,
          grade,
          division
        )
      `)
      .gte("evaluation_date", startDate)
      .lte("evaluation_date", endDate)

    if (evalError) {
      console.error("[getPublicTopClassroomsByDivision] Fetch error:", evalError)
      return { success: false, error: `Failed to fetch evaluations: ${evalError.message}`, data: [] }
    }

    // Filter by division and calculate scores
    const divisionEvaluations = (evaluations || []).filter(
      (e: any) => e.classrooms?.division === division
    )

    // Group by classroom and calculate totals
    const classroomScores = new Map<string, {
      classroom: any
      totalScore: number
      evaluationCount: number
      averageScore: number
    }>()

    divisionEvaluations.forEach((evaluation: any) => {
      if (!evaluation.classrooms) return

      const classroomId = evaluation.classroom_id
      const existing = classroomScores.get(classroomId) || {
        classroom: evaluation.classrooms,
        totalScore: 0,
        evaluationCount: 0,
        averageScore: 0,
      }

      existing.totalScore += evaluation.total_score
      existing.evaluationCount += 1
      existing.averageScore = existing.totalScore / existing.evaluationCount

      classroomScores.set(classroomId, existing)
    })

    // Convert to array and sort by total score
    const sortedClassrooms = Array.from(classroomScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)

    return { success: true, data: sortedClassrooms }
  } catch (dbError: any) {
    console.error("[getPublicTopClassroomsByDivision] Unexpected error:", dbError)
    return { success: false, error: "Failed to calculate top classrooms", data: [] }
  }
}
