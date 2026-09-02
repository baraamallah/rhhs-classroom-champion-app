import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session"
import { verifyPassword } from "@/lib/auth/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    console.log("[Auth] Login attempt for email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Query user with active status - use maybeSingle to avoid 406 error when no rows found
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, password_hash, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle()

    console.log("[Auth] User query result - Found user:", !!userData, "Error:", userError?.message)

    if (userError) {
      console.log("[Auth] Database query error:", userError.message)
      return NextResponse.json({ error: "Unable to verify credentials" }, { status: 500 })
    }

    if (!userData) {
      console.log("[Auth] User not found or inactive")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const passwordValid = await verifyPassword(password, userData.password_hash)

    console.log("[Auth] Password verification result:", passwordValid)

    if (!passwordValid) {
      console.log("[Auth] Password verification failed")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("[Auth] Authentication successful for user:", userData.id)

    // Set session cookie
    await setSessionCookie(userData.id, userData.role)

    return NextResponse.json({ success: true, role: userData.role, name: userData.name })
  } catch (error) {
    console.error("[Auth] Login error:", error)
    await clearSessionCookie()
    return NextResponse.json({ error: "Unable to sign in at this time" }, { status: 500 })
  }
}
