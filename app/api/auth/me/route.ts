import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

    const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role, is_active')
    .eq('id', session.userId)
    .single()

  console.log("🔍 Auth me check:", { userData, userError, sessionUserId: session.userId })

  if (userError || !userData) {
    console.log("❌ User not found in auth check:", userError)
    await clearSessionCookie()
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  if (!userData.is_active) {
    console.log("❌ User is inactive in auth check")
    await clearSessionCookie()
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  console.log("✅ Auth check successful:", { userId: userData.id, role: userData.role })

  return NextResponse.json({
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
  })
}
