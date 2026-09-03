import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import type { Classroom, Evaluation, ClassroomScore } from "./types"
import { calculateLeaderboard } from "./utils-leaderboard"
import { hasRecentMutation, getSupabaseServerUrl } from "./db-router"

// Helper to get a server-side Supabase client routing to primary or replica
function getServerSupabase(forcePrimary = false) {
  const url = getSupabaseServerUrl(forcePrimary)
  return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Admin client for queries requiring service role access
function getAdminSupabase(forcePrimary = false) {
  const url = getSupabaseServerUrl(forcePrimary)
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

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

function mapEvaluationRows(data: any[]): Evaluation[] {
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
        division: row.classrooms.division,
      }
      : undefined,
    supervisor: row.users
      ? {
        name: row.users.name,
        email: row.users.email ?? "",
      }
      : undefined,
  }))
}

export async function getEvaluationsServer(forcePrimary = false): Promise<Evaluation[]> {
  try {
    const supabase = getServerSupabase(forcePrimary)
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
          grade,
          division
        ),
        users:supervisor_id (
          name,
          email
        )
      `)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("[supabase-data-server] Error fetching evaluations:", error)
      return []
    }

    return data ? mapEvaluationRows(data) : []
  } catch (err) {
    console.error("[supabase-data-server] Unexpected error fetching evaluations:", err)
    return []
  }
}

export async function getEvaluationsByDateRangeServer(
  startDate: string,
  endDate: string,
  forcePrimary = false
): Promise<Evaluation[]> {
  try {
    const supabase = getServerSupabase(forcePrimary)
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        classroom_id,
        supervisor_id,
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
          name,
          email
        )
      `)
      .gte("evaluation_date", startDate)
      .lte("evaluation_date", endDate)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("[supabase-data-server] Error fetching evaluations by date range:", error)
      return []
    }

    return data ? mapEvaluationRows(data) : []
  } catch (err) {
    console.error("[supabase-data-server] Unexpected error fetching evaluations by date range:", err)
    return []
  }
}

export async function getClassroomsServer(forcePrimary = false): Promise<Classroom[]> {
  try {
    const supabase = getServerSupabase(forcePrimary)
    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name, grade, division, is_active")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[supabase-data-server] Error fetching classrooms:", error)
      return []
    }

    return (data || []) as Classroom[]
  } catch (err) {
    console.error("[supabase-data-server] Unexpected error fetching classrooms:", err)
    return []
  }
}

interface AdminSettings {
  showMonthly: boolean
  calculationMode: boolean
  winnerRevealMode: boolean
  leaderboardMonth: { year: number; month: number } | null
  winnersPageVisible: boolean
}

async function getAdminSettingsServer(forcePrimary = false): Promise<AdminSettings> {
  try {
    const adminSupabase = getAdminSupabase(forcePrimary)
    const { data, error } = await adminSupabase
      .from("system_settings")
      .select("key, value")

    if (error) {
      console.error("[supabase-data-server] Error fetching admin settings:", error)
      return { showMonthly: true, calculationMode: false, winnerRevealMode: false, leaderboardMonth: null, winnersPageVisible: true }
    }

    const map = new Map(data?.map(s => [s.key, s.value]) || [])

    const parseBool = (key: string, defaultVal: boolean): boolean => {
      const raw = map.get(key)
      return raw === null || raw === undefined ? defaultVal : (raw === true || raw === "true")
    }

    return {
      showMonthly: parseBool("leaderboard_show_monthly", true),
      calculationMode: parseBool("calculation_mode", false),
      winnerRevealMode: parseBool("winner_reveal_mode", false),
      leaderboardMonth: (map.get("leaderboard_display_month") as { year: number; month: number } | null) || null,
      winnersPageVisible: parseBool("winners_page_visible", true),
    }
  } catch (err) {
    console.error("[supabase-data-server] Unexpected error fetching admin settings:", err)
    return { showMonthly: true, calculationMode: false, winnerRevealMode: false, leaderboardMonth: null, winnersPageVisible: true }
  }
}

export interface HomepageData {
  leaderboard: ClassroomScore[]
  showMonthly: boolean
  calculationMode: boolean
  winnerRevealMode: boolean
  winnersPageVisible: boolean
}

/**
 * Pure data loader from the database.
 * Does NOT access request-specific sources (cookies/headers) so it can be safely cached.
 */
async function fetchHomepageDataFromDB(forcePrimary: boolean): Promise<HomepageData> {
  const { format, startOfMonth, endOfMonth } = await import("date-fns")

  // Phase 1: settings + classrooms in parallel
  const [settings, classrooms] = await Promise.all([
    getAdminSettingsServer(forcePrimary),
    getClassroomsServer(forcePrimary),
  ])

  // Phase 2: evaluations depend on settings (monthly mode + frozen month)
  let evaluations: Evaluation[]
  if (settings.showMonthly) {
    let startDate: string
    let endDate: string

    if (settings.leaderboardMonth) {
      const frozenDate = new Date(settings.leaderboardMonth.year, settings.leaderboardMonth.month - 1, 1)
      startDate = format(startOfMonth(frozenDate), "yyyy-MM-dd")
      endDate = format(endOfMonth(frozenDate), "yyyy-MM-dd")
    } else {
      const now = new Date()
      startDate = format(startOfMonth(now), "yyyy-MM-dd")
      endDate = format(endOfMonth(now), "yyyy-MM-dd")
    }

    evaluations = await getEvaluationsByDateRangeServer(startDate, endDate, forcePrimary)
  } else {
    evaluations = await getEvaluationsServer(forcePrimary)
  }

  const leaderboard = calculateLeaderboard(evaluations, classrooms)

  return {
    leaderboard,
    showMonthly: settings.showMonthly,
    calculationMode: settings.calculationMode,
    winnerRevealMode: settings.winnerRevealMode,
    winnersPageVisible: settings.winnersPageVisible,
  }
}

/**
 * Shared cached data path with Next.js unstable_cache.
 * Pure cached scope: strictly NO cookies() or headers() inside.
 */
const getCachedHomepageData = unstable_cache(
  async () => fetchHomepageDataFromDB(false),
  ["homepage-leaderboard-data"],
  {
    revalidate: 60, // 60s background revalidation window
    tags: ["leaderboard", "classrooms", "settings"],
  }
)

/**
 * Public caller for the homepage data.
 * Request-specific inspection (`hasRecentMutation`) happens OUTSIDE the cached scope.
 * If a write occurred within the last 5 seconds, bypasses shared cache to provide
 * strict read-your-own-writes consistency.
 */
export async function getHomepageData(): Promise<HomepageData> {
  const recentlyMutated = await hasRecentMutation()

  if (recentlyMutated) {
    // Bypasses shared cache, queries authoritative Primary DB directly
    return fetchHomepageDataFromDB(true)
  }

  // Standard public read path via shared tagged cache
  return getCachedHomepageData()
}
