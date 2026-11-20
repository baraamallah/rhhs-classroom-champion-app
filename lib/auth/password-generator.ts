import { randomInt } from "node:crypto"

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const LOWER = "abcdefghijklmnopqrstuvwxyz"
const DIGITS = "0123456789"
const SYMBOLS = "!@#$%^&*"
const ALL_CHARS = UPPER + LOWER + DIGITS + SYMBOLS

/**
 * Generates an unbiased, cryptographically secure random password on the server.
 * Guarantees at least one uppercase, lowercase, digit, and symbol when length >= 4.
 */
export function generateSecurePassword(length = 16): string {
  const safeLength = Math.max(8, Math.min(length, 64))
  const chars: string[] = [
    UPPER[randomInt(0, UPPER.length)],
    LOWER[randomInt(0, LOWER.length)],
    DIGITS[randomInt(0, DIGITS.length)],
    SYMBOLS[randomInt(0, SYMBOLS.length)],
  ]

  while (chars.length < safeLength) {
    chars.push(ALL_CHARS[randomInt(0, ALL_CHARS.length)])
  }

  // Fisher-Yates shuffle using crypto.randomInt
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    const temp = chars[i]
    chars[i] = chars[j]
    chars[j] = temp
  }

  return chars.join("")
}
