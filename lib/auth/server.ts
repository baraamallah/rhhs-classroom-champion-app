import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getSessionFromCookies } from "./session"
import type { User } from "@/lib/types"

/**
 * Get the currently authenticated user from the session
 * Use this in Server Components and Server Actions
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getSessionFromCookies()

    if (!session) {
      return null
    }

    const supabase = await createAdminClient()
    // Read only the user identified by the verified session cookie.
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, is_active, created_at, updated_at")
      .eq("id", session.userId)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return null
    }

    return data as User
  } catch (error) {
    console.error("[auth] Error getting current user:", error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Use this when you need to ensure a user is logged in
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
 * Use this to protect admin-only actions
 */
export async function requireRole(allowedRoles: User["role"][]): Promise<User> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(" or ")}`)
  }

  return user
}

/** Route guard: decide access before rendering a protected page. */
export async function requirePageRole(allowedRoles: User["role"][]): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!allowedRoles.includes(user.role)) redirect("/")
  return user
}
