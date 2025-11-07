import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setSessionCookie } from "@/lib/auth/session"

async function getUserCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error("Error getting user count:", error)
    return 0
  }
  
  return count || 0
}

export async function GET() {
  const total = await getUserCount()
  return NextResponse.json({ isFirstUser: total === 0 })
}

export async function POST(request: Request) {
  const total = await getUserCount()

  if (total > 0) {
    return NextResponse.json({ error: "Initial setup is already complete" }, { status: 403 })
  }

  const body = await request.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: password,
        role: 'super_admin',
        name,
        is_active: true
      })
      .select('id, role')
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Email is already in use" }, { status: 409 })
      }
      console.error("[first-user] insert error", insertError)
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    if (!userData) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    await setSessionCookie(userData.id, userData.role)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[first-user] unexpected error", error)
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
  }
}
