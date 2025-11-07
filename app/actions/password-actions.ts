"use server"

export async function generateSecurePassword(length = 16): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""

  // Use Web Crypto API which works in both server and client contexts
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  for (let i = 0; i < length; i++) {
    // Map random byte to character index
    const index = randomValues[i] % chars.length
    password += chars[index]
  }

  return password
}
