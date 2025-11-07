import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    console.log("🔍 Login attempt:", { email, passwordLength: password.length })

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Single optimized query with password verification
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    console.log("🔍 User query result:", { userData, userError })

    if (userError || !userData) {
      console.log("❌ User not found or inactive:", userError)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password using simplified comparison
    const passwordValid = password === userData.password_hash

    console.log("🔍 Password verification result:", { passwordValid })

    if (!passwordValid) {
      console.log("❌ Password verification failed")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("✅ Authentication successful:", { userId: userData.id, role: userData.role })

    // Set session cookie
    await setSessionCookie(userData.id, userData.role)

    return NextResponse.json({ success: true, role: userData.role, name: userData.name })
  } catch (error) {
    console.error("[login] unexpected error", error)
    await clearSessionCookie()
    return NextResponse.json({ error: "Unable to sign in at this time" }, { status: 500 })
  }
}
