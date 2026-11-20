#!/usr/bin/env node
/**
 * One-time migration utility to hash any remaining legacy plaintext passwords
 * in public.users with bcryptjs (cost 12).
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-plaintext-passwords.mjs
 */

import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/
const BCRYPT_ROUNDS = 12

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, password_hash")

  if (error) {
    console.error("Failed to fetch users:", error.message)
    process.exit(1)
  }

  let migrated = 0
  let skipped = 0

  for (const user of users || []) {
    if (!user.password_hash || BCRYPT_PATTERN.test(user.password_hash)) {
      skipped++
      continue
    }

    const hashed = await bcrypt.hash(user.password_hash, BCRYPT_ROUNDS)
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashed })
      .eq("id", user.id)

    if (updateError) {
      console.error(`Failed to migrate user ${user.id}:`, updateError.message)
      continue
    }

    migrated++
  }

  console.log(`Password migration complete. Migrated: ${migrated}, Already hashed/skipped: ${skipped}`)
}

main().catch((err) => {
  console.error("Unexpected error during password migration:", err)
  process.exit(1)
})
