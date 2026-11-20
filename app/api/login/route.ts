import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session"
import { hashPassword, MAX_PASSWORD_LENGTH, verifyPasswordWithUpgrade } from "@/lib/auth/password"
import { checkRateLimit, getClientIp, resetRateLimitKey } from "@/lib/auth/rate-limit"

const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_IP = 20
const MAX_ATTEMPTS_PER_EMAIL = 8

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    if (email.length > 254 || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    const ip = getClientIp(request)
    const ipLimit = checkRateLimit(`login:ip:${ip}`, MAX_ATTEMPTS_PER_IP, LOGIN_WINDOW_MS)
    const emailLimit = checkRateLimit(`login:email:${email}`, MAX_ATTEMPTS_PER_EMAIL, LOGIN_WINDOW_MS)

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds)
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": String(retryAfter),
          },
        }
      )
    }

    const supabase = await createAdminClient()

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, password_hash, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle()

    if (userError) {
      console.error("[Auth] Database query error during login")
      return NextResponse.json(
        { error: "Unable to verify credentials" },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    if (!userData) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    const { valid, needsRehash } = await verifyPasswordWithUpgrade(password, userData.password_hash)

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    // Reset per-email failure bucket on successful login
    resetRateLimitKey(`login:email:${email}`)

    // Transparently upgrade legacy plaintext passwords to bcrypt on login
    if (needsRehash) {
      try {
        const upgradedHash = await hashPassword(password)
        await supabase
          .from("users")
          .update({ password_hash: upgradedHash })
          .eq("id", userData.id)
      } catch (rehashErr) {
        console.error("[Auth] Failed to upgrade password hash:", rehashErr)
      }
    }

    await setSessionCookie(userData.id, userData.role)

    return NextResponse.json(
      { success: true, role: userData.role, name: userData.name },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error("[Auth] Login error:", error)
    await clearSessionCookie()
    return NextResponse.json(
      { error: "Unable to sign in at this time" },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
