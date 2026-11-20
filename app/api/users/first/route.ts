import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserCount } from "@/lib/first-user"
import { createAdminClient } from "@/lib/supabase/server"
import { setSessionCookie } from "@/lib/auth/session"
import { hashPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/password"

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
}

const firstUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("A valid email address is required").max(254),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
})

export async function GET() {
  const total = await getUserCount()
  return NextResponse.json({ isFirstUser: total === 0 }, { headers: NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const total = await getUserCount()

  if (total > 0) {
    return NextResponse.json(
      { error: "Initial setup is already complete" },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = firstUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Name, email, and password are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const { name, email, password } = parsed.data
  const supabase = await createAdminClient()

  try {
    // Double-check user count immediately before hashing/inserting to reduce TOCTOU window
    const recheckTotal = await getUserCount()
    if (recheckTotal > 0) {
      return NextResponse.json(
        { error: "Initial setup is already complete" },
        { status: 403, headers: NO_STORE_HEADERS }
      )
    }

    const passwordHash = await hashPassword(password)

    const { data: userData, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        role: "super_admin",
        name,
        is_active: true,
      })
      .select("id, role")
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409, headers: NO_STORE_HEADERS }
        )
      }
      console.error("[first-user] insert error", insertError)
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    if (!userData) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    await setSessionCookie(userData.id, userData.role)

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error("[first-user] unexpected error", error)
    return NextResponse.json(
      { error: "Failed to create user account" },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
