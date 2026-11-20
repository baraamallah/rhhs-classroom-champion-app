"use server"

import { after } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireRoleAction } from "@/lib/auth/server"
import { readEvaluationHistory } from "@/lib/evaluation-history"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import { sanitizeSpreadsheetCell } from "@/lib/excel/excel-design-tokens"
import { buildWeeklyRankingsWorkbook } from "@/lib/excel/weekly-rankings-builder"
import { buildMasterExcelWorkbook } from "@/lib/excel/master-export-builder"
import { format, startOfWeek, addDays } from "date-fns"

async function requireAdmin() {
  return requireRoleAction(["super_admin", "admin", "stats"], {
    clearOnInvalid: true,
    deniedMessage: "Unauthorized: Admin access required",
  })
}

interface ExportData {
  filename: string
  content: string
}

interface ExcelSheet {
  name: string
  headers: string[]
  rows: (string | number)[][]
  stats?: { label: string; value: string | number }[]
}

function sanitizeRow(row: (string | number)[]): (string | number)[] {
  return row.map((cell) => (typeof cell === "string" ? sanitizeSpreadsheetCell(cell) : cell))
}

function sanitizeEvaluationForExport<T extends Record<string, any>>(ev: T): T {
  return {
    ...ev,
    notes: typeof ev.notes === "string" ? sanitizeSpreadsheetCell(ev.notes) : ev.notes,
    classrooms: ev.classrooms
      ? {
          ...ev.classrooms,
          name: sanitizeSpreadsheetCell(ev.classrooms.name),
          grade: sanitizeSpreadsheetCell(ev.classrooms.grade),
        }
      : ev.classrooms,
    users: ev.users
      ? {
          ...ev.users,
          name: sanitizeSpreadsheetCell(ev.users.name),
          email: sanitizeSpreadsheetCell(ev.users.email),
        }
      : ev.users,
  }
}

export async function exportDataAsExcel() {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const DIVISIONS = DIVISION_OPTIONS.map((opt) => opt.value)
    const MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    // Fetch all required export data concurrently; NEVER select password_hash from users
    const [
      { data: evaluations },
      { data: archivedEvals },
      { data: classrooms },
      { data: supervisors },
      { data: winners },
    ] = await Promise.all([
      supabase
        .from("evaluations")
        .select(`*, classrooms:classroom_id (name, grade, division), users:supervisor_id (name, email)`)
        .order("evaluation_date", { ascending: false }),
      supabase.from("archive_evaluations").select("*").order("archived_at", { ascending: false }),
      supabase.from("classrooms").select("id, name, grade, division, description, is_active, created_at").order("name", { ascending: true }),
      supabase
        .from("users")
        .select("id, name, email, role, is_active, created_at")
        .eq("role", "supervisor")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("monthly_winners")
        .select(`*, classrooms:classroom_id (name, grade, division), declared_by_user:declared_by (name, email)`)
        .order("year", { ascending: false })
        .order("month", { ascending: false }),
    ])

    const safeEvaluations = (evaluations || []).map(sanitizeEvaluationForExport)
    const safeClassrooms = (classrooms || []).map((c) => ({
      ...c,
      name: sanitizeSpreadsheetCell(c.name),
      grade: sanitizeSpreadsheetCell(c.grade),
    }))
    const safeSupervisors = (supervisors || []).map((s) => ({
      ...s,
      name: sanitizeSpreadsheetCell(s.name),
      email: sanitizeSpreadsheetCell(s.email),
    }))
    const safeWinners = (winners || []).map((w) => ({
      ...w,
      notes: typeof w.notes === "string" ? sanitizeSpreadsheetCell(w.notes) : w.notes,
      classrooms: w.classrooms
        ? {
            ...w.classrooms,
            name: sanitizeSpreadsheetCell(w.classrooms.name),
            grade: sanitizeSpreadsheetCell(w.classrooms.grade),
          }
        : w.classrooms,
      declared_by_user: w.declared_by_user
        ? {
            ...w.declared_by_user,
            name: sanitizeSpreadsheetCell(w.declared_by_user.name),
            email: sanitizeSpreadsheetCell(w.declared_by_user.email),
          }
        : w.declared_by_user,
    }))

    const fileName = `RHHS-Classroom-Champion-Master-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`

    // Try styled ExcelJS workbook first; omit redundant `sheets` payload when base64 succeeds
    try {
      const styledWb = await buildMasterExcelWorkbook({
        evaluations: safeEvaluations,
        archivedEvals: archivedEvals || [],
        classrooms: safeClassrooms,
        supervisors: safeSupervisors,
        winners: safeWinners,
      })
      const buffer = await styledWb.xlsx.writeBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      return { success: true, base64, fileName }
    } catch (styledErr) {
      after(() => {
        console.warn("[exportDataAsExcel] Could not generate styled ExcelJS buffer, fallback to sheets:", styledErr)
      })
    }

    // Fallback plain sheet compilation only if ExcelJS workbook generation failed
    const sheets: ExcelSheet[] = []
    const totalEvaluations = safeEvaluations.length + (archivedEvals?.length || 0)
    const totalPoints = safeEvaluations.reduce((sum, e) => sum + e.total_score, 0)
    const avgScore = safeEvaluations.length > 0 ? Math.round(totalPoints / safeEvaluations.length) : 0

    // Pre-index evaluations and winners in O(N) maps
    const evalsByDivision = new Map<string, typeof safeEvaluations>()
    const evalsByClassroom = new Map<string, typeof safeEvaluations>()
    const evalsBySupervisor = new Map<string, typeof safeEvaluations>()
    for (const ev of safeEvaluations) {
      const div = ev.classrooms?.division
      if (div) {
        const list = evalsByDivision.get(div) || []
        list.push(ev)
        evalsByDivision.set(div, list)
      }
      const cList = evalsByClassroom.get(ev.classroom_id) || []
      cList.push(ev)
      evalsByClassroom.set(ev.classroom_id, cList)

      const sList = evalsBySupervisor.get(ev.supervisor_id) || []
      sList.push(ev)
      evalsBySupervisor.set(ev.supervisor_id, sList)
    }

    const classroomsByDivision = new Map<string, number>()
    for (const c of safeClassrooms) {
      if (c.division) classroomsByDivision.set(c.division, (classroomsByDivision.get(c.division) || 0) + 1)
    }

    const winnersByDivision = new Map<string, number>()
    const winsByClassroom = new Map<string, number>()
    for (const w of safeWinners) {
      if (w.division) winnersByDivision.set(w.division, (winnersByDivision.get(w.division) || 0) + 1)
      winsByClassroom.set(w.classroom_id, (winsByClassroom.get(w.classroom_id) || 0) + 1)
    }

    const divisionStats = DIVISIONS.map((division) => {
      const divEvals = evalsByDivision.get(division) || []
      const divPoints = divEvals.reduce((sum, e) => sum + e.total_score, 0)
      return {
        division,
        classrooms: classroomsByDivision.get(division) || 0,
        evaluations: divEvals.length,
        totalPoints: divPoints,
        avgScore: divEvals.length > 0 ? Math.round(divPoints / divEvals.length) : 0,
        winners: winnersByDivision.get(division) || 0,
      }
    })

    sheets.push({
      name: "Summary Dashboard",
      headers: ["Metric", "Value", "Description"],
      rows: [
        ["Export Date", new Date().toLocaleDateString(), "Date this report was generated"],
        ["Export Time", new Date().toLocaleTimeString(), "Time this report was generated"],
        ["", "", ""],
        ["=== OVERVIEW ===", "", ""],
        ["Total Classrooms", safeClassrooms.length, "Number of registered classrooms"],
        ["Active Supervisors", safeSupervisors.length, "Number of active supervisors"],
        ["Total Evaluations", totalEvaluations, "Active + Archived evaluations"],
        ["Active Evaluations", safeEvaluations.length, "Current active evaluations"],
        ["Archived Evaluations", archivedEvals?.length || 0, "Evaluations moved to archive"],
        ["Monthly Winners Declared", safeWinners.length, "Total winners declared"],
        ["", "", ""],
        ["=== PERFORMANCE ===", "", ""],
        ["Average Score", avgScore, "Average score across all evaluations"],
        ["Total Points Awarded", totalPoints, "Sum of all evaluation scores"],
        [
          "Highest Single Score",
          safeEvaluations.length > 0 ? Math.max(...safeEvaluations.map((e) => e.total_score)) : 0,
          "Highest score in a single evaluation",
        ],
        [
          "Lowest Single Score",
          safeEvaluations.length > 0 ? Math.min(...safeEvaluations.map((e) => e.total_score)) : 0,
          "Lowest score in a single evaluation",
        ],
      ],
      stats: [
        { label: "Report Generated", value: new Date().toISOString() },
        { label: "Generated By", value: "Admin Export" },
      ],
    })

    sheets.push({
      name: "Division Statistics",
      headers: ["Division", "Classrooms", "Evaluations", "Total Points", "Avg Score", "Winners Declared", "Performance Rating"],
      rows: divisionStats.map((d) =>
        sanitizeRow([
          getDivisionDisplayName(d.division),
          d.classrooms,
          d.evaluations,
          d.totalPoints,
          d.avgScore,
          d.winners,
          d.avgScore >= 90 ? "Excellent" : d.avgScore >= 75 ? "Good" : d.avgScore >= 60 ? "Fair" : "Needs Improvement",
        ])
      ),
      stats: [
        { label: "Total Divisions", value: DIVISIONS.length },
        {
          label: "Best Performing",
          value: [...divisionStats].sort((a, b) => b.avgScore - a.avgScore)[0]?.division || "N/A",
        },
      ],
    })

    if (safeEvaluations.length > 0) {
      sheets.push({
        name: "Active Evaluations",
        headers: ["ID", "Date", "Classroom", "Grade", "Division", "Supervisor", "Score", "Max Score", "Percentage", "Notes"],
        rows: safeEvaluations.map((e) =>
          sanitizeRow([
            e.id,
            new Date(e.evaluation_date).toLocaleDateString(),
            e.classrooms?.name || "Unknown",
            e.classrooms?.grade || "N/A",
            getDivisionDisplayName(e.classrooms?.division) || "N/A",
            e.users?.name || "Unknown",
            e.total_score,
            e.max_score,
            `${e.max_score > 0 ? Math.round((e.total_score / e.max_score) * 100) : 0}%`,
            e.notes || "",
          ])
        ),
        stats: [
          { label: "Total Evaluations", value: safeEvaluations.length },
          { label: "Average Score", value: avgScore },
          { label: "Total Points", value: totalPoints },
        ],
      })
    }

    const monthlyData: { [key: string]: { count: number; total: number; avg: number } } = {}
    safeEvaluations.forEach((e) => {
      const date = new Date(e.evaluation_date)
      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
      if (!monthlyData[key]) monthlyData[key] = { count: 0, total: 0, avg: 0 }
      monthlyData[key].count++
      monthlyData[key].total += e.total_score
    })
    Object.keys(monthlyData).forEach((key) => {
      monthlyData[key].avg = Math.round(monthlyData[key].total / monthlyData[key].count)
    })

    sheets.push({
      name: "Monthly Breakdown",
      headers: ["Month", "Evaluations Count", "Total Points", "Average Score", "Trend"],
      rows: Object.entries(monthlyData)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([month, data], index, arr) => {
          const prevAvg = index < arr.length - 1 ? arr[index + 1][1].avg : data.avg
          const trend = data.avg > prevAvg ? "↑ Up" : data.avg < prevAvg ? "↓ Down" : "→ Stable"
          return [month, data.count, data.total, data.avg, trend]
        }),
      stats: [
        { label: "Months with Data", value: Object.keys(monthlyData).length },
        { label: "Best Month", value: Object.entries(monthlyData).sort((a, b) => b[1].avg - a[1].avg)[0]?.[0] || "N/A" },
      ],
    })

    if (safeClassrooms.length > 0) {
      const classroomStats = safeClassrooms
        .map((c) => {
          const classEvals = evalsByClassroom.get(c.id) || []
          const totalScore = classEvals.reduce((sum, e) => sum + e.total_score, 0)
          const classAvg = classEvals.length > 0 ? Math.round(totalScore / classEvals.length) : 0
          return {
            ...c,
            evalCount: classEvals.length,
            totalScore,
            avgScore: classAvg,
            winCount: winsByClassroom.get(c.id) || 0,
          }
        })
        .sort((a, b) => b.totalScore - a.totalScore)

      sheets.push({
        name: "Classroom Rankings",
        headers: ["Rank", "Classroom", "Grade", "Division", "Evaluations", "Total Score", "Avg Score", "Wins", "Status"],
        rows: classroomStats.map((c, index) =>
          sanitizeRow([
            index + 1,
            c.name,
            c.grade,
            c.division || "N/A",
            c.evalCount,
            c.totalScore,
            c.avgScore,
            c.winCount,
            c.is_active ? "Active" : "Inactive",
          ])
        ),
        stats: [
          { label: "Total Classrooms", value: safeClassrooms.length },
          { label: "Active Classrooms", value: safeClassrooms.filter((c) => c.is_active).length },
          { label: "Top Performer", value: classroomStats[0]?.name || "N/A" },
        ],
      })
    }

    if (safeSupervisors.length > 0) {
      const supervisorStats = safeSupervisors
        .map((s) => {
          const supEvals = evalsBySupervisor.get(s.id) || []
          return {
            ...s,
            evalCount: supEvals.length,
            avgScore:
              supEvals.length > 0
                ? Math.round(supEvals.reduce((sum, e) => sum + e.total_score, 0) / supEvals.length)
                : 0,
          }
        })
        .sort((a, b) => b.evalCount - a.evalCount)

      sheets.push({
        name: "Supervisor Performance",
        headers: ["Name", "Email", "Evaluations Completed", "Avg Score Given", "Status"],
        rows: supervisorStats.map((s) => sanitizeRow([s.name, s.email, s.evalCount, s.avgScore, "Active"])),
        stats: [
          { label: "Total Supervisors", value: safeSupervisors.length },
          { label: "Most Active", value: supervisorStats[0]?.name || "N/A" },
          { label: "Total Evaluations", value: supervisorStats.reduce((sum, s) => sum + s.evalCount, 0) },
        ],
      })
    }

    if (safeWinners.length > 0) {
      sheets.push({
        name: "Monthly Winners",
        headers: ["Month", "Year", "Division", "Winner Classroom", "Grade", "Total Score", "Avg Score", "Evaluations", "Declared By", "Declared Date"],
        rows: safeWinners.map((w) =>
          sanitizeRow([
            MONTHS[w.month - 1],
            w.year,
            w.division,
            w.classrooms?.name || "Unknown",
            w.classrooms?.grade || "N/A",
            w.total_score,
            w.average_score.toFixed(2),
            w.evaluation_count,
            w.declared_by_user?.name || "Unknown",
            new Date(w.declared_at).toLocaleDateString(),
          ])
        ),
        stats: [
          { label: "Total Winners", value: safeWinners.length },
          { label: "Divisions with Winners", value: new Set(safeWinners.map((w) => w.division)).size },
        ],
      })
    }

    if (archivedEvals && archivedEvals.length > 0) {
      sheets.push({
        name: "Archived Evaluations",
        headers: ["ID", "Original Date", "Archived Date", "Score", "Max Score", "Percentage"],
        rows: archivedEvals.map((e) => [
          e.id,
          new Date(e.evaluation_date).toLocaleDateString(),
          e.archived_at ? new Date(e.archived_at).toLocaleDateString() : "N/A",
          e.total_score,
          e.max_score,
          `${e.max_score > 0 ? Math.round((e.total_score / e.max_score) * 100) : 0}%`,
        ]),
        stats: [{ label: "Total Archived", value: archivedEvals.length }],
      })
    }

    return { success: true, sheets, fileName }
  } catch (dbError: any) {
    console.error("[exportDataAsExcel] Error:", dbError)
    return { success: false, error: `Failed to export data: ${dbError.message || "Unknown error"}` }
  }
}

export async function exportWeeklyGreenReport({
  startDate,
  weekPreset,
}: {
  startDate?: string
  endDate?: string
  weekPreset?: "current-week" | "last-week" | "custom"
} = {}) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const now = new Date()
    let startD: Date

    if (weekPreset === "last-week") {
      const prevWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startD = startOfWeek(prevWeekDate, { weekStartsOn: 1 })
    } else if (weekPreset === "custom" && startDate) {
      const [y, m, d] = startDate.split("-").map(Number)
      startD = startOfWeek(new Date(y, m - 1, d), { weekStartsOn: 1 })
    } else {
      startD = startOfWeek(now, { weekStartsOn: 1 })
    }

    const days = Array.from({ length: 5 }, (_, i) => addDays(startD, i))
    const startStr = format(days[0], "yyyy-MM-dd")
    const endStr = format(days[4], "yyyy-MM-dd")

    const [history, { data: classrooms, error: classErr }] = await Promise.all([
      readEvaluationHistory(supabase, {
        start: `${startStr}T00:00:00.000Z`,
        end: `${endStr}T23:59:59.999Z`,
        endInclusive: true,
        includeArchives: true,
        includeDetails: false,
        parallelTables: true,
      }),
      supabase
        .from("classrooms")
        .select("id, name, grade, division, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ])

    if (classErr) throw new Error(classErr.message)

    const safeClassrooms = (classrooms || []).map((c) => ({
      ...c,
      name: sanitizeSpreadsheetCell(c.name),
      grade: sanitizeSpreadsheetCell(c.grade),
    }))

    const workbook = await buildWeeklyRankingsWorkbook({
      evaluations: history.map((evaluation) => ({
        ...evaluation,
        classrooms: evaluation.classroom
          ? {
              ...evaluation.classroom,
              name: sanitizeSpreadsheetCell(evaluation.classroom.name),
              grade: sanitizeSpreadsheetCell(evaluation.classroom.grade),
            }
          : undefined,
      })) as any,
      classrooms: safeClassrooms as any,
      workDays: days,
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const fileName = `RHHS_Green_App_Rankings_${startStr}_to_${endStr}_Shaded.xlsx`

    return {
      success: true,
      base64,
      fileName,
    }
  } catch (err: any) {
    console.error("[exportWeeklyGreenReport] Error:", err)
    return { success: false, error: err.message || "Failed to generate weekly green report" }
  }
}

export async function exportAllDataAsZip() {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()
  const exportFiles: ExportData[] = []

  try {
    // Fetch all 6 tables concurrently (explicit columns on users — never select password_hash)
    const [
      { data: evaluations, error: evalError },
      { data: archivedEvals, error: archEvalError },
      { data: classrooms, error: classError },
      { data: assignments },
      { data: supervisors, error: supError },
      { data: winners, error: winnersError },
    ] = await Promise.all([
      supabase
        .from("evaluations")
        .select(`*, classrooms:classroom_id (name, grade, division), users:supervisor_id (name, email)`)
        .order("evaluation_date", { ascending: false }),
      supabase.from("archive_evaluations").select("*").order("archived_at", { ascending: false }),
      supabase
        .from("classrooms")
        .select("id, name, grade, division, description, is_active, created_at")
        .order("name", { ascending: true }),
      supabase.from("classroom_supervisors").select(`classroom_id, users:supervisor_id (name, email)`),
      supabase
        .from("users")
        .select("id, name, email, role, is_active, created_at")
        .eq("role", "supervisor")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("monthly_winners")
        .select(`*, classrooms:classroom_id (name, grade, division), declared_by_user:declared_by (name, email)`)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("division", { ascending: true }),
    ])

    if (!evalError && evaluations) {
      let evalContent = "ACTIVE EVALUATIONS\n"
      evalContent += "=".repeat(80) + "\n\n"
      evalContent += `Total Evaluations: ${evaluations.length}\n`
      evalContent += `Export Date: ${new Date().toISOString()}\n\n`

      evaluations.forEach((evaluation, index) => {
        evalContent += `\n[Evaluation ${index + 1}]\n`
        evalContent += `- ID: ${evaluation.id}\n`
        evalContent += `- Date: ${new Date(evaluation.evaluation_date).toLocaleString()}\n`
        evalContent += `- Classroom: ${evaluation.classrooms?.name || "Unknown"} (Grade ${evaluation.classrooms?.grade || "N/A"})\n`
        evalContent += `- Division: ${evaluation.classrooms?.division || "N/A"}\n`
        evalContent += `- Supervisor: ${evaluation.users?.name || "Unknown"} (${evaluation.users?.email || "N/A"})\n`
        evalContent += `- Score: ${evaluation.total_score}/${evaluation.max_score}\n`
        evalContent += `- Items Checked: ${Object.keys(evaluation.items || {}).filter((k) => evaluation.items[k]).length}\n`
        if (evaluation.notes) {
          evalContent += `- Notes: ${evaluation.notes}\n`
        }
        evalContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "01_active_evaluations.txt", content: evalContent })
    }

    if (!archEvalError && archivedEvals) {
      let archContent = "ARCHIVED EVALUATIONS\n"
      archContent += "=".repeat(80) + "\n\n"
      archContent += `Total Archived: ${archivedEvals.length}\n`
      archContent += `Export Date: ${new Date().toISOString()}\n\n`

      archivedEvals.forEach((evaluation, index) => {
        archContent += `\n[Archived Evaluation ${index + 1}]\n`
        archContent += `- ID: ${evaluation.id}\n`
        archContent += `- Original Date: ${new Date(evaluation.evaluation_date).toLocaleString()}\n`
        archContent += `- Archived Date: ${evaluation.archived_at ? new Date(evaluation.archived_at).toLocaleString() : "N/A"}\n`
        archContent += `- Score: ${evaluation.total_score}/${evaluation.max_score}\n`
        archContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "02_archived_evaluations.txt", content: archContent })
    }

    if (!classError && classrooms) {
      // Pre-index supervisor names by classroom_id in O(M) instead of O(N*M)
      const supervisorsByClassroom = new Map<string, string[]>()
      for (const a of (assignments || []) as any[]) {
        const name = a.users?.name
        if (!name) continue
        const existing = supervisorsByClassroom.get(a.classroom_id) || []
        existing.push(name)
        supervisorsByClassroom.set(a.classroom_id, existing)
      }

      let classContent = "CLASSROOMS\n"
      classContent += "=".repeat(80) + "\n\n"
      classContent += `Total Classrooms: ${classrooms.length}\n`
      classContent += `Export Date: ${new Date().toISOString()}\n\n`

      classrooms.forEach((classroom, index) => {
        classContent += `\n[Classroom ${index + 1}]\n`
        classContent += `- ID: ${classroom.id}\n`
        classContent += `- Name: ${classroom.name}\n`
        classContent += `- Grade: ${classroom.grade}\n`
        classContent += `- Division: ${classroom.division || "N/A"}\n`
        if (classroom.description) {
          classContent += `- Description: ${classroom.description}\n`
        }
        const roomSupervisors = supervisorsByClassroom.get(classroom.id) || []
        classContent += `- Supervisors: ${roomSupervisors.length > 0 ? roomSupervisors.join(", ") : "None assigned"}\n`
        classContent += `- Active: ${classroom.is_active ? "Yes" : "No"}\n`
        classContent += `- Created: ${new Date(classroom.created_at).toLocaleString()}\n`
        classContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "03_classrooms.txt", content: classContent })
    }

    if (!supError && supervisors) {
      let supContent = "SUPERVISORS\n"
      supContent += "=".repeat(80) + "\n\n"
      supContent += `Total Supervisors: ${supervisors.length}\n`
      supContent += `Export Date: ${new Date().toISOString()}\n\n`

      supervisors.forEach((supervisor, index) => {
        supContent += `\n[Supervisor ${index + 1}]\n`
        supContent += `- ID: ${supervisor.id}\n`
        supContent += `- Name: ${supervisor.name}\n`
        supContent += `- Email: ${supervisor.email}\n`
        supContent += `- Role: ${supervisor.role}\n`
        supContent += `- Created: ${new Date(supervisor.created_at).toLocaleString()}\n`
        supContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "04_supervisors.txt", content: supContent })
    }

    if (evaluations && classrooms) {
      const transformedEvaluations = evaluations.map((e: any) => ({
        id: e.id,
        classroom_id: e.classroom_id,
        supervisor_id: e.supervisor_id,
        evaluation_date: e.evaluation_date,
        items: e.items,
        total_score: e.total_score,
        max_score: e.max_score,
        notes: e.notes,
        created_at: e.created_at,
        classroom: e.classrooms
          ? {
              id: e.classroom_id,
              name: e.classrooms.name,
              grade: e.classrooms.grade,
              division: e.classrooms.division,
            }
          : undefined,
      }))

      const leaderboard = calculateLeaderboard(transformedEvaluations as any, classrooms as any)

      let leaderContent = "LEADERBOARD\n"
      leaderContent += "=".repeat(80) + "\n\n"
      leaderContent += `Total Classrooms: ${leaderboard.length}\n`
      leaderContent += `Export Date: ${new Date().toISOString()}\n\n`
      leaderContent += "Rank | Classroom | Grade | Division | Total Score | Avg Score | Evaluations\n"
      leaderContent += "-".repeat(80) + "\n"

      leaderboard.forEach((entry, index) => {
        const rank = index + 1
        leaderContent += `${rank.toString().padStart(4)} | ${entry.classroom.name.padEnd(20)} | ${entry.classroom.grade.padEnd(5)} | ${(getDivisionDisplayName(entry.classroom.division) || "N/A").padEnd(15)} | ${entry.totalScore.toString().padStart(11)} | ${entry.averageScore.toString().padStart(9)} | ${entry.evaluationCount.toString().padStart(12)}\n`
      })

      const divisions = DIVISION_OPTIONS.map((opt) => opt.value)
      divisions.forEach((division) => {
        const divLeaderboard = leaderboard.filter((l) => l.classroom.division === division)
        if (divLeaderboard.length > 0) {
          leaderContent += `\n\n${getDivisionDisplayName(division).toUpperCase()} DIVISION LEADERBOARD\n`
          leaderContent += "=".repeat(80) + "\n"
          divLeaderboard.forEach((entry, index) => {
            const rank = index + 1
            leaderContent += `${rank.toString().padStart(4)} | ${entry.classroom.name.padEnd(20)} | ${entry.classroom.grade.padEnd(5)} | ${entry.totalScore.toString().padStart(11)} | ${entry.averageScore.toString().padStart(9)} | ${entry.evaluationCount.toString().padStart(12)}\n`
          })
        }
      })

      exportFiles.push({ filename: "05_leaderboard.txt", content: leaderContent })
    }

    if (!winnersError && winners) {
      let winnersContent = "MONTHLY WINNERS\n"
      winnersContent += "=".repeat(80) + "\n\n"
      winnersContent += `Total Winners Declared: ${winners.length}\n`
      winnersContent += `Export Date: ${new Date().toISOString()}\n\n`

      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]

      winners.forEach((winner, index) => {
        winnersContent += `\n[Winner ${index + 1}]\n`
        winnersContent += `- Month: ${months[winner.month - 1]} ${winner.year}\n`
        winnersContent += `- Division: ${getDivisionDisplayName(winner.division)}\n`
        winnersContent += `- Classroom: ${winner.classrooms?.name || "Unknown"} (Grade ${winner.classrooms?.grade || "N/A"})\n`
        winnersContent += `- Total Score: ${winner.total_score}\n`
        winnersContent += `- Average Score: ${winner.average_score.toFixed(2)}\n`
        winnersContent += `- Evaluation Count: ${winner.evaluation_count}\n`
        winnersContent += `- Declared By: ${winner.declared_by_user?.name || "Unknown"} (${winner.declared_by_user?.email || "N/A"})\n`
        winnersContent += `- Declared At: ${new Date(winner.declared_at).toLocaleString()}\n`
        if (winner.notes) {
          winnersContent += `- Notes: ${winner.notes}\n`
        }
        winnersContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "06_monthly_winners.txt", content: winnersContent })
    }

    let summaryContent = "DATA EXPORT SUMMARY\n"
    summaryContent += "=".repeat(80) + "\n\n"
    summaryContent += `Export Date: ${new Date().toISOString()}\n`
    summaryContent += `Exported By: Admin\n\n`
    summaryContent += "STATISTICS:\n"
    summaryContent += `- Active Evaluations: ${evaluations?.length || 0}\n`
    summaryContent += `- Archived Evaluations: ${archivedEvals?.length || 0}\n`
    summaryContent += `- Total Classrooms: ${classrooms?.length || 0}\n`
    summaryContent += `- Active Supervisors: ${supervisors?.length || 0}\n`
    summaryContent += `- Monthly Winners: ${winners?.length || 0}\n\n`

    if (evaluations && evaluations.length > 0) {
      const totalScore = evaluations.reduce((sum, e) => sum + e.total_score, 0)
      const avgScore = Math.round(totalScore / evaluations.length)
      summaryContent += `- Average Evaluation Score: ${avgScore}\n`
      summaryContent += `- Total Points Awarded: ${totalScore}\n`
    }

    exportFiles.push({ filename: "00_summary.txt", content: summaryContent })

    return { success: true, files: exportFiles }
  } catch (dbError: any) {
    console.error("[exportAllDataAsZip] Error:", dbError)
    return { success: false, error: `Failed to export data: ${dbError.message || "Unknown error"}` }
  }
}
