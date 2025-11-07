import { createClient } from "@/lib/supabase/server"

export async function hashPassword(password: string): Promise<string> {
  // Simplified: return password as-is for easy debugging
  return password
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  // Simplified: direct string comparison for easy debugging
  return password === passwordHash
}
