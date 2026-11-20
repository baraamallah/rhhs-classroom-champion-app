/**
 * Sliding-window in-memory rate limiter for authentication endpoints.
 * Automatically evicts expired entries to bound memory usage.
 */

interface BucketEntry {
  timestamps: number[]
  expiresAt: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

const buckets = new Map<string, BucketEntry>()
const MAX_BUCKETS = 10_000
let lastCleanupAt = 0

function cleanupExpired(now: number) {
  if (now - lastCleanupAt < 60_000 && buckets.size < MAX_BUCKETS) return
  lastCleanupAt = now
  for (const [key, entry] of buckets.entries()) {
    if (entry.expiresAt <= now) {
      buckets.delete(key)
    }
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  cleanupExpired(now)

  const windowStart = now - windowMs
  const existing = buckets.get(key)
  const timestamps = existing ? existing.timestamps.filter((t) => t > windowStart) : []

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0]
    const retryAfterMs = Math.max(1000, oldestInWindow + windowMs - now)
    buckets.set(key, { timestamps, expiresAt: now + windowMs })
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  timestamps.push(now)
  buckets.set(key, { timestamps, expiresAt: now + windowMs })

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
  }
}

export function resetRateLimitKey(key: string): void {
  buckets.delete(key)
}

export function clearAllRateLimits(): void {
  buckets.clear()
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "unknown"
}
