import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session"

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
}

export async function GET() {
  const session = await getSessionFromCookies()

  if (!session) {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS })
  }

  const supabase = await createAdminClient()

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, name, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError) {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS })
  }

  if (!userData || !userData.is_active) {
    await clearSessionCookie()
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(
    {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    },
    { headers: NO_STORE_HEADERS }
  )
}
