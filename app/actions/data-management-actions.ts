"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies, clearSessionCookie } from "@/lib/auth/session"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"

type UserRole = "super_admin" | "admin" | "supervisor" | "viewer"

interface CurrentUser {
  id: string
  role: UserRole
}

// Utility to chunk arrays into safe batch sizes (prevents 16KB HTTP headers overflow error)
function chunkArray<T>(items: T[], size = 40): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function requireSuperAdmin(): Promise<{ currentUser?: CurrentUser; error?: string }> {
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
    console.error("[requireSuperAdmin] User lookup failed:", userError)
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

export async function archiveAndReset() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    console.error("[archiveAndReset] Auth failed:", error)
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { data: evaluations, error: evalFetchError } = await supabase
      .from("evaluations")
      .select("*")

    if (evalFetchError) {
      console.error("[archiveAndReset] Failed to fetch evaluations:", evalFetchError)
      return { success: false, error: `Failed to fetch evaluations for archiving: ${evalFetchError.message}` }
    }

    if (evaluations && evaluations.length > 0) {
      // Chunk batches for safe upsert
      const chunks = chunkArray(evaluations, 40)
      for (const chunk of chunks) {
        const { error: archiveEvalError } = await supabase
          .from("archive_evaluations")
          .upsert(chunk, { onConflict: "id" })

        if (archiveEvalError) {
          console.error("Archive evaluations error:", archiveEvalError)
          return { success: false, error: `Failed to archive evaluations: ${archiveEvalError.message}` }
        }
      }

      // Chunk IDs for safe deletion
      const idChunks = chunkArray(evaluations.map((e) => e.id), 40)
      for (const idChunk of idChunks) {
        const { error: deleteEvalError } = await supabase
          .from("evaluations")
          .delete()
          .in("id", idChunk)

        if (deleteEvalError) {
          console.error("[archiveAndReset] Failed to delete evaluations:", deleteEvalError)
          return { success: false, error: `Failed to delete evaluations: ${deleteEvalError.message}` }
        }
      }
    }

    revalidatePath("/admin")
    return {
      success: true,
      message: `Successfully archived ${evaluations?.length || 0} evaluations. Classrooms preserved.`,
    }
  } catch (dbError: any) {
    console.error("[data-management-actions] archiveAndReset error", dbError)
    return { success: false, error: `Failed to archive and reset data: ${dbError.message || "Unknown error"}` }
  }
}

export async function deleteEvaluation(evaluationId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { error: deleteError } = await supabase
      .from("evaluations")
      .delete()
      .eq("id", evaluationId)

    if (deleteError) {
      console.error("[deleteEvaluation] Delete error:", deleteError)
      return { success: false, error: `Failed to delete evaluation: ${deleteError.message}` }
    }

    revalidatePath("/admin")
    return { success: true, message: "Evaluation deleted successfully" }
  } catch (dbError: any) {
    console.error("[deleteEvaluation] Unexpected error:", dbError)
    return { success: false, error: `Failed to delete evaluation: ${dbError.message || "Unknown error"}` }
  }
}

export async function deleteClassroom(classroomId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { error: deleteError } = await supabase
      .from("classrooms")
      .update({ is_active: false })
      .eq("id", classroomId)

    if (deleteError) {
      console.error("[deleteClassroom] Delete error:", deleteError)
      return { success: false, error: `Failed to delete classroom: ${deleteError.message}` }
    }

    revalidatePath("/", "layout")
    revalidatePath("/admin")
    return { success: true, message: "Classroom removed successfully" }
  } catch (dbError: any) {
    console.error("[deleteClassroom] Unexpected error:", dbError)
    return { success: false, error: `Failed to delete classroom: ${dbError.message || "Unknown error"}` }
  }
}

export async function deleteEvaluations(evaluationIds: string[]) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationIds || evaluationIds.length === 0) {
    return { success: false, error: "No evaluations selected" }
  }

  const supabase = await createAdminClient()

  try {
    const idChunks = chunkArray(evaluationIds, 40)
    for (const chunk of idChunks) {
      const { error: deleteError } = await supabase
        .from("evaluations")
        .delete()
        .in("id", chunk)

      if (deleteError) {
        console.error("[deleteEvaluations] Delete error:", deleteError)
        return { success: false, error: `Failed to delete evaluations: ${deleteError.message}` }
      }
    }

    revalidatePath("/admin")
    return { success: true, message: `Successfully deleted ${evaluationIds.length} evaluations` }
  } catch (dbError: any) {
    console.error("[deleteEvaluations] Unexpected error:", dbError)
    return { success: false, error: `Failed to delete evaluations: ${dbError.message || "Unknown error"}` }
  }
}

export async function getAllEvaluationsForManagement() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createAdminClient()

  try {
    const { data, error: fetchError } = await supabase
      .from("evaluations")
      .select(`
        id,
        evaluation_date,
        total_score,
        max_score,
        created_at,
        classrooms:classroom_id (
          name,
          grade,
          division
        ),
        users:supervisor_id (
          name
        )
      `)
      .order("evaluation_date", { ascending: false })

    if (fetchError) {
      console.error("[data-management-actions] getAllEvaluationsForManagement error", fetchError)
      return { success: false, error: `Failed to fetch evaluations: ${fetchError.message}`, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (dbError: any) {
    console.error("[data-management-actions] getAllEvaluationsForManagement error", dbError)
    return { success: false, error: `Failed to fetch evaluations: ${dbError.message || "Unknown error"}`, data: [] }
  }
}

// BATCHED TO PREVENT 16KB HEADERS OVERFLOW ERROR
export async function archiveEvaluations(evaluationIds: string[]) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationIds || evaluationIds.length === 0) {
    return { success: false, error: "No evaluations selected" }
  }

  const supabase = await createAdminClient()

  try {
    const idChunks = chunkArray(evaluationIds, 40)
    let totalArchived = 0

    for (const chunk of idChunks) {
      // 1. Fetch in small chunk
      const { data: evaluations, error: fetchError } = await supabase
        .from("evaluations")
        .select("*")
        .in("id", chunk)

      if (fetchError) {
        console.error("[archiveEvaluations] Fetch error:", fetchError)
        return { success: false, error: `Failed to fetch evaluations: ${fetchError.message}` }
      }

      if (evaluations && evaluations.length > 0) {
        const evaluationsToArchive = evaluations.map((ev) => ({
          ...ev,
          archived_at: new Date().toISOString(),
        }))

        // 2. Upsert chunk
        const { error: archiveError } = await supabase
          .from("archive_evaluations")
          .upsert(evaluationsToArchive, { onConflict: "id" })

        if (archiveError) {
          console.error("[archiveEvaluations] Archive insert error:", archiveError)
          return { success: false, error: `Failed to archive evaluations: ${archiveError.message}` }
        }

        // 3. Delete chunk from main table
        const { error: deleteError } = await supabase
          .from("evaluations")
          .delete()
          .in("id", chunk)

        if (deleteError) {
          console.error("[archiveEvaluations] Delete error:", deleteError)
          return {
            success: false,
            error: `Evaluations archived but failed to delete from main table: ${deleteError.message}`,
          }
        }

        totalArchived += evaluations.length
      }
    }

    revalidatePath("/admin")
    return { success: true, message: `Successfully archived ${totalArchived} evaluations` }
  } catch (dbError: any) {
    console.error("[archiveEvaluations] Unexpected error:", dbError)
    return { success: false, error: `Failed to archive evaluations: ${dbError.message || "Unknown error"}` }
  }
}

export async function getArchivedEvaluations(limit = 50, offset = 0) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createAdminClient()

  try {
    const { data: evaluations, error: fetchError } = await supabase
      .from("archive_evaluations")
      .select("*")
      .order("archived_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error("[data-management-actions] getArchivedEvaluations error", fetchError)
      return { success: false, error: `Failed to fetch archived evaluations: ${fetchError.message}`, data: [] }
    }

    const [
      { data: activeClassrooms },
      { data: archivedClassrooms },
      { data: users }
    ] = await Promise.all([
      supabase.from("classrooms").select("id, name, grade"),
      supabase.from("archive_classrooms").select("id, name, grade"),
      supabase.from("users").select("id, name"),
    ])

    const allClassrooms = [
      ...(activeClassrooms || []),
      ...(archivedClassrooms || [])
    ]

    const evaluationsWithDetails = evaluations?.map((ev) => {
      const classroom = allClassrooms.find((c) => c.id === ev.classroom_id)
      const supervisor = users?.find((u) => u.id === ev.supervisor_id)

      return {
        ...ev,
        classrooms: classroom ? { name: classroom.name, grade: classroom.grade } : null,
        users: supervisor ? { name: supervisor.name } : null,
      }
    })

    return { success: true, data: evaluationsWithDetails || [] }
  } catch (dbError: any) {
    console.error("[data-management-actions] getArchivedEvaluations error", dbError)
    return { success: false, error: "Failed to fetch archived evaluations", data: [] }
  }
}

export async function restoreEvaluations(evaluationIds: string[]) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationIds || evaluationIds.length === 0) {
    return { success: false, error: "No evaluations selected" }
  }

  const supabase = await createAdminClient()

  try {
    const idChunks = chunkArray(evaluationIds, 40)
    let totalRestored = 0

    for (const chunk of idChunks) {
      const { data: evaluations, error: fetchError } = await supabase
        .from("archive_evaluations")
        .select("*")
        .in("id", chunk)

      if (fetchError) {
        console.error("[restoreEvaluations] Fetch error:", fetchError)
        return { success: false, error: `Failed to fetch archived evaluations: ${fetchError.message}` }
      }

      if (evaluations && evaluations.length > 0) {
        const evaluationsToRestore = evaluations.map(({ archived_at, ...rest }) => rest)

        const { error: restoreError } = await supabase
          .from("evaluations")
          .upsert(evaluationsToRestore, { onConflict: "id" })

        if (restoreError) {
          console.error("[restoreEvaluations] Restore insert error:", restoreError)
          return { success: false, error: `Failed to restore evaluations: ${restoreError.message}` }
        }

        const { error: deleteError } = await supabase
          .from("archive_evaluations")
          .delete()
          .in("id", chunk)

        if (deleteError) {
          console.error("[restoreEvaluations] Delete from archive error:", deleteError)
          return {
            success: false,
            error: `Evaluations restored but failed to delete from archive: ${deleteError.message}`,
          }
        }

        totalRestored += evaluations.length
      }
    }

    revalidatePath("/admin")
    return { success: true, message: `Successfully restored ${totalRestored} evaluations` }
  } catch (dbError: any) {
    console.error("[restoreEvaluations] Unexpected error:", dbError)
    return { success: false, error: `Failed to restore evaluations: ${dbError.message || "Unknown error"}` }
  }
}

// ============================================================================
// 🌟 NEW ACADEMIC YEAR ARCHIVE SYSTEM
// ============================================================================

export async function createAcademicYearArchive(
  name: string,
  description?: string,
  academicYear?: string
): Promise<{ success: boolean; archiveId?: string; tableName?: string; message?: string; error?: string }> {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!name || name.trim() === "") {
    return { success: false, error: "Archive name is required (e.g., 'Academic Year 2025-2026')" }
  }

  const supabase = await createAdminClient()

  try {
    // 1. Fetch all active classrooms and all current evaluations
    const [{ data: classrooms, error: classError }, { data: evaluations, error: evalError }] = await Promise.all([
      supabase.from("classrooms").select("*").eq("is_active", true),
      supabase.from("evaluations").select("*"),
    ])

    if (classError) throw new Error(`Classroom fetch failed: ${classError.message}`)
    if (evalError) throw new Error(`Evaluation fetch failed: ${evalError.message}`)

    const evals = evaluations || []
    const rooms = classrooms || []

    // 2. Calculate Final Leaderboard Snapshot across divisions
    const fullLeaderboard = calculateLeaderboard(evals, rooms)

    // Calculate Division Champions (Rank #1 in each division)
    const divisionChampions: Record<string, any> = {}
    const divisions = ["Pre-School", "Elementary", "Middle School", "High School", "Technical Institute"]

    for (const div of divisions) {
      const divRankings = fullLeaderboard.filter((item) => item.classroom.division === div)
      if (divRankings.length > 0) {
        divisionChampions[div] = {
          classroomId: divRankings[0].classroom.id,
          name: divRankings[0].classroom.name,
          grade: divRankings[0].classroom.grade,
          totalScore: divRankings[0].totalScore,
          averageScore: divRankings[0].averageScore,
        }
      }
    }

    // 3. Execute single atomic PostgreSQL RPC (creates dedicated table, copies evaluations, sets RLS, wipes live)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_named_academic_archive", {
      p_name: name.trim(),
      p_academic_year: academicYear?.trim() || name.trim(),
      p_description: description?.trim() || null,
      p_leaderboard_snapshot: fullLeaderboard,
      p_division_champions: divisionChampions,
      p_created_by: currentUser.id,
    })

    if (rpcError) {
      // Check for collision or missing migration function
      if (rpcError.message.includes("Archive table collision") || rpcError.message.includes("Archive collision")) {
        return {
          success: false,
          error: `An archive table for "${name}" already exists. Please choose a different archive title to avoid naming collisions.`,
        }
      }
      if (rpcError.code === "42883" || (rpcError.message.includes("function") && rpcError.message.includes("does not exist"))) {
        return {
          success: false,
          error: "Database migration missing: Please run 'scripts/21_create_named_academic_archive.sql' in your Supabase SQL Editor.",
        }
      }
      throw new Error(`Transactional archive creation failed: ${rpcError.message}`)
    }

    const archiveId = rpcResult?.archive_id
    const tableName = rpcResult?.table_name

    revalidatePath("/", "layout")
    revalidatePath("/admin")
    revalidatePath("/winners")

    return {
      success: true,
      archiveId,
      tableName,
      message: `Successfully created "${name}" archive in dedicated table "${tableName}" with ${evals.length} evaluations and final standings preserved!`,
    }
  } catch (err: any) {
    console.error("[createAcademicYearArchive] Error:", err)
    return { success: false, error: err.message || "Failed to create academic year archive" }
  }
}

export async function getAcademicArchives() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createAdminClient()

  try {
    const { data, error: fetchError } = await supabase
      .from("academic_archives")
      .select("*")
      .order("archived_at", { ascending: false })

    if (fetchError) {
      console.error("[getAcademicArchives] Error:", fetchError)
      return { success: false, error: fetchError.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error("[getAcademicArchives] Error:", err)
    return { success: false, error: err.message || "Failed to fetch academic archives", data: [] }
  }
}

export async function getAcademicArchiveById(archiveId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: null }
  }

  const supabase = await createAdminClient()

  try {
    const { data: archive, error: archiveError } = await supabase
      .from("academic_archives")
      .select("*")
      .eq("id", archiveId)
      .single()

    if (archiveError || !archive) {
      return { success: false, error: archiveError?.message || "Archive not found", data: null }
    }

    const { data: evaluations, error: evalError } = await supabase
      .from("academic_archive_evaluations")
      .select("*")
      .eq("archive_id", archiveId)
      .order("evaluation_date", { ascending: false })

    const evals = evaluations || []
    let leaderboardSnapshot = archive.leaderboard_snapshot || []
    const hasZeroScores = leaderboardSnapshot.length === 0 || leaderboardSnapshot.every((item: any) => !item.totalScore || item.totalScore === 0)

    if (evals.length > 0 && hasZeroScores) {
      const mappedEvals = evals.map((e: any) => ({
        ...e,
        classroom: {
          id: e.classroom_id,
          name: e.classroom_name,
          grade: e.classroom_grade,
          division: e.classroom_division,
        },
      }))

      const distinctRooms = Array.from(
        new Map(
          evals.map((e: any) => [
            e.classroom_id,
            {
              id: e.classroom_id,
              name: e.classroom_name,
              grade: e.classroom_grade,
              division: e.classroom_division,
              is_active: true,
              description: "",
              supervisor_id: e.supervisor_id,
            },
          ])
        ).values()
      )

      leaderboardSnapshot = calculateLeaderboard(mappedEvals, distinctRooms)

      const divisionChampions: Record<string, any> = {}
      const divisions = ["Pre-School", "Elementary", "Middle School", "High School", "Technical Institute"]
      for (const div of divisions) {
        const divRankings = leaderboardSnapshot.filter((item: any) => item.classroom.division === div)
        if (divRankings.length > 0 && divRankings[0].totalScore > 0) {
          divisionChampions[div] = {
            classroomId: divRankings[0].classroom.id,
            name: divRankings[0].classroom.name,
            grade: divRankings[0].classroom.grade,
            totalScore: divRankings[0].totalScore,
            averageScore: divRankings[0].averageScore,
          }
        }
      }

      await supabase
        .from("academic_archives")
        .update({
          leaderboard_snapshot: leaderboardSnapshot,
          division_champions: divisionChampions,
          total_evaluations: evals.length,
          total_classrooms: distinctRooms.length,
        })
        .eq("id", archiveId)

      archive.leaderboard_snapshot = leaderboardSnapshot
      archive.division_champions = divisionChampions
      archive.total_evaluations = evals.length
      archive.total_classrooms = distinctRooms.length
    }

    return {
      success: true,
      data: {
        ...archive,
        evaluations: evals,
        leaderboard_snapshot: leaderboardSnapshot,
      },
    }
  } catch (err: any) {
    console.error("[getAcademicArchiveById] Error:", err)
    return { success: false, error: err.message || "Failed to fetch archive details", data: null }
  }
}

export async function deleteAcademicArchive(archiveId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { error: deleteError } = await supabase
      .from("academic_archives")
      .delete()
      .eq("id", archiveId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    revalidatePath("/admin")
    return { success: true, message: "Archive deleted successfully" }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete archive" }
  }
}
