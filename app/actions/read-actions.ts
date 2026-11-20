"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { requireRoleAction } from "@/lib/auth/server"
import { readEvaluationHistory } from "@/lib/evaluation-history"
import { getCurrentMonthPeriod } from "@/lib/month-period"
import { resolveLeaderboardScope } from "@/lib/display-period"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"
import { getAdminSettings } from "@/app/actions/winners-page-actions"
import type { Classroom, ChecklistItem, Evaluation } from "@/lib/types"

const STAFF_ROLES: Array<"super_admin" | "admin" | "supervisor" | "stats"> = [
  "super_admin",
  "admin",
  "supervisor",
  "stats",
]

const ADMIN_OR_STATS_ROLES: Array<"super_admin" | "admin" | "stats"> = [
  "super_admin",
  "admin",
  "stats",
]

export async function getClassroomsAction(): Promise<Classroom[]> {
  const { currentUser } = await requireRoleAction(STAFF_ROLES)
  if (!currentUser) return []

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        id, name, grade, division, description, is_active, created_at,
        classroom_supervisors(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[read-actions] Error fetching classrooms:", error)
      return []
    }

    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users).filter(Boolean) || [],
    }))
  } catch (error) {
    console.error("[read-actions] Exception fetching classrooms:", error)
    return []
  }
}

export async function getClassroomsBySupervisorAction(supervisorId: string): Promise<Classroom[]> {
  const { currentUser } = await requireRoleAction(STAFF_ROLES)
  if (!currentUser) return []

  // Supervisors may only query their own assigned classrooms
  const targetSupervisorId =
    currentUser.role === "supervisor" ? currentUser.id : supervisorId

  if (!targetSupervisorId) return []

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        id, name, grade, division, description, is_active, created_at,
        classroom_supervisors!inner(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("classroom_supervisors.supervisor_id", targetSupervisorId)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[read-actions] Error fetching classrooms by supervisor:", error)
      return []
    }

    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users).filter(Boolean) || [],
    }))
  } catch (error) {
    console.error("[read-actions] Exception fetching classrooms by supervisor:", error)
    return []
  }
}

export async function getChecklistItemsAction(): Promise<ChecklistItem[]> {
  const { currentUser } = await requireRoleAction(STAFF_ROLES)
  if (!currentUser) return []

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("checklist_items")
      .select(`
        id, title, description, points, category, display_order, is_active, created_at,
        checklist_item_assignments(
          supervisor_id,
          users!checklist_item_assignments_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[read-actions] Error fetching checklist items:", error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      assigned_supervisors: item.checklist_item_assignments?.map((s: any) => s.users).filter(Boolean) || [],
    }))
  } catch (error) {
    console.error("[read-actions] Exception fetching checklist items:", error)
    return []
  }
}

export async function getEvaluationsAction(): Promise<Evaluation[]> {
  const { currentUser } = await requireRoleAction(ADMIN_OR_STATS_ROLES)
  if (!currentUser) return []

  try {
    const supabase = await createAdminClient()
    return await readEvaluationHistory(supabase, { ...getCurrentMonthPeriod() })
  } catch (error) {
    console.error("[read-actions] Exception fetching evaluations:", error)
    return []
  }
}

export async function getEvaluationsBySupervisorAction(supervisorId: string): Promise<Evaluation[]> {
  const { currentUser } = await requireRoleAction(STAFF_ROLES)
  if (!currentUser) return []

  const targetSupervisorId =
    currentUser.role === "supervisor" ? currentUser.id : supervisorId

  if (!targetSupervisorId) return []

  try {
    const supabase = await createAdminClient()
    return await readEvaluationHistory(supabase, {
      ...getCurrentMonthPeriod(),
      supervisorId: targetSupervisorId,
    })
  } catch (error) {
    console.error("[read-actions] Exception fetching evaluations by supervisor:", error)
    return []
  }
}

export async function getEvaluationsByDateRangeAction(
  startDate: string,
  endDate: string
): Promise<Evaluation[]> {
  const { currentUser } = await requireRoleAction(ADMIN_OR_STATS_ROLES)
  if (!currentUser) return []

  try {
    const supabase = await createAdminClient()
    const formattedStart = startDate.includes("T") ? startDate : `${startDate}T00:00:00.000Z`
    const formattedEnd = endDate.includes("T") ? endDate : `${endDate}T23:59:59.999Z`

    return await readEvaluationHistory(supabase, {
      start: formattedStart,
      end: formattedEnd,
      endInclusive: true,
      includeArchives: true,
    })
  } catch (error) {
    console.error("[read-actions] Exception fetching evaluations by date range:", error)
    return []
  }
}

export async function getArchivedEvaluationsListAction(): Promise<Evaluation[]> {
  const { currentUser } = await requireRoleAction(ADMIN_OR_STATS_ROLES)
  if (!currentUser) return []

  try {
    const supabase = await createAdminClient()
    return await readEvaluationHistory(supabase, { archivesOnly: true })
  } catch (error) {
    console.error("[read-actions] Exception fetching archived evaluations:", error)
    return []
  }
}

export async function getAllEvaluationHistoryAction(): Promise<Evaluation[]> {
  const { currentUser } = await requireRoleAction(ADMIN_OR_STATS_ROLES)
  if (!currentUser) return []

  try {
    const supabase = await createAdminClient()
    return await readEvaluationHistory(supabase, { includeArchives: true })
  } catch (error) {
    console.error("[read-actions] Exception fetching full evaluation history:", error)
    return []
  }
}

export async function getLeaderboardFromDatabaseViewAction(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  const { currentUser, error: authError } = await requireRoleAction(STAFF_ROLES)
  if (authError || !currentUser) {
    return { success: false, error: authError || "Not authenticated" }
  }

  try {
    const supabase = await createAdminClient()
    const settings = await getAdminSettings()
    if (!settings.success || !settings.settings) {
      throw new Error(settings.error || "Unable to load scoring settings")
    }
    const scope = resolveLeaderboardScope(
      settings.settings.leaderboard_show_monthly,
      settings.settings.leaderboard_display_month
    )
    const [evaluations, classrooms] = await Promise.all([
      readEvaluationHistory(supabase, { ...scope, includeDetails: false }),
      getClassroomsAction(),
    ])
    return { success: true, data: calculateLeaderboard(evaluations, classrooms) }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load view" }
  }
}
