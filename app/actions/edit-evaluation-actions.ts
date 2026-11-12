"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"
import { readEvaluationHistory } from "@/lib/evaluation-history"
import { matchesDivision } from "@/lib/checklist-division"
import { revalidatePath, updateTag } from "next/cache"
import { recordRecentMutationCookie } from "@/lib/db-router"
import type { ChecklistItem } from "@/lib/types"

async function authorizedClient() {
  const session = await getSessionFromCookies()
  if (!session) throw new Error("Not authenticated")
  const db = await createAdminClient()
  const { data, error } = await db.from("users").select("role,is_active").eq("id", session.userId).single()
  if (error || !data?.is_active || !["admin", "super_admin"].includes(data.role))
    throw new Error("Admin access required")
  return db
}

export async function loadEvaluationEditor(classroomId: string, date: string) {
  const db = await authorizedClient()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new Error("Invalid date")
  const records = await readEvaluationHistory(db, {
    classroomId,
    start: `${date}T00:00:00.000Z`,
    end: `${date}T23:59:59.999Z`,
    endInclusive: true
  })
  if (records.length > 1) throw new Error("Multiple evaluations found. Resolve duplicate records first.")
  const evaluation = records[0]
  if (!evaluation) return null
  const { data, error } = await db
    .from("checklist_items")
    .select("*,checklist_item_assignments(supervisor_id)")
    .eq("is_active", true)
    .order("display_order")
  if (error) throw new Error("Could not load rubric")
  const items: ChecklistItem[] = (data || []).filter(
    (item) =>
      matchesDivision(item, evaluation.classroom?.division) &&
      (!item.checklist_item_assignments.length ||
        item.checklist_item_assignments.some(
          (a: { supervisor_id: string }) => a.supervisor_id === evaluation.supervisor_id
        ))
  )
  return { evaluation, items }
}

export async function saveEvaluationEdit(id: string, checked: string[], notes: string) {
  const db = await authorizedClient()
  const { data: original, error } = await db.from("evaluations").select("*").eq("id", id).single()
  if (error || !original) throw new Error("Evaluation removed or archived. Reload to continue.")
  const loaded = await loadEvaluationEditor(original.classroom_id, original.evaluation_date.slice(0, 10))
  if (!loaded || loaded.evaluation.id !== id) throw new Error("Evaluation is no longer available")
  const before = Object.keys(original.items || {})
    .filter((k) => original.items[k])
    .sort()
  const selected = [...new Set(checked)].sort()
  const changed = JSON.stringify(before) !== JSON.stringify(selected)
  if (changed && selected.some((k) => !loaded.items.some((i) => i.id === k)))
    throw new Error("Rubric changed. Reload the evaluation.")
  const selectedIds = new Set(selected)
  const values = changed
    ? {
        items: Object.fromEntries(selected.map((k) => [k, true])),
        total_score: loaded.items.reduce((s, i) => s + (selectedIds.has(i.id) ? i.points : 0), 0),
        max_score: loaded.items.reduce((s, i) => s + i.points, 0)
      }
    : {}
  const { data: updated, error: updateError } = await db
    .from("evaluations")
    .update({ ...values, notes: notes.trim() || null })
    .eq("id", id)
    .select("id")
    .maybeSingle()
  if (updateError || !updated) throw new Error("Could not save; the evaluation may have been archived.")
  updateTag("leaderboard")
  await recordRecentMutationCookie()
  revalidatePath("/", "layout")
}
