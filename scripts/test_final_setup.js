const fs = require("node:fs")
const path = require("node:path")
const { createClient } = require("@supabase/supabase-js")

function loadLocalEnvironment() {
  const envPath = path.join(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "")
    }
  }
}

loadLocalEnvironment()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required to run this check.")
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function assertQuery(label, query) {
  const { error } = await query
  if (error) throw new Error(`${label}: ${error.message}`)
  console.log(`PASS: ${label}`)
}

async function testCompleteSetup() {
  try {
    await assertQuery("users table", supabase.from("users").select("id").limit(1))
    await assertQuery("classrooms table", supabase.from("classrooms").select("id").limit(1))
    await assertQuery("checklist_items table", supabase.from("checklist_items").select("id").limit(1))

    const { data: hash, error: hashError } = await supabase.rpc("hash_password", { input_password: "test123" })
    if (hashError) throw new Error(`hash_password RPC: ${hashError.message}`)
    console.log("PASS: hash_password RPC")

    const { data: verified, error: verifyError } = await supabase.rpc("verify_password", {
      input_password: "test123",
      stored_hash: hash,
    })
    if (verifyError || verified !== true) {
      throw new Error(`verify_password RPC: ${verifyError?.message || "returned false"}`)
    }
    console.log("PASS: verify_password RPC")

    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("id, role")
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .maybeSingle()
    if (adminError) throw new Error(`administrative user lookup: ${adminError.message}`)
    console.log(adminUser ? "PASS: administrative user lookup" : "INFO: no administrative user has been created yet")
  } catch (error) {
    console.error("FAIL:", error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

void testCompleteSetup()
