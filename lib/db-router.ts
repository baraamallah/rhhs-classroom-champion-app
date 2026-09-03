import { cookies } from "next/headers"

/**
 * Cookie key used to track recent write mutations per client session.
 * Used for "Read-Your-Own-Writes" consistency without sacrificing
 * public shared caching.
 */
export const RECENT_MUTATION_COOKIE_NAME = "rhhs_last_mutation"
export const RECENT_MUTATION_WINDOW_MS = 5000 // 5 seconds

/**
 * Inspects request cookies outside any cached scope to determine
 * whether the calling client performed a write mutation within the lag window.
 */
export async function hasRecentMutation(windowMs = RECENT_MUTATION_WINDOW_MS): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const lastMutation = cookieStore.get(RECENT_MUTATION_COOKIE_NAME)?.value
    if (!lastMutation) return false

    const mutationTime = parseInt(lastMutation, 10)
    if (isNaN(mutationTime)) return false

    return Date.now() - mutationTime < windowMs
  } catch {
    // If called in an environment without cookie access, default to standard path
    return false
  }
}

/**
 * Records a mutation timestamp in client cookies following a successful write.
 * Call this in Server Actions or mutation handlers.
 */
export async function recordRecentMutationCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(RECENT_MUTATION_COOKIE_NAME, Date.now().toString(), {
      path: "/",
      maxAge: 10, // 10s TTL automatically cleans up the cookie
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
  } catch (err) {
    console.warn("[db-router] Could not set mutation cookie:", err)
  }
}

/**
 * Resolves the appropriate PostgreSQL connection string.
 * Server-only: never references NEXT_PUBLIC_* variables.
 *
 * @param forcePrimary If true or recent mutation detected, forces the authoritative Primary DB.
 */
export function getDatabaseConnectionString(forcePrimary = false): string | null {
  const primaryUrl = process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL || null
  const replicaUrl = process.env.DATABASE_READ_REPLICA_URL || null

  if (forcePrimary || !replicaUrl) {
    return primaryUrl
  }

  return replicaUrl
}

/**
 * Resolves the Supabase REST/GraphQL URL for server queries.
 * If a dedicated read replica URL is configured (SUPABASE_READ_REPLICA_URL) and
 * forcePrimary is false, routes to replica; otherwise falls back to primary.
 */
export function getSupabaseServerUrl(forcePrimary = false): string {
  const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const replicaUrl = process.env.SUPABASE_READ_REPLICA_URL || null

  if (forcePrimary || !replicaUrl) {
    return primaryUrl
  }

  return replicaUrl
}
