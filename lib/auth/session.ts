import { timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import type { User } from "@/lib/types"

export const SESSION_COOKIE_NAME = "eco_session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const VALID_ROLES = new Set<User["role"]>(["super_admin", "admin", "supervisor", "viewer", "stats"])

export interface SessionPayload {
  userId: string
  role: User["role"]
  exp: number // Unix timestamp (seconds)
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET

  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set")
  }

  return secret
}

async function signPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(getSecret())
  const messageData = encoder.encode(payload)

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, messageData)
  const signatureArray = new Uint8Array(signature)
  return btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

async function encodePayload(data: SessionPayload): Promise<string> {
  const payload = Buffer.from(JSON.stringify(data))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  const signature = await signPayload(payload)
  return `${payload}.${signature}`
}

export async function decodeSessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null

  const parts = token.split(".")
  if (parts.length !== 2) return null

  const [payload, signature] = parts
  if (!payload || !signature) return null

  const expectedSignature = await signPayload(payload)
  const signatureBytes = Buffer.from(signature)
  const expectedSignatureBytes = Buffer.from(expectedSignature)
  if (
    signatureBytes.length !== expectedSignatureBytes.length ||
    !timingSafeEqual(signatureBytes, expectedSignatureBytes)
  ) {
    return null
  }

  try {
    const base64 =
      payload.replace(/-/g, "+").replace(/_/g, "/") +
      "==".slice(0, (4 - (payload.length % 4)) % 4)

    const session = JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as Partial<SessionPayload>
    if (
      typeof session.userId !== "string" ||
      session.userId.trim().length === 0 ||
      typeof session.role !== "string" ||
      !VALID_ROLES.has(session.role as User["role"]) ||
      typeof session.exp !== "number" ||
      !Number.isFinite(session.exp) ||
      session.exp < Math.floor(Date.now() / 1000)
    ) {
      return null
    }
    return {
      userId: session.userId,
      role: session.role as User["role"],
      exp: session.exp,
    }
  } catch {
    return null
  }
}

export async function createSessionToken(
  userId: string,
  role: User["role"],
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds
  return await encodePayload({ userId, role, exp })
}

export async function setSessionCookie(userId: string, role: User["role"]): Promise<void> {
  const token = await createSessionToken(userId, role)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return await decodeSessionToken(token)
}
