/**
 * Validates and sanitizes a post-login redirect path so it can only target
 * relative paths on the current origin (blocks protocol-relative //evil.com,
 * backslash tricks /\evil.com, and absolute URLs).
 */
export function getSafeRelativeRedirect(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return null
  }
  try {
    const parsed = new URL(trimmed, "https://local.invalid")
    if (parsed.origin !== "https://local.invalid") return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}
