import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { clearSessionCookie, getSessionFromCookies } from "./session"
import type { User } from "@/lib/types"

async function loadCurrentUser(): Promise<User | null> {
  try {
    const session = await getSessionFromCookies()

    if (!session) {
      return null
    }

    const supabase = await createAdminClient()
    // Read only the user identified by the verified session cookie.
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, is_active, created_at")
      .eq("id", session.userId)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return null
    }

    return data as User
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error
    }
    console.error("[auth] Error getting current user:", error)
    return null
  }
}

/**
 * Get the currently authenticated user from the session.
 * Memoized per-request with React.cache() when available to avoid redundant DB lookups.
 */
export const getCurrentUser: () => Promise<User | null> =
  typeof cache === "function" ? cache(loadCurrentUser) : loadCurrentUser

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

/**
 * Require specific role - throws error if user doesn't have required role
 */
export async function requireRole(allowedRoles: User["role"][]): Promise<User> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(" or ")}`)
  }

  return user
}

/**
 * Structured authorization helper for Server Actions.
 * Validates the signed session cookie against the live active user record in DB.
 */
export async function requireRoleAction(
  allowedRoles: User["role"][],
  options: { clearOnInvalid?: boolean; deniedMessage?: string } = {}
): Promise<{ currentUser?: User; error?: string }> {
  const session = await getSessionFromCookies()
  if (!session) {
    return { error: "Not authenticated" }
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, is_active, created_at")
    .eq("id", session.userId)
    .single()

  if (error || !data || !data.is_active) {
    if (options.clearOnInvalid) {
      try {
        await clearSessionCookie()
      } catch {
        // Ignore cookie clear errors in read-only contexts
      }
    }
    return { error: "Not authenticated" }
  }

  if (!allowedRoles.includes(data.role as User["role"])) {
    return {
      error: options.deniedMessage || "Unauthorized: Insufficient permissions",
    }
  }

  return { currentUser: data as User }
}

/** Route guard: decide access before rendering a protected page. */
export async function requirePageRole(allowedRoles: User["role"][]): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!allowedRoles.includes(user.role)) redirect("/")
  return user
}
