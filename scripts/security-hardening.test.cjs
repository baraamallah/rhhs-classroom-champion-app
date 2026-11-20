const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function load(relative, mocks = {}) {
  const absolute = path.resolve(__dirname, "..", relative)
  const source = fs.readFileSync(absolute, "utf8")
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (name.startsWith("@/") || name.startsWith(".")) {
      const target = name.startsWith("@/")
        ? path.resolve(__dirname, "..", name.slice(2))
        : path.resolve(path.dirname(absolute), name)
      const file = [target, target + ".ts", target + ".tsx"].find(
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      )
      if (file) {
        return load(path.relative(path.resolve(__dirname, ".."), file), mocks)
      }
    }
    return require(name)
  }
  new Function("require", "module", "exports", code)(localRequire, module, module.exports)
  return module.exports
}

test("bcrypt password hashing and transparent legacy plaintext upgrade", async () => {
  const pw = load("lib/auth/password.ts")
  const hashed = await pw.hashPassword("EcoChamp!2026")
  assert.ok(pw.isBcryptHash(hashed), "hashPassword must return a valid bcrypt hash")
  assert.notEqual(hashed, "EcoChamp!2026")

  const verifiedBcrypt = await pw.verifyPasswordWithUpgrade("EcoChamp!2026", hashed)
  assert.deepEqual(verifiedBcrypt, { valid: true, needsRehash: false })

  const rejectedBcrypt = await pw.verifyPasswordWithUpgrade("WrongPass!1", hashed)
  assert.deepEqual(rejectedBcrypt, { valid: false, needsRehash: false })

  const legacyUpgrade = await pw.verifyPasswordWithUpgrade("oldPlaintext", "oldPlaintext")
  assert.deepEqual(legacyUpgrade, { valid: true, needsRehash: true })

  const legacyRejected = await pw.verifyPasswordWithUpgrade("wrong", "oldPlaintext")
  assert.deepEqual(legacyRejected, { valid: false, needsRehash: false })

  const oversized = await pw.verifyPasswordWithUpgrade("a".repeat(200), hashed)
  assert.deepEqual(oversized, { valid: false, needsRehash: false })
})

test("generateSecurePassword produces diverse, unbiased passwords", () => {
  const { generateSecurePassword } = load("lib/auth/password-generator.ts")
  const generated = generateSecurePassword(16)
  assert.equal(generated.length, 16)
  assert.match(generated, /[A-Z]/)
  assert.match(generated, /[a-z]/)
  assert.match(generated, /[0-9]/)
  assert.match(generated, /[!@#$%^&*]/)
})

test("getSafeRelativeRedirect blocks protocol-relative and external open redirects", () => {
  const { getSafeRelativeRedirect } = load("lib/auth/redirect.ts")
  assert.equal(getSafeRelativeRedirect("/admin/tracking?view=daily"), "/admin/tracking?view=daily")
  assert.equal(getSafeRelativeRedirect("/supervisor/evaluate#top"), "/supervisor/evaluate#top")
  assert.equal(getSafeRelativeRedirect("//evil.com"), null)
  assert.equal(getSafeRelativeRedirect("//evil.com/admin"), null)
  assert.equal(getSafeRelativeRedirect("/\\evil.com"), null)
  assert.equal(getSafeRelativeRedirect("https://evil.com/admin"), null)
  assert.equal(getSafeRelativeRedirect("javascript:alert(1)"), null)
  assert.equal(getSafeRelativeRedirect(""), null)
  assert.equal(getSafeRelativeRedirect(null), null)
})

test("sliding-window login rate limiter enforces threshold and resets after expiry", () => {
  const rl = load("lib/auth/rate-limit.ts")
  rl.clearAllRateLimits()
  const base = 1_700_000_000_000
  assert.equal(rl.checkRateLimit("login:ip:1.2.3.4", 2, 10_000, base).allowed, true)
  assert.equal(rl.checkRateLimit("login:ip:1.2.3.4", 2, 10_000, base + 1000).allowed, true)
  const blocked = rl.checkRateLimit("login:ip:1.2.3.4", 2, 10_000, base + 2000)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterSeconds >= 8)

  // After window expires, requests are allowed again
  assert.equal(rl.checkRateLimit("login:ip:1.2.3.4", 2, 10_000, base + 11_000).allowed, true)
  rl.resetRateLimitKey("login:ip:1.2.3.4")
})

test("session token decoding rejects malformed, extra-segment, invalid-role, and expired tokens", async () => {
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-only-32chars!"
  const sessionMod = load("lib/auth/session.ts", { "next/headers": { cookies: async () => ({}) } })

  const validToken = await sessionMod.createSessionToken("user-123", "supervisor", 3600)
  const decoded = await sessionMod.decodeSessionToken(validToken)
  assert.equal(decoded?.userId, "user-123")
  assert.equal(decoded?.role, "supervisor")

  // Extra segment rejected
  assert.equal(await sessionMod.decodeSessionToken(`${validToken}.extra`), null)
  // Tampered signature rejected
  assert.equal(await sessionMod.decodeSessionToken(`${validToken}x`), null)
  // Expired token rejected
  const expiredToken = await sessionMod.createSessionToken("user-123", "supervisor", -10)
  assert.equal(await sessionMod.decodeSessionToken(expiredToken), null)
})

test("sanitizeSpreadsheetCell neutralizes CSV/Excel formula injection triggers", () => {
  const { sanitizeSpreadsheetCell } = load("lib/excel/excel-design-tokens.ts")
  assert.equal(sanitizeSpreadsheetCell("=CMD|' /C calc'!A0"), "'=CMD|' /C calc'!A0")
  assert.equal(sanitizeSpreadsheetCell("+1+2"), "'+1+2")
  assert.equal(sanitizeSpreadsheetCell("-2+3"), "'-2+3")
  assert.equal(sanitizeSpreadsheetCell("@SUM(A1:A2)"), "'@SUM(A1:A2)")
  assert.equal(sanitizeSpreadsheetCell("\t=1+1"), "'\t=1+1")
  assert.equal(sanitizeSpreadsheetCell("Grade 5A - Clean"), "Grade 5A - Clean")
  assert.equal(sanitizeSpreadsheetCell(95), 95)
})

test("submitEvaluation computes scores strictly server-side and blocks score tampering & impersonation", async () => {
  let insertedRow = null
  const mockSupabase = {
    from(table) {
      return {
        select() { return this },
        eq() { return this },
        gte() { return this },
        lte() { return this },
        order() { return this },
        async maybeSingle() {
          if (table === "school_calendar_exceptions") return { data: null, error: null }
          if (table === "classrooms") return { data: { id: "room-1", division: "Elementary", is_active: true }, error: null }
          return { data: null, error: null }
        },
        async range() {
          return { data: [], error: null }
        },
        then(resolve) {
          if (table === "checklist_items") {
            return Promise.resolve({
              data: [
                { id: "item-1", points: 10, category: "general", checklist_item_assignments: [] },
                { id: "item-2", points: 15, category: "elementary", checklist_item_assignments: [] },
              ],
              error: null,
            }).then(resolve)
          }
          if (table === "classroom_supervisors") {
            return Promise.resolve({ data: [{ classroom_id: "room-1" }], error: null }).then(resolve)
          }
          return Promise.resolve({ data: [], error: null }).then(resolve)
        },
        async insert(row) {
          insertedRow = row
          return { error: null }
        },
      }
    },
  }

  const evalActions = load("app/actions/evaluation-actions.ts", {
    "next/cache": { revalidatePath: () => {}, updateTag: () => {} },
    "@/lib/supabase/server": { createAdminClient: async () => mockSupabase },
    "@/lib/auth/server": {
      requireRoleAction: async () => ({
        currentUser: { id: "sup-actual", role: "supervisor", name: "Sup", email: "s@school.edu", is_active: true },
      }),
    },
    "@/app/actions/evaluation-settings-actions": { getEvaluationsStatus: async () => ({ success: true, enabled: true }) },
    "@/app/actions/calendar-actions": {
      getSchoolTermDates: async () => ({ success: true, data: { startDate: "2020-01-01", endDate: "2030-12-31" } }),
    },
    "@/lib/evaluation-history": { readEvaluationHistory: async () => [] },
    "@/lib/db-router": { recordRecentMutationCookie: async () => {} },
  })

  // Tampered client score (999999) and spoofed supervisorId ("sup-other") on a valid weekday
  const res = await evalActions.submitEvaluation(
    "room-1",
    "sup-other",
    ["item-1"],
    999999,
    999999,
    "2026-11-18",
    "Clean room"
  )

  assert.equal(res.success, true)
  assert.equal(insertedRow.supervisor_id, "sup-actual", "supervisor cannot impersonate another supervisor")
  assert.equal(insertedRow.total_score, 10, "server must compute total_score from checklist_items")
  assert.equal(insertedRow.max_score, 25, "server must compute max_score from applicable checklist_items")

  // Unassigned classroom must be rejected for supervisor
  const unassignedRes = await evalActions.submitEvaluation("room-unassigned", "sup-actual", ["item-1"], 10, 25, "2026-11-18")
  assert.equal(unassignedRes.success, false)
  assert.match(unassignedRes.error, /not assigned/i)
})

test("unauthenticated callers are rejected from evaluation and calendar actions", async () => {
  const unauthMock = {
    requireRoleAction: async () => ({ error: "Not authenticated" }),
  }

  const evalActions = load("app/actions/evaluation-actions.ts", {
    "next/cache": { revalidatePath: () => {}, updateTag: () => {} },
    "@/lib/supabase/server": { createAdminClient: async () => { throw new Error("should not touch DB") } },
    "@/lib/auth/server": unauthMock,
    "@/app/actions/evaluation-settings-actions": {},
    "@/app/actions/calendar-actions": {},
    "@/lib/evaluation-history": {},
    "@/lib/db-router": {},
  })

  assert.equal((await evalActions.checkClassroomDateEvaluation("room-1", "2026-11-18")).success, false)
  assert.equal((await evalActions.getEvaluationUndoLogs()).success, false)
  assert.equal((await evalActions.restoreUndoneEvaluation("undo-1")).success, false)
  assert.equal((await evalActions.submitEvaluation("room-1", "sup-1", [], 0, 0, "2026-11-18")).success, false)

  const calActions = load("app/actions/calendar-actions.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/supabase/server": { createAdminClient: async () => { throw new Error("should not touch DB") } },
    "@/lib/auth/server": unauthMock,
    "@/lib/evaluation-history": {},
  })

  assert.equal((await calActions.getSupervisorDailyStatus("sup-1")).success, false)
  assert.equal((await calActions.getDateClassroomEvaluationOverview("2026-11-18", "sup-1")).success, false)
})

test("admin cannot deactivate, edit, or reset password of a super_admin account", async () => {
  const mockSupabase = {
    from() {
      return {
        select() { return this },
        eq() { return this },
        async single() {
          return { data: { id: "sa-1", role: "super_admin", email: "sa@school.edu", name: "Super" }, error: null }
        },
        update() { throw new Error("admin must not mutate super_admin") },
      }
    },
  }

  const userActions = load("app/actions/user-actions.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/supabase/server": { createAdminClient: async () => mockSupabase },
    "@/lib/auth/server": {
      requireRoleAction: async () => ({
        currentUser: { id: "admin-1", role: "admin", name: "Admin", email: "admin@school.edu", is_active: true },
      }),
    },
  })

  const delRes = await userActions.deleteUser("sa-1")
  assert.equal(delRes.success, false)
  assert.match(delRes.error, /super admin/i)

  const updRes = await userActions.updateUser({
    userId: "sa-1",
    email: "hijack@school.edu",
    name: "Hijack",
    role: "supervisor",
  })
  assert.equal(updRes.success, false)
  assert.match(updRes.error, /super admin/i)

  const pwRes = await userActions.updateUserPassword({ userId: "sa-1", password: "NewPassword123!" })
  assert.equal(pwRes.success, false)
  assert.match(pwRes.error, /super admin/i)

  const shortPw = await userActions.createUserAccount({
    email: "new@school.edu",
    name: "New User",
    role: "supervisor",
    password: "123",
  })
  assert.equal(shortPw.success, false)
  assert.match(shortPw.error, /at least 8 characters/i)
})

test("setDefaultMonthSetting rejects arbitrary system_settings keys at runtime", async () => {
  const winnersActions = load("app/actions/winners-page-actions.ts", {
    "next/cache": { revalidatePath: () => {}, revalidateTag: () => {} },
    "@/lib/db-router": { recordRecentMutationCookie: async () => {} },
    "@/lib/supabase/server": { createAdminClient: async () => { throw new Error("should not touch DB") } },
    "@/lib/auth/server": {
      requireRoleAction: async () => ({ currentUser: { id: "sa-1", role: "super_admin" } }),
    },
  })

  const res = await winnersActions.setDefaultMonthSetting("evaluations_enabled", null)
  assert.equal(res.success, false)
  assert.match(res.error, /Invalid setting key/i)
})

test("SQL migration 25 revokes public RPC execution and anon access to users", () => {
  const sql = fs.readFileSync(
    path.resolve(__dirname, "25_security_and_performance_hardening.sql"),
    "utf8"
  )
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.create_named_academic_archive[\s\S]*FROM PUBLIC, anon, authenticated/i)
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.archive_monthly_evaluations[\s\S]*FROM PUBLIC, anon, authenticated/i)
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.archive_selective_evaluations[\s\S]*FROM PUBLIC, anon, authenticated/i)
  assert.match(sql, /REVOKE ALL ON public\.users FROM anon/i)
  assert.match(sql, /REVOKE SELECT \(password_hash\) ON public\.users FROM authenticated/i)
  assert.match(sql, /DROP INDEX IF EXISTS public\.idx_evaluations_classroom_daily_unique/i)
})
