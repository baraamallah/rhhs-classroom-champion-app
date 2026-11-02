const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

// Load the pure TypeScript modules without adding a test-runner dependency.
const modules = new Map()
function load(file) {
  const absolute = path.resolve(__dirname, "..", file)
  if (modules.has(absolute)) return modules.get(absolute)
  const loadedModule = { exports: {} }
  modules.set(absolute, loadedModule.exports)
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const localRequire = (name) => name.startsWith(".")
    ? load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(absolute), `${name}.ts`)))
    : require(name)
  new Function("require", "module", "exports", code)(localRequire, loadedModule, loadedModule.exports)
  return loadedModule.exports
}
const { getMonthPeriod, getCurrentMonthPeriod } = load("lib/month-period.ts")
const { readEvaluationHistory, readMonthlyRankings, includeRecordedWinnerScores } = load("lib/evaluation-history.ts")
const { archiveCompletedMonths } = load("lib/monthly-archive.ts")
const { resolveCompetitionMonth, resolveLeaderboardScope } = load("lib/display-period.ts")

function evaluation(id, date, total = 10) {
  return {
    id, classroom_id: "room", supervisor_id: "supervisor", evaluation_date: date,
    total_score: total, max_score: 20, items: {},
    classrooms: { name: "Class 5", grade: "5", division: "Elementary" },
    classroom_name: "Class 5", classroom_grade: "5", classroom_division: "Elementary",
  }
}

function database(initial = {}) {
  const tables = { evaluations: [], archive_evaluations: [], academic_archive_evaluations: [], ...initial }
  const calls = []
  const client = {
    tables, calls, failTable: null, failRPC: false,
    from(table) {
      const predicates = []
      let start = 0, end = Infinity
      const query = {
        select() { return query }, order() { return query },
        gte(key, value) { predicates.push((row) => row[key] >= value); return query },
        lt(key, value) { predicates.push((row) => row[key] < value); return query },
        lte(key, value) { predicates.push((row) => row[key] <= value); return query },
        eq(key, value) { predicates.push((row) => row[key] === value); return query },
        in(key, values) { predicates.push((row) => values.includes(row[key])); return query },
        range(a, b) { start = a; end = b + 1; return query },
        limit(count) { end = count; return query },
        then(resolve, reject) {
          calls.push(table)
          const result = client.failTable === table
            ? { data: null, error: { message: "database unavailable" } }
            : { data: tables[table].filter((row) => predicates.every((predicate) => predicate(row))).slice(start, end), error: null }
          return Promise.resolve(result).then(resolve, reject)
        },
      }
      return query
    },
    async rpc(name, args) {
      assert.equal(name, "archive_selective_evaluations")
      if (client.failRPC) return { data: null, error: new Error("archive unavailable") }
      const ids = new Set(args.p_evaluation_ids)
      const moved = tables.evaluations.filter((row) => ids.has(row.id))
      tables.archive_evaluations.push(...moved.map((row) => ({ ...row, archived_at: args.p_archived_at })))
      tables.evaluations = tables.evaluations.filter((row) => !ids.has(row.id))
      return { data: { success: true, archived_count: moved.length }, error: null }
    },
  }
  return client
}

test("monthly reset occurs at Beirut midnight, including the year rollover", () => {
  assert.equal(getCurrentMonthPeriod(new Date("2026-12-31T21:59:59.999Z")).key, "2026-12")
  assert.equal(getCurrentMonthPeriod(new Date("2026-12-31T22:00:00.000Z")).key, "2027-01")
  assert.equal(getMonthPeriod(2026, 12).end, "2026-12-31T22:00:00.000Z")
})

test("month boundaries handle leap years and daylight saving time", () => {
  assert.equal(getMonthPeriod(2024, 2).end, "2024-02-29T22:00:00.000Z")
  assert.equal(getMonthPeriod(2026, 3).start, "2026-02-28T22:00:00.000Z")
  assert.equal(getMonthPeriod(2026, 3).end, "2026-03-31T21:00:00.000Z")
  assert.throws(() => getMonthPeriod(2026, 13), /Invalid/)
})

test("winner totals combine all storage sources once and use evaluation month", async () => {
  const db = database({
    evaluations: [evaluation("a", "2026-10-03T12:00:00Z", "7")],
    archive_evaluations: [evaluation("a", "2026-10-03T12:00:00Z", 7), evaluation("b", "2026-10-04T12:00:00Z", 11)],
    academic_archive_evaluations: [evaluation("b", "2026-10-04T12:00:00Z", 11), evaluation("c", "2026-10-05T12:00:00Z", 13), evaluation("old", "2026-09-05T12:00:00Z", 100)],
  })
  const rankings = await readMonthlyRankings(db, "Elementary", 2026, 10)
  assert.equal(rankings[0].totalScore, 31)
  assert.equal(rankings[0].evaluationCount, 3)
  assert.equal((await readMonthlyRankings(db, "High School", 2026, 10)).length, 0)
})

test("previous-month winners retain the full total after every evaluation is archived", async () => {
  const db = database({ archive_evaluations: [evaluation("a", "2026-10-03T12:00:00Z", 25), evaluation("b", "2026-10-04T12:00:00Z", 30)] })
  const winners = await includeRecordedWinnerScores(db, [{ classroom_id: "room", year: 2026, month: 10, total_score: 25 }])
  assert.equal(winners[0].total_score, 55)
  assert.equal(winners[0].evaluation_count, 2)
  assert.equal((await readMonthlyRankings(db, "Elementary", 2026, 11)).length, 0)
})

test("history is paginated beyond 1,000 records", async () => {
  const db = database({ archive_evaluations: Array.from({ length: 1005 }, (_, index) => evaluation(String(index), "2026-10-03T12:00:00Z", 2)) })
  const result = await readMonthlyRankings(db, "Elementary", 2026, 10)
  assert.equal(result[0].totalScore, 2010)
  assert.equal(result[0].evaluationCount, 1005)
})

test("archive checks move all completed months even when current-month records exist", async () => {
  const db = database({ evaluations: [evaluation("old", "2026-09-03T12:00:00Z"), evaluation("last", "2026-10-31T21:59:59.999Z"), evaluation("new", "2026-10-31T22:00:00.000Z"), evaluation("current", "2026-11-02T12:00:00Z")] })
  const result = await archiveCompletedMonths(db, new Date("2026-11-02T12:00:00Z"))
  assert.equal(result.count, 2)
  assert.deepEqual(db.tables.evaluations.map((row) => row.id), ["new", "current"])
  assert.equal((await archiveCompletedMonths(db, new Date("2026-11-02T12:00:00Z"))).count, 0)
})

test("monthly archiving handles multiple batches without losing evaluations", async () => {
  const db = database({ evaluations: Array.from({ length: 405 }, (_, index) => evaluation(String(index), "2026-10-03T12:00:00Z")) })
  assert.equal((await archiveCompletedMonths(db, new Date("2026-11-02T12:00:00Z"))).count, 405)
  assert.equal(db.tables.archive_evaluations.length, 405)
  assert.equal(db.tables.evaluations.length, 0)
})

test("archive failure preserves live records; history errors never return partial winner totals", async () => {
  const db = database({ evaluations: [evaluation("old", "2026-10-03T12:00:00Z")] })
  db.failRPC = true
  await assert.rejects(archiveCompletedMonths(db, new Date("2026-11-02T12:00:00Z")), /archive unavailable/)
  assert.equal(db.tables.evaluations.length, 1)
  db.failTable = "archive_evaluations"
  await assert.rejects(readMonthlyRankings(db, "Elementary", 2026, 10), /Unable to read/)
})

test("archived evaluations participate in the daily lock lookup", async () => {
  const db = database({ archive_evaluations: [evaluation("locked", "2026-10-03T12:00:00Z")] })
  const records = await readEvaluationHistory(db, { classroomId: "room", start: "2026-10-03T00:00:00Z", end: "2026-10-04T00:00:00Z", includeArchives: true })
  assert.equal(records[0].id, "locked")
  assert.equal(records[0].is_archived, true)
})

test("October freeze wins over the November clock for both admin and public winners", () => {
  const now = new Date("2026-11-02T12:00:00Z")
  const october = { year: 2026, month: 10 }
  assert.deepEqual(resolveCompetitionMonth(october, null, now), october)
  assert.deepEqual(resolveCompetitionMonth(null, october, now), october)
  assert.deepEqual(resolveCompetitionMonth(null, null, now), { year: 2026, month: 11 })
  assert.deepEqual(resolveCompetitionMonth(october, { year: 2026, month: 9 }, now), october)
})

test("monthly freeze reads October archives while all-time includes November too", async () => {
  const db = database({
    evaluations: [evaluation("november", "2026-11-02T12:00:00Z", 50)],
    archive_evaluations: [evaluation("october", "2026-10-15T12:00:00Z", 30)],
  })
  const october = { year: 2026, month: 10 }
  const current = { year: 2026, month: 11 }
  const frozen = await readEvaluationHistory(db, resolveLeaderboardScope(true, october, current))
  assert.deepEqual(frozen.map((row) => row.id), ["october"])
  const allTime = await readEvaluationHistory(db, resolveLeaderboardScope(false, october, current))
  assert.equal(allTime.reduce((sum, row) => sum + row.total_score, 0), 80)
  const unfrozen = await readEvaluationHistory(db, resolveLeaderboardScope(true, null, current))
  assert.deepEqual(unfrozen.map((row) => row.id), ["november"])
})

test("separate October and November declarations receive their own archived totals", async () => {
  const db = database({
    evaluations: [evaluation("november", "2026-11-02T12:00:00Z", 50)],
    archive_evaluations: [evaluation("october", "2026-10-15T12:00:00Z", 30)],
  })
  const winners = await includeRecordedWinnerScores(db, [
    { classroom_id: "room", year: 2026, month: 10, total_score: 0 },
    { classroom_id: "room", year: 2026, month: 11, total_score: 0 },
  ])
  assert.equal(winners[0].total_score, 30)
  assert.equal(winners[1].total_score, 50)
})
