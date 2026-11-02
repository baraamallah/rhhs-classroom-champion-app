import { getAdminSettings } from "@/app/actions/winners-page-actions"
import { resolveLeaderboardScope } from "./display-period"
import { calculateLeaderboard } from "./utils-leaderboard"
import { readEvaluationHistory } from "./evaluation-history"
import { getCurrentMonthPeriod } from "./month-period"
import { createClient } from "@/lib/supabase/client"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"
import { submitEvaluation as submitEvaluationAction } from "@/app/actions/evaluation-actions"
import {
  createClassroomAction,
  updateClassroomAction,
  deleteClassroomAction,
  bulkUpdateClassroomDivisionsAction
} from "@/app/actions/classroom-actions"
import {
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction
} from "@/app/actions/checklist-actions"
import type { Classroom, ChecklistItem, Evaluation, User } from "./types"

// Client-side data functions
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        *,
        classroom_supervisors(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[Database] Error fetching classrooms:", error)
      console.error("[Database] Error details:", JSON.stringify(error, null, 2))
      return []
    }

    // Transform data to flatten the nested structure
    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("[Database] Exception fetching classrooms:", error)
    return []
  }
}

export async function getClassroomsBySupervisor(supervisorId: string): Promise<Classroom[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        *,
        classroom_supervisors!inner(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("classroom_supervisors.supervisor_id", supervisorId)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[Database] Error fetching classrooms by supervisor:", error)
      return []
    }

    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("[Database] Exception fetching classrooms by supervisor:", error)
    return []
  }
}

// Checklist items functions
export async function getChecklistItems(): Promise<ChecklistItem[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("checklist_items")
      .select(`
        *,
        checklist_item_assignments(
          supervisor_id,
          users!checklist_item_assignments_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Database] Error fetching checklist items:", error)
      return []
    }

    // Transform data to flatten the nested structure
    return (data || []).map((item: any) => ({
      ...item,
      assigned_supervisors: item.checklist_item_assignments?.map((s: any) => s.users).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("[Database] Exception fetching checklist items:", error)
    return []
  }
}

export async function addChecklistItem(
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  _createdBy?: string,
  assignedSupervisorIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  return addChecklistItemAction(title, description, points, category, displayOrder, assignedSupervisorIds)
}

export async function updateChecklistItem(
  id: string,
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  isActive?: boolean,
  assignedSupervisorIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  return updateChecklistItemAction(id, title, description, points, category, displayOrder, isActive, assignedSupervisorIds)
}

export async function deleteChecklistItem(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteChecklistItemAction(id)
}

// Classroom management functions
export async function createClassroom(
  name: string,
  grade: string,
  division: string,
  description: string,
  supervisorIds: string[]
): Promise<{ success: boolean; error?: string }> {
  return createClassroomAction(name, grade, division, description, supervisorIds)
}

export async function updateClassroom(
  id: string,
  name: string,
  grade: string,
  division: string,
  description: string,
  supervisorIds?: string[],
  isActive?: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateClassroomAction(id, name, grade, division, description, supervisorIds, isActive)
}

export async function bulkUpdateClassroomDivisions(
  classroomIds: string[],
  division: string
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  return bulkUpdateClassroomDivisionsAction(classroomIds, division)
}

export async function deleteClassroom(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteClassroomAction(id)
}

// Statistics and analytics functions
export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItemIds: string[],
  totalScore: number,
  maxScore: number,
  evaluationDate?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  return await submitEvaluationAction(
    classroomId,
    supervisorId,
    checkedItemIds,
    totalScore,
    maxScore,
    evaluationDate,
    notes
  )
}

export async function getEvaluations(): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    return await readEvaluationHistory(supabase, { ...getCurrentMonthPeriod() })
  } catch (error) {
    console.error("[Database] Exception fetching evaluations:", error)
    return []
  }
}

export async function getEvaluationsBySupervisor(supervisorId: string): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    return await readEvaluationHistory(supabase, { ...getCurrentMonthPeriod(), supervisorId })
  } catch (error) {
    console.error("[Database] Exception fetching evaluations by supervisor:", error)
    return []
  }
}

export async function getEvaluationsByDateRange(startDate: string, endDate: string): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    const formattedStart = startDate.includes("T") ? startDate : `${startDate}T00:00:00.000Z`
    const formattedEnd = endDate.includes("T") ? endDate : `${endDate}T23:59:59.999Z`

    return await readEvaluationHistory(supabase, { start: formattedStart, end: formattedEnd, endInclusive: true, includeArchives: true })
  } catch (error) {
    console.error("[Database] Exception fetching evaluations by date range:", error)
    return []
  }
}

export async function getArchivedEvaluationsList(): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    return await readEvaluationHistory(supabase, { archivesOnly: true })
  } catch (error) {
    console.error("[Database] Exception fetching archive evaluations:", error)
    return []
  }
}

// Ultra-fast direct query from server aggregation view
export async function getLeaderboardFromDatabaseView(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const supabase = createClient()
    const settings = await getAdminSettings()
    if (!settings.success || !settings.settings) throw new Error(settings.error || "Unable to load scoring settings")
    const scope = resolveLeaderboardScope(settings.settings.leaderboard_show_monthly, settings.settings.leaderboard_display_month)
    const [evaluations, classrooms] = await Promise.all([
      readEvaluationHistory(supabase, scope),
      getClassrooms(),
    ])
    return { success: true, data: calculateLeaderboard(evaluations, classrooms) }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load view" }
  }
}



export async function getAllEvaluationHistory(): Promise<Evaluation[]> {
  return readEvaluationHistory(createClient(), { includeArchives: true })
}
