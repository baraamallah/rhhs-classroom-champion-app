import { createClient } from "@supabase/supabase-js"
import type { Evaluation } from "./types"

// Create a server-side Supabase client for data queries
// This works perfectly for SELECT queries - no auth needed
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface EvaluationRow {
  id: string
  classroom_id: string
  supervisor_id: string
  evaluation_date: string
  items: Record<string, boolean>
  total_score: number
  max_score: number
  created_at: string
  classroom_name: string | null
  classroom_grade: string | null
  supervisor_name: string | null
  supervisor_email: string | null
}

export async function getEvaluationsServer(): Promise<Evaluation[]> {
  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        classroom_id,
        supervisor_id,
        evaluation_date,
        items,
        total_score,
        max_score,
        created_at,
        classrooms:classroom_id (
          name,
          grade
        ),
        users:supervisor_id (
          name,
          email
        )
      `)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("Error fetching evaluations:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items,
      total_score: row.total_score,
      max_score: row.max_score,
      created_at: row.created_at,
      classroom: row.classrooms
        ? {
            id: row.classroom_id,
            name: row.classrooms.name,
            grade: row.classrooms.grade ?? "",
          }
        : undefined,
      supervisor: row.users
        ? {
            name: row.users.name,
            email: row.users.email ?? "",
          }
        : undefined,
    }))
  } catch (err) {
    console.error("Unexpected error fetching evaluations:", err)
    return []
  }
}
