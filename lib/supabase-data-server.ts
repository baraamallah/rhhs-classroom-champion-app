import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import type { Classroom, Evaluation, ClassroomScore } from "./types"
import { calculateLeaderboard } from "./utils-leaderboard"
import { resolveLeaderboardScope } from "./display-period"
import { readEvaluationHistory } from "./evaluation-history"
import { getCurrentMonthPeriod } from "./month-period"
import { hasRecentMutation, getSupabaseServerUrl } from "./db-router"

const HOMEPAGE_SETTING_KEYS = [
  "leaderboard_show_monthly",
  "calculation_mode",
  "winner_reveal_mode",
  "leaderboard_display_month",
  "winners_page_visible",
] as const

const clientCache = new Map<string, SupabaseClient>()

function getCachedSupabaseClient(url: string, key: string): SupabaseClient {
  const cacheKey = `${url}::${key.slice(0, 12)}`
  let client = clientCache.get(cacheKey)
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    clientCache.set(cacheKey, client)
  }
  return client
}

// Helper to get a memoized server-side Supabase client routing to primary or replica
function getServerSupabase(forcePrimary = false) {
  const url = getSupabaseServerUrl(forcePrimary)
  return getCachedSupabaseClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Memoized admin client for queries requiring service role access
function getAdminSupabase(forcePrimary = false) {
  const url = getSupabaseServerUrl(forcePrimary)
  return getCachedSupabaseClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function getEvaluationsServer(forcePrimary = false): Promise<Evaluation[]> {
  try {
    const supabase = getServerSupabase(forcePrimary)
    return await readEvaluationHistory(supabase, getCurrentMonthPeriod())
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
    const formattedStart = startDate.includes("T") ? startDate : `${startDate}T00:00:00.000Z`
    const formattedEnd = endDate.includes("T") ? endDate : `${endDate}T23:59:59.999Z`

    return await readEvaluationHistory(supabase, {
      start: formattedStart,
      end: formattedEnd,
      endInclusive: true,
      includeArchives: true,
      parallelTables: true,
    })
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

async function getAdminSettingsServer(): Promise<AdminSettings> {
  try {
    const adminSupabase = getAdminSupabase(true)
    const { data, error } = await adminSupabase
      .from("system_settings")
      .select("key, value")
      .in("key", [...HOMEPAGE_SETTING_KEYS])

    if (error) {
      console.error("[supabase-data-server] Error fetching admin settings:", error)
      return {
        showMonthly: true,
        calculationMode: false,
        winnerRevealMode: false,
        leaderboardMonth: null,
        winnersPageVisible: true,
      }
    }

    const map = new Map(data?.map((s) => [s.key, s.value]) || [])

    const parseBool = (key: string, defaultVal: boolean): boolean => {
      const raw = map.get(key)
      return raw === null || raw === undefined ? defaultVal : raw === true || raw === "true"
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
    return {
      showMonthly: true,
      calculationMode: false,
      winnerRevealMode: false,
      leaderboardMonth: null,
      winnersPageVisible: true,
    }
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
async function fetchHomepageDataFromDB(forcePrimary: boolean, year: number, month: number): Promise<HomepageData> {
  // Phase 1: settings + classrooms in parallel
  const [settings, classrooms] = await Promise.all([
    getAdminSettingsServer(),
    getClassroomsServer(forcePrimary),
  ])

  const scope = resolveLeaderboardScope(settings.showMonthly, settings.leaderboardMonth, { year, month })
  const evaluations = await readEvaluationHistory(getAdminSupabase(forcePrimary), {
    ...scope,
    includeDetails: false,
    parallelTables: true,
  })

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
  async (year: number, month: number) => fetchHomepageDataFromDB(false, year, month),
  ["homepage-leaderboard-data"],
  {
    revalidate: 60,
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
  const { year, month } = getCurrentMonthPeriod()
  const recentlyMutated = await hasRecentMutation()

  if (recentlyMutated) {
    return fetchHomepageDataFromDB(true, year, month)
  }

  return getCachedHomepageData(year, month)
}
