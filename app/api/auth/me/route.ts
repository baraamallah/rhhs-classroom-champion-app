import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()

  if (!session) {
    return NextResponse.json({ user: null })
  }

  const supabase = await createAdminClient()

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, name, role, is_active")
    .eq("id", session.userId)
    .single()

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Auth me check:", { userData, userError, sessionUserId: session.userId })
  }

  if (userError) {
    if (process.env.NODE_ENV === "development") {
      console.log("❌ DB error in auth check:", userError)
    }
    return NextResponse.json({ user: null })
  }

  if (!userData || !userData.is_active) {
    if (process.env.NODE_ENV === "development") {
      console.log("❌ User not found or inactive in auth check")
    }
    await clearSessionCookie()
    return NextResponse.json({ user: null })
  }

  if (process.env.NODE_ENV === "development") {
    console.log("✅ Auth check successful:", { userId: userData.id, role: userData.role })
  }

  return NextResponse.json({
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
  })
}
