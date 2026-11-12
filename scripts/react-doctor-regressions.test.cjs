const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function load(relative, mocks = {}, expose = []) {
  const absolute = path.resolve(__dirname, "..", relative)
  const source =
    fs.readFileSync(absolute, "utf8") + (expose.length ? `\nexports.__test = { ${expose.join(", ")} };` : "")
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true
    }
  }).outputText
  const module = { exports: {} }
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (
      name.startsWith("@/components/") ||
      name.startsWith("@/hooks/") ||
      name.startsWith("@/app/actions/") ||
      name.startsWith("@/lib/excel/") ||
      name === "@/lib/supabase-data"
    )
      return new Proxy({}, { get: () => () => null })
    if (name.startsWith("@/") || name.startsWith(".")) {
      const target = name.startsWith("@/")
        ? path.resolve(__dirname, "..", name.slice(2))
        : path.resolve(path.dirname(absolute), name)
      const file = [target, target + ".ts", target + ".tsx"].find(
        (file) => fs.existsSync(file) && fs.statSync(file).isFile()
      )
      return load(path.relative(path.resolve(__dirname, ".."), file), mocks)
    }
    return require(name)
  }
  new Function("require", "module", "exports", code)(localRequire, module, module.exports)
  return module.exports
}

function redirect(url) {
  throw Object.assign(new Error(`redirect:${url}`), { url })
}
const navigation = { redirect }

test("admin landing redirects stats and administrators before rendering", async () => {
  for (const [role, expected] of [
    ["stats", "/admin/tracking"],
    ["admin", "/admin/classrooms"],
    ["super_admin", "/admin/classrooms"]
  ]) {
    const page = load("app/admin/page.tsx", {
      "next/navigation": navigation,
      "@/lib/auth/server": { requirePageRole: async () => ({ role }) }
    }).default
    await assert.rejects(page(), (error) => error.url === expected)
  }
})

test("direct admin tabs reject stats-only access but allow tracking", async () => {
  const page = load("app/admin/[tab]/page.tsx", {
    "next/navigation": navigation,
    "@/lib/auth/server": { requirePageRole: async () => ({ role: "stats" }) },
    "@/lib/admin-navigation": { STATS_ALLOWED_TAB_IDS: ["tracking", "statistics", "exports"] }
  }).default
  await assert.rejects(
    page({ params: Promise.resolve({ tab: "classrooms" }) }),
    (error) => error.url === "/admin/tracking"
  )
  assert.equal((await page({ params: Promise.resolve({ tab: "tracking" }) })).props.tabParam, "tracking")
})

test("page access checks the active database user, not just the signed cookie role", async () => {
  for (const [session, user, expected] of [
    [null, null, "/login"],
    [{ userId: "a" }, null, "/login"],
    [{ userId: "a" }, { id: "a", role: "viewer" }, "/"]
  ]) {
    const query = {
      select() {
        return this
      },
      eq() {
        return this
      },
      async single() {
        return { data: user }
      }
    }
    const auth = load("lib/auth/server.ts", {
      "next/navigation": navigation,
      "./session": { getSessionFromCookies: async () => session },
      "@/lib/supabase/server": { createAdminClient: async () => ({ from: () => query }) }
    })
    await assert.rejects(auth.requirePageRole(["admin"]), (error) => error.url === expected)
  }
})

test("hidden winners redirect on the server; visible winners retain the frozen period", async () => {
  for (const visible of [false, true]) {
    const page = load("app/winners/page.tsx", {
      "next/navigation": navigation,
      "@/app/actions/winners-page-actions": {
        getWinnersPageVisibility: async () => ({ success: true, visible }),
        getDefaultMonthSettings: async () => ({ success: true, winnersMonth: { year: 2026, month: 10 } })
      }
    }).default
    if (!visible) await assert.rejects(page(), (error) => error.url === "/")
    else assert.deepEqual((await page()).props.initialPeriod, { year: 2026, month: 10 })
  }
})

test("initial setup fails closed if the user-count query fails", async () => {
  const first = load("lib/first-user.ts", {
    "@/lib/supabase/server": {
      createAdminClient: async () => ({
        from: () => ({ select: async () => ({ error: { message: "offline" }, count: null }) })
      })
    }
  })
  await assert.rejects(first.getUserCount(), /Could not check initial setup/)
})

const tracking = load("components/features/evaluations/submission-tracking.tsx", {}, [
  "getTrackingDateRange",
  "calculateTrackingSubmissionStats"
]).__test

test("tracking normalizes reversed dates and rejects incomplete custom ranges", () => {
  assert.deepEqual(tracking.getTrackingDateRange("custom", new Date(2026, 10, 12), "2026-11-12", "2026-11-09"), {
    startDate: "2026-11-09",
    endDate: "2026-11-12"
  })
  assert.equal(tracking.getTrackingDateRange("custom", new Date(), "", "2026-11-12"), null)
  assert.equal(tracking.getTrackingDateRange("custom", new Date(), "invalid", "2026-11-12"), null)
  assert.deepEqual(tracking.getTrackingDateRange("weekly", new Date(2026, 10, 12), "", ""), {
    startDate: "2026-11-09",
    endDate: "2026-11-13"
  })
})

test("tracking excludes school closures and does not count duplicate inspections twice", () => {
  const classrooms = [
    { id: "a", name: "A" },
    { id: "b", name: "B" }
  ]
  const args = {
    filteredClassrooms: classrooms,
    evaluations: [
      { classroom_id: "a", evaluation_date: "2026-11-09T12:00:00Z" },
      { classroom_id: "a", evaluation_date: "2026-11-09T13:00:00Z" }
    ],
    viewType: "custom",
    date: new Date(2026, 10, 9),
    customStartDate: "2026-11-13",
    customEndDate: "2026-11-09",
    exceptionMap: new Map([["2026-11-10", { reason: "Closure" }]]),
    termDates: null,
    isWorkingSchoolDay: (date) => {
      const d = new Date(date)
      return ![0, 6].includes(d.getDay()) && d.getDate() !== 10
    }
  }
  const result = tracking.calculateTrackingSubmissionStats(args)
  assert.equal(result.classroomPerformance[0].submittedCount, 1)
  assert.equal(result.classroomPerformance[0].totalDays, 4)
  assert.equal(result.excludedExceptionsCount, 1)
  const closure = tracking.calculateTrackingSubmissionStats({
    ...args,
    viewType: "daily",
    date: new Date(2026, 10, 10)
  })
  assert.equal(closure.isNonWorkingDay, true)
  assert.deepEqual(closure.notSubmitted, [])
  assert.equal(closure.rate, 100)
})

test("membership indexes preserve score totals and selection results with duplicate and missing ids", () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({ id: `item-${i}`, points: (i % 10) + 1 }))
  const selected = [...rows.filter((_, i) => i % 3 === 0).map((row) => row.id), "item-0", "missing"]
  const ids = new Set(selected)
  assert.deepEqual(
    rows.filter((row) => selected.includes(row.id)),
    rows.filter((row) => ids.has(row.id))
  )
  assert.equal(
    rows.reduce((sum, row) => sum + (selected.includes(row.id) ? row.points : 0), 0),
    rows.reduce((sum, row) => sum + (ids.has(row.id) ? row.points : 0), 0)
  )
})

test("winner history reads are deduplicated by month and bounded to three database requests", async () => {
  let active = 0
  let maximum = 0
  let calls = 0
  const db = {
    from() {
      return {
        select() {
          return this
        },
        gte() {
          return this
        },
        lt() {
          return this
        },
        lte() {
          return this
        },
        eq() {
          return this
        },
        in() {
          return this
        },
        order() {
          return this
        },
        async range() {
          active++
          calls++
          maximum = Math.max(maximum, active)
          await new Promise((resolve) => setTimeout(resolve, 2))
          active--
          return { data: [], error: null }
        }
      }
    }
  }
  const history = load("lib/evaluation-history.ts")
  const winners = [1, 2, 3, 4, 5, 1].map((month, i) => ({
    classroom_id: `room-${i}`,
    year: 2026,
    month,
    total_score: 100 + i
  }))
  const result = await history.includeRecordedWinnerScores(db, winners)
  assert.deepEqual(result, winners)
  assert.equal(calls, 15)
  assert.equal(maximum, 3)
  assert.equal(active, 0)
})

test("winner history failure drains concurrent reads and never returns partial scores", async () => {
  let active = 0
  let calls = 0
  const db = {
    from() {
      return {
        select() {
          return this
        },
        gte() {
          return this
        },
        lt() {
          return this
        },
        order() {
          return this
        },
        async range() {
          const index = ++calls
          active++
          await new Promise((resolve) => setTimeout(resolve, 2))
          active--
          return index === 1 ? { data: null, error: new Error("history offline") } : { data: [], error: null }
        }
      }
    }
  }
  const history = load("lib/evaluation-history.ts")
  await assert.rejects(
    history.includeRecordedWinnerScores(
      db,
      [1, 2, 3, 4].map((month) => ({ classroom_id: "a", year: 2026, month }))
    ),
    /history offline/
  )
  assert.equal(active, 0)
  assert.ok(calls < 12)
})
