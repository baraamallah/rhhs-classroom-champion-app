"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies, clearSessionCookie } from "@/lib/auth/session"

type UserRole = "super_admin" | "admin" | "supervisor" | "viewer"

interface CurrentUser {
  id: string
  role: UserRole
}

async function requireAdmin(): Promise<{ currentUser?: CurrentUser; error?: string }> {
  const session = await getSessionFromCookies()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const supabase = await createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError || !userData) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (!userData.is_active) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (userData.role !== "super_admin" && userData.role !== "admin") {
    return { error: "Unauthorized: Admin access required" }
  }

  return { currentUser: { id: userData.id, role: userData.role } }
}

export async function declareMonthlyWinner(
  classroomId: string,
  division: string,
  year: number,
  month: number,
  totalScore: number,
  averageScore: number,
  evaluationCount: number,
  notes?: string
) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!classroomId || !division || !year || !month) {
    return { success: false, error: "Missing required fields" }
  }

  if (month < 1 || month > 12) {
    return { success: false, error: "Month must be between 1 and 12" }
  }

  const validDivisions = ['Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute']
  if (!validDivisions.includes(division)) {
    return { success: false, error: "Invalid division" }
  }

  const supabase = await createAdminClient()

  try {
    // Check if winner already exists for this division/month/year
    const { data: existing, error: checkError } = await supabase
      .from("monthly_winners")
      .select("id, classroom_id")
      .eq("division", division)
      .eq("year", year)
      .eq("month", month)
      .single()

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("[declareMonthlyWinner] Check error:", checkError)
      return { success: false, error: `Failed to check existing winner: ${checkError.message}` }
    }

    const winnerData = {
      classroom_id: classroomId,
      division,
      year,
      month,
      total_score: totalScore,
      average_score: averageScore,
      evaluation_count: evaluationCount,
      declared_by: currentUser.id,
      notes: notes || null,
    }

    if (existing) {
      // Update existing winner
      const { error: updateError } = await supabase
        .from("monthly_winners")
        .update(winnerData)
        .eq("id", existing.id)

      if (updateError) {
        console.error("[declareMonthlyWinner] Update error:", updateError)
        return { success: false, error: `Failed to update winner: ${updateError.message}` }
      }

      revalidatePath("/admin")
      revalidatePath("/winners")
      return { success: true, message: `Updated winner for ${division} - ${month}/${year}` }
    } else {
      // Insert new winner
      const { error: insertError } = await supabase
        .from("monthly_winners")
        .insert(winnerData)

      if (insertError) {
        console.error("[declareMonthlyWinner] Insert error:", insertError)
        return { success: false, error: `Failed to declare winner: ${insertError.message}` }
      }

      revalidatePath("/admin")
      revalidatePath("/winners")
      return { success: true, message: `Declared winner for ${division} - ${month}/${year}` }
    }
  } catch (dbError: any) {
    console.error("[declareMonthlyWinner] Unexpected error:", dbError)
    return { success: false, error: `Failed to declare winner: ${dbError.message || "Unknown error"}` }
  }
}

export async function getMonthlyWinners(year?: number, month?: number) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

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
        ),
        declared_by_user:declared_by (
          id,
          name,
          email
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
      console.error("[getMonthlyWinners] Fetch error:", fetchError)
      return { success: false, error: `Failed to fetch winners: ${fetchError.message}`, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (dbError: any) {
    console.error("[getMonthlyWinners] Unexpected error:", dbError)
    return { success: false, error: "Failed to fetch winners", data: [] }
  }
}

export async function deleteMonthlyWinner(winnerId: string) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { error: deleteError } = await supabase
      .from("monthly_winners")
      .delete()
      .eq("id", winnerId)

    if (deleteError) {
      console.error("[deleteMonthlyWinner] Delete error:", deleteError)
      return { success: false, error: `Failed to delete winner: ${deleteError.message}` }
    }

    revalidatePath("/admin")
    return { success: true, message: "Winner deleted successfully" }
  } catch (dbError: any) {
    console.error("[deleteMonthlyWinner] Unexpected error:", dbError)
    return { success: false, error: `Failed to delete winner: ${dbError.message || "Unknown error"}` }
  }
}

export async function getTopClassroomsByDivision(division: string, year: number, month: number) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

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
      console.error("[getTopClassroomsByDivision] Fetch error:", evalError)
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
    console.error("[getTopClassroomsByDivision] Unexpected error:", dbError)
    return { success: false, error: "Failed to calculate top classrooms", data: [] }
  }
}

