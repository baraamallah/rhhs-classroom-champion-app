"use server"

import { readClassroomWinCounts } from "@/lib/classroom-win-counts"
import { revalidatePath, revalidateTag } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { readMonthlyRankings, includeRecordedWinnerScores } from "@/lib/evaluation-history"
import { requireRoleAction } from "@/lib/auth/server"
import { recordRecentMutationCookie } from "@/lib/db-router"

async function requireAdmin() {
  return requireRoleAction(["super_admin", "admin"], {
    clearOnInvalid: true,
    deniedMessage: "Unauthorized: Admin access required",
  })
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

  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    return { success: false, error: "Select a valid year and month" }
  }

  const validDivisions = ['Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute']
  if (!validDivisions.includes(division)) {
    return { success: false, error: "Invalid division" }
  }

  const supabase = await createAdminClient()

  try {
    // Freeze the server-calculated monthly total, rather than trusting UI values.
    const rankings = await getTopClassroomsByDivision(division, year, month)
    if (!rankings.success) {
      return { success: false, error: "Failed to verify the monthly score" }
    }
    const score = rankings.data.find((entry) => entry.classroom.id === classroomId)
    if (!score) {
      return { success: false, error: "This classroom has no evaluations in the selected division and month" }
    }

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

    // Fetch classroom name and grade to freeze in the monthly winner record
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("name, grade")
      .eq("id", classroomId)
      .maybeSingle()

    const winnerData: any = {
      classroom_id: classroomId,
      classroom_name: classroom?.name || null,
      classroom_grade: classroom?.grade || null,
      division,
      year,
      month,
      total_score: score.totalScore,
      average_score: score.averageScore,
      evaluation_count: score.evaluationCount,
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

      await recordRecentMutationCookie()
      revalidateTag("winners", { expire: 0 })
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

      await recordRecentMutationCookie()
      revalidateTag("winners", { expire: 0 })
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

    const winCounts = data?.length ? await readClassroomWinCounts(supabase) : {}
    const scoredData = await includeRecordedWinnerScores(supabase, data || [])
    const formattedData = scoredData.map((row: any) => {
      const clsName = row.classroom_name || row.classrooms?.name || "Unknown Classroom"
      const clsGrade = row.classroom_grade || row.classrooms?.grade || ""
      const clsDivision = row.classrooms?.division || row.division

      return {
        ...row,
        win_count: winCounts[row.classroom_id] || 0,
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

    await recordRecentMutationCookie()
    revalidateTag("winners", { expire: 0 })
    revalidatePath("/admin")
    revalidatePath("/winners")
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
    return { success: true, data: await readMonthlyRankings(supabase, division, year, month) }
  } catch (dbError: any) {
    console.error("[getTopClassroomsByDivision] Unexpected error:", dbError)
    return { success: false, error: "Failed to calculate top classrooms", data: [] }
  }
}
