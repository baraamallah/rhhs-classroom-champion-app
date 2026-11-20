import { createHash, timingSafeEqual } from "node:crypto"
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/
export const MAX_PASSWORD_LENGTH = 128
export const MIN_PASSWORD_LENGTH = 8

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value)
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error("Invalid password length")
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest()
  const digestB = createHash("sha256").update(b, "utf8").digest()
  return timingSafeEqual(digestA, digestB)
}

export interface PasswordVerificationResult {
  valid: boolean
  needsRehash: boolean
}

/**
 * Verifies a password against either a bcrypt hash or a legacy plaintext record.
 * When a legacy plaintext record matches, returns `needsRehash: true` so the caller
 * can transparently upgrade the stored password to bcrypt on login.
 */
export async function verifyPasswordWithUpgrade(
  password: string,
  storedHash: string
): Promise<PasswordVerificationResult> {
  if (!password || !storedHash || password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, needsRehash: false }
  }

  if (isBcryptHash(storedHash)) {
    const valid = await bcrypt.compare(password, storedHash)
    return { valid, needsRehash: false }
  }

  // Legacy plaintext fallback with constant-time digest comparison
  const valid = timingSafeStringEqual(password, storedHash)
  return { valid, needsRehash: valid }
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const { valid } = await verifyPasswordWithUpgrade(password, passwordHash)
  return valid
}
