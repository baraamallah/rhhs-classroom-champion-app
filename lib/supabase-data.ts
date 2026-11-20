import { submitEvaluation as submitEvaluationAction } from "@/app/actions/evaluation-actions"
import {
  createClassroomAction,
  updateClassroomAction,
  deleteClassroomAction,
  bulkUpdateClassroomDivisionsAction,
} from "@/app/actions/classroom-actions"
import {
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
} from "@/app/actions/checklist-actions"
import {
  getClassroomsAction,
  getClassroomsBySupervisorAction,
  getChecklistItemsAction,
  getEvaluationsAction,
  getEvaluationsBySupervisorAction,
  getEvaluationsByDateRangeAction,
  getArchivedEvaluationsListAction,
  getAllEvaluationHistoryAction,
  getLeaderboardFromDatabaseViewAction,
} from "@/app/actions/read-actions"
import type { Classroom, ChecklistItem, Evaluation } from "./types"

// Authenticated Server Action wrappers (no direct browser anon DB reads on staff/user tables)
export async function getClassrooms(): Promise<Classroom[]> {
  return getClassroomsAction()
}

export async function getClassroomsBySupervisor(supervisorId: string): Promise<Classroom[]> {
  return getClassroomsBySupervisorAction(supervisorId)
}

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  return getChecklistItemsAction()
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
  return getEvaluationsAction()
}

export async function getEvaluationsBySupervisor(supervisorId: string): Promise<Evaluation[]> {
  return getEvaluationsBySupervisorAction(supervisorId)
}

export async function getEvaluationsByDateRange(startDate: string, endDate: string): Promise<Evaluation[]> {
  return getEvaluationsByDateRangeAction(startDate, endDate)
}

export async function getArchivedEvaluationsList(): Promise<Evaluation[]> {
  return getArchivedEvaluationsListAction()
}

export async function getLeaderboardFromDatabaseView(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  return getLeaderboardFromDatabaseViewAction()
}

export async function getAllEvaluationHistory(): Promise<Evaluation[]> {
  return getAllEvaluationHistoryAction()
}
