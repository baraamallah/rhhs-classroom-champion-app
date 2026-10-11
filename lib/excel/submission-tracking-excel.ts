import type ExcelJS from "exceljs"
import { format, startOfWeek, addDays } from "date-fns"
import {
  EXCEL_COLORS,
  EXCEL_FONTS,
  EXCEL_BORDERS,
  styleBannerRow,
  styleSubtitleRow,
  styleHeaderRow,
} from "./excel-design-tokens"
import { buildWeeklyRankingsWorkbook, type EvaluationData, type ClassroomData } from "./weekly-rankings-builder"
import { getDivisionDisplayName } from "@/lib/division-display"

export interface DailyTrackingOptions {
  date: Date
  classrooms: any[]
  evaluations: any[]
  submittedList: any[]
  notSubmittedList: any[]
}

export interface MonthlyTrackingOptions {
  date: Date
  classrooms: any[]
  workdays: Date[]
  performanceList: any[] // sortedClassroomPerformance
}

/**
 * Builds the Shaded Daily Submission Tracking Workbook with:
 * - "All Divisions" master audit tab
 * - Dedicated tab for every individual division
 * - Dynamic formulas, freeze panes, and summary footer rows
 */
export async function buildDailyTrackingWorkbook({
  date,
  classrooms,
  evaluations,
  submittedList,
  notSubmittedList,
}: DailyTrackingOptions): Promise<ExcelJS.Workbook> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const dateFormatted = format(date, "EEEE, MMMM d, yyyy")
  const bannerTitle = `RHHS GREEN APP | DAILY SUBMISSION AUDIT — ${dateFormatted.toUpperCase()}`
  const subtitle = `Total Classrooms: ${classrooms.length} | Submitted: ${submittedList.length} | Missing: ${notSubmittedList.length} | Compliance: ${
    classrooms.length > 0 ? Math.round((submittedList.length / classrooms.length) * 100) : 0
  }%`

  // Table headers
  const headers = [
    "Status",
    "Division",
    "Classroom",
    "Grade",
    "Supervisor(s)",
    "Evaluation Time",
    "Score",
    "Max Score",
    "Percentage",
  ]
  const totalCols = headers.length
  const pctColIndex = 9

  // Group classrooms by division
  const divisionOrder = [
    "Pre-School",
    "Elementary",
    "Middle School",
    "High School",
    "Technical Institute",
  ]
  const classroomsByDivision = new Map<string, any[]>()
  classrooms.forEach((c) => {
    const div = c.division || "Unassigned"
    if (!classroomsByDivision.has(div)) {
      classroomsByDivision.set(div, [])
    }
    classroomsByDivision.get(div)!.push(c)
  })

  const presentDivisions = Array.from(classroomsByDivision.keys()).sort((a, b) => {
    const idxA = divisionOrder.indexOf(a)
    const idxB = divisionOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  // Prepare row objects
  const submittedSet = new Set(submittedList.map((c: any) => c.id))
  const evalMap = new Map<string, any>(evaluations.map((e: any) => [e.classroom_id, e]))

  const buildRows = (roomList: any[]) => {
    const rows = roomList.map((c: any) => {
      const isSubmitted = submittedSet.has(c.id)
      const ev = evalMap.get(c.id)
      const pct = ev && ev.max_score > 0 ? ev.total_score / ev.max_score : 0

      return {
        status: isSubmitted ? "Submitted" : "MISSING",
        division: getDivisionDisplayName(c.division),
        classroom: c.name,
        grade: c.grade || "",
        supervisors: c.supervisors?.map((s: any) => s.name).join(", ") || "None",
        time: ev?.created_at ? format(new Date(ev.created_at), "h:mm a") : "—",
        score: ev?.total_score || 0,
        maxScore: ev?.max_score || 0,
        percentage: isSubmitted ? pct : 0,
      }
    })

    // Sort: Submitted first, then by Division, then Classroom
    rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === "Submitted" ? -1 : 1
      if (a.division !== b.division) return a.division.localeCompare(b.division)
      return a.classroom.localeCompare(b.classroom)
    })
    return rows
  }

  const renderDailySheet = (sheet: ExcelJS.Worksheet, title: string, rows: any[]) => {
    sheet.columns = [
      { width: 16 }, // Status
      { width: 22 }, // Division
      { width: 22 }, // Classroom
      { width: 14 }, // Grade
      { width: 26 }, // Supervisor(s)
      { width: 18 }, // Evaluation Time
      { width: 14 }, // Score
      { width: 14 }, // Max Score
      { width: 18 }, // Percentage
    ]

    sheet.views = [
      {
        state: "frozen",
        xSplit: 3,
        ySplit: 4,
        showGridLines: true,
      },
    ]

    styleBannerRow(sheet, 1, title, totalCols)
    styleSubtitleRow(sheet, 2, subtitle)
    sheet.getRow(3).height = 10
    styleHeaderRow(sheet, 4, headers, [pctColIndex])

    rows.forEach((r, idx) => {
      const curRowIdx = idx + 5
      const row = sheet.getRow(curRowIdx)
      row.height = 21

      // Col 1: Status
      const cellStatus = row.getCell(1)
      cellStatus.value = r.status
      cellStatus.border = EXCEL_BORDERS.THIN
      cellStatus.alignment = { vertical: "middle", horizontal: "center" }
      if (r.status === "Submitted") {
        cellStatus.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
        cellStatus.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } }
      } else {
        cellStatus.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFC5221F" } }
        cellStatus.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } }
      }

      // Col 2: Division
      const cellDiv = row.getCell(2)
      cellDiv.value = r.division
      cellDiv.font = EXCEL_FONTS.DATA
      cellDiv.border = EXCEL_BORDERS.THIN
      cellDiv.alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 3: Classroom
      const cellClass = row.getCell(3)
      cellClass.value = r.classroom
      cellClass.font = r.status === "Submitted" ? EXCEL_FONTS.DATA_BOLD : EXCEL_FONTS.DATA
      cellClass.border = EXCEL_BORDERS.THIN
      cellClass.alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 4: Grade
      const cellGrade = row.getCell(4)
      cellGrade.value = r.grade
      cellGrade.font = EXCEL_FONTS.DATA
      cellGrade.border = EXCEL_BORDERS.THIN
      cellGrade.alignment = { vertical: "middle", horizontal: "center" }

      // Col 5: Supervisors
      const cellSup = row.getCell(5)
      cellSup.value = r.supervisors
      cellSup.font = EXCEL_FONTS.DATA
      cellSup.border = EXCEL_BORDERS.THIN
      cellSup.alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 6: Time
      const cellTime = row.getCell(6)
      cellTime.value = r.time
      cellTime.font = EXCEL_FONTS.DATA
      cellTime.border = EXCEL_BORDERS.THIN
      cellTime.alignment = { vertical: "middle", horizontal: "center" }

      // Col 7: Score
      const cellScore = row.getCell(7)
      cellScore.value = r.score
      cellScore.font = EXCEL_FONTS.DATA
      cellScore.border = EXCEL_BORDERS.THIN
      cellScore.alignment = { vertical: "middle", horizontal: "center" }

      // Col 8: Max Score
      const cellMax = row.getCell(8)
      cellMax.value = r.maxScore
      cellMax.font = EXCEL_FONTS.DATA
      cellMax.border = EXCEL_BORDERS.THIN
      cellMax.alignment = { vertical: "middle", horizontal: "center" }

      // Col 9: Percentage (FORMULA: =IF(H{row}>0, G{row}/H{row}, 0))
      const cellPct = row.getCell(9)
      cellPct.value = {
        formula: `IF(H${curRowIdx}>0, G${curRowIdx}/H${curRowIdx}, 0)`,
        result: r.percentage,
      }
      cellPct.numFmt = "0.0%"
      cellPct.font =
        r.percentage >= 0.9
          ? { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
          : EXCEL_FONTS.DATA
      cellPct.border = EXCEL_BORDERS.THIN
      cellPct.alignment = { vertical: "middle", horizontal: "center" }

      if (idx % 2 === 1 && !cellStatus.fill) {
        row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
      }
    })

    // Summary Row
    if (rows.length > 0) {
      const sumRowIdx = rows.length + 5
      const sumRow = sheet.getRow(sumRowIdx)
      sumRow.height = 24

      sumRow.getCell(1).value = {
        formula: `COUNTIF(A5:A${sumRowIdx - 1}, "Submitted") & " Submitted"`,
        result: `${rows.filter((r) => r.status === "Submitted").length} Submitted`,
      }
      sumRow.getCell(1).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
      sumRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(2).value = "TOTAL / AVERAGE"
      sumRow.getCell(2).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      sumRow.getCell(3).value = `${rows.length} Classrooms`
      sumRow.getCell(3).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(3).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      sumRow.getCell(4).value = "—"
      sumRow.getCell(4).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(5).value = "—"
      sumRow.getCell(5).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(6).value = "—"
      sumRow.getCell(6).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(7).value = {
        formula: `IFERROR(AVERAGE(G5:G${sumRowIdx - 1}), 0)`,
        result: Math.round((rows.reduce((s, r) => s + r.score, 0) / (rows.length || 1)) * 10) / 10,
      }
      sumRow.getCell(7).numFmt = "0.0"
      sumRow.getCell(7).font = { name: "Aptos", size: 10, bold: true }
      sumRow.getCell(7).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(8).value = {
        formula: `IFERROR(AVERAGE(H5:H${sumRowIdx - 1}), 0)`,
        result: Math.round((rows.reduce((s, r) => s + r.maxScore, 0) / (rows.length || 1)) * 10) / 10,
      }
      sumRow.getCell(8).numFmt = "0.0"
      sumRow.getCell(8).font = { name: "Aptos", size: 10, bold: true }
      sumRow.getCell(8).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(9).value = {
        formula: `IFERROR(AVERAGE(I5:I${sumRowIdx - 1}), 0)`,
        result: Math.round((rows.reduce((s, r) => s + r.percentage, 0) / (rows.length || 1)) * 1000) / 1000,
      }
      sumRow.getCell(9).numFmt = "0.0%"
      sumRow.getCell(9).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
      sumRow.getCell(9).alignment = { vertical: "middle", horizontal: "center" }

      for (let c = 1; c <= totalCols; c++) {
        const cell = sumRow.getCell(c)
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "double", color: { argb: "FF153449" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
      }
    }
  }

  // 1. All Divisions Master Sheet
  const masterSheet = workbook.addWorksheet("All Divisions", {
    views: [{ showGridLines: true }],
  })
  renderDailySheet(masterSheet, bannerTitle, buildRows(classrooms))

  // 2. Individual Division Sheets
  presentDivisions.forEach((division) => {
    const divRooms = classroomsByDivision.get(division) || []
    const displayName = getDivisionDisplayName(division)
    const sheetName = displayName.replace(/[/\\?*[\]]/g, "-").substring(0, 31)

    const divSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    })
    const divTitle = `RHHS GREEN APP | ${displayName.toUpperCase()} — DAILY AUDIT (${format(date, "d MMM yyyy").toUpperCase()})`
    renderDailySheet(divSheet, divTitle, buildRows(divRooms))
  })

  return workbook
}

/**
 * Builds the Shaded Weekly Submission Tracking Workbook
 * Directly delegates to the benchmark weekly rankings builder
 */
export async function buildWeeklyTrackingWorkbook(
  date: Date,
  classrooms: any[],
  evaluations: any[]
): Promise<ExcelJS.Workbook> {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const days = Array.from({ length: 5 }, (_, i) => addDays(start, i))

  return buildWeeklyRankingsWorkbook({
    evaluations: evaluations as EvaluationData[],
    classrooms: classrooms as ClassroomData[],
    workDays: days,
    periodLabel: `RHHS GREEN APP | WEEKLY COMPLIANCE AUDIT — ${format(start, "MMMM yyyy").toUpperCase()} (${format(
      days[0],
      "d"
    )}–${format(days[4], "d MMMM").toUpperCase()})`,
    subtitle: `Total Monitored Classrooms: ${classrooms.length} | Audit Period: Monday through Friday`,
  })
}

/**
 * Builds the Shaded Monthly Submission Tracking Workbook with:
 * - "All Divisions" master compliance tab
 * - Dedicated tab for every individual division
 * - Dynamic formulas, freeze panes, and summary footer rows
 */
export async function buildMonthlyTrackingWorkbook({
  date,
  classrooms,
  workdays,
  performanceList,
}: MonthlyTrackingOptions): Promise<ExcelJS.Workbook> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const monthTitle = format(date, "MMMM yyyy").toUpperCase()
  const bannerTitle = `RHHS GREEN APP | MONTHLY COMPLIANCE AUDIT — ${monthTitle}`
  const subtitle = `Active School Workdays: ${workdays.length} | Total Monitored Classrooms: ${classrooms.length}`

  const workdayHeaders = workdays.map((d) => format(d, "MMM d"))
  const headers = [
    "Division",
    "Classroom",
    "Grade",
    "Supervisor(s)",
    "Total Submitted",
    "Total Workdays",
    "Submission Rate %",
    ...workdayHeaders,
  ]
  const totalCols = headers.length
  const rateColIndex = 7

  const divisionOrder = [
    "Pre-School",
    "Elementary",
    "Middle School",
    "High School",
    "Technical Institute",
  ]
  const classroomsByDivision = new Map<string, any[]>()
  classrooms.forEach((c) => {
    const div = c.division || "Unassigned"
    if (!classroomsByDivision.has(div)) {
      classroomsByDivision.set(div, [])
    }
    classroomsByDivision.get(div)!.push(c)
  })

  const presentDivisions = Array.from(classroomsByDivision.keys()).sort((a, b) => {
    const idxA = divisionOrder.indexOf(a)
    const idxB = divisionOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  const perfMap = new Map<string, any>(performanceList.map((p: any) => [p.classroom.id, p]))

  const buildRows = (roomList: any[]) => {
    const rows = roomList.map((c: any) => {
      const p = perfMap.get(c.id)
      const dayValues = (p?.workDays || []).map((day: any) => {
        if (day.isException) return "EXCUSED"
        return day.isSubmitted ? "YES" : "NO"
      })

      return {
        division: getDivisionDisplayName(c.division),
        classroom: c.name,
        grade: c.grade || "",
        supervisors: c.supervisors?.map((s: any) => s.name).join(", ") || "None",
        submittedCount: p?.submittedCount || 0,
        totalDays: p?.totalDays || workdays.length,
        rate: p?.rate ? p.rate / 100 : 0,
        dayValues,
      }
    })

    rows.sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate
      if (a.division !== b.division) return a.division.localeCompare(b.division)
      return a.classroom.localeCompare(b.classroom)
    })
    return rows
  }

  const renderMonthlySheet = (sheet: ExcelJS.Worksheet, title: string, rows: any[]) => {
    sheet.columns = [
      { width: 22 }, // Division
      { width: 22 }, // Classroom
      { width: 14 }, // Grade
      { width: 26 }, // Supervisor(s)
      { width: 18 }, // Total Submitted
      { width: 16 }, // Total Workdays
      { width: 20 }, // Submission Rate % (Highlighted)
      ...workdays.map(() => ({ width: 11 })),
    ]

    sheet.views = [
      {
        state: "frozen",
        xSplit: 2,
        ySplit: 4,
        showGridLines: true,
      },
    ]

    styleBannerRow(sheet, 1, title, totalCols)
    styleSubtitleRow(sheet, 2, subtitle)
    sheet.getRow(3).height = 10
    styleHeaderRow(sheet, 4, headers, [rateColIndex])

    rows.forEach((r, idx) => {
      const curRowIdx = idx + 5
      const row = sheet.getRow(curRowIdx)
      row.height = 21

      // Col 1: Division
      row.getCell(1).value = r.division
      row.getCell(1).border = EXCEL_BORDERS.THIN
      row.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 2: Classroom
      row.getCell(2).value = r.classroom
      row.getCell(2).border = EXCEL_BORDERS.THIN
      row.getCell(2).font = r.rate >= 0.9 ? EXCEL_FONTS.DATA_BOLD : EXCEL_FONTS.DATA
      row.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 3: Grade
      row.getCell(3).value = r.grade
      row.getCell(3).border = EXCEL_BORDERS.THIN
      row.getCell(3).alignment = { vertical: "middle", horizontal: "center" }

      // Col 4: Supervisors
      row.getCell(4).value = r.supervisors
      row.getCell(4).border = EXCEL_BORDERS.THIN
      row.getCell(4).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 5: Total Submitted
      row.getCell(5).value = r.submittedCount
      row.getCell(5).border = EXCEL_BORDERS.THIN
      row.getCell(5).alignment = { vertical: "middle", horizontal: "center" }

      // Col 6: Total Workdays
      row.getCell(6).value = r.totalDays
      row.getCell(6).border = EXCEL_BORDERS.THIN
      row.getCell(6).alignment = { vertical: "middle", horizontal: "center" }

      // Col 7: Submission Rate % (FORMULA: =E{row}/F{row})
      const cellRate = row.getCell(7)
      cellRate.value = {
        formula: `IF(F${curRowIdx}>0, E${curRowIdx}/F${curRowIdx}, 0)`,
        result: r.rate,
      }
      cellRate.numFmt = "0.0%"
      cellRate.border = EXCEL_BORDERS.THIN
      cellRate.alignment = { vertical: "middle", horizontal: "center" }
      if (r.rate >= 0.9) {
        cellRate.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
        cellRate.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } }
      } else {
        cellRate.font = EXCEL_FONTS.DATA
      }

      // Workday columns (YES / NO / EXCUSED)
      r.dayValues.forEach((v: string, dIdx: number) => {
        const cell = row.getCell(8 + dIdx)
        cell.value = v
        cell.border = EXCEL_BORDERS.THIN
        cell.alignment = { vertical: "middle", horizontal: "center" }

        if (v === "YES") {
          cell.font = { name: "Aptos", size: 9.5, bold: true, color: { argb: "FF137333" } }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } }
        } else if (v === "NO") {
          cell.font = { name: "Aptos", size: 9.5, color: { argb: "FFC5221F" } }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } }
        } else if (v === "EXCUSED") {
          cell.font = { name: "Aptos", size: 9.5, italic: true, color: { argb: "FF92400E" } }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
        }
      })

      // Zebra striping for non-highlighted columns
      if (idx % 2 === 1) {
        for (let c = 1; c <= 6; c++) {
          row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
        }
      }
    })

    // Summary Row
    if (rows.length > 0) {
      const sumRowIdx = rows.length + 5
      const sumRow = sheet.getRow(sumRowIdx)
      sumRow.height = 24

      sumRow.getCell(1).value = "AVERAGE / SUMMARY"
      sumRow.getCell(1).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      sumRow.getCell(2).value = `${rows.length} Classrooms`
      sumRow.getCell(2).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      sumRow.getCell(3).value = "—"
      sumRow.getCell(3).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(4).value = "—"
      sumRow.getCell(4).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(5).value = {
        formula: `SUM(E5:E${sumRowIdx - 1})`,
        result: rows.reduce((s, r) => s + r.submittedCount, 0),
      }
      sumRow.getCell(5).numFmt = "#,##0"
      sumRow.getCell(5).font = { name: "Aptos", size: 10, bold: true }
      sumRow.getCell(5).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(6).value = {
        formula: `IFERROR(AVERAGE(F5:F${sumRowIdx - 1}), 0)`,
        result: workdays.length,
      }
      sumRow.getCell(6).numFmt = "0"
      sumRow.getCell(6).font = { name: "Aptos", size: 10, bold: true }
      sumRow.getCell(6).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(7).value = {
        formula: `IFERROR(AVERAGE(G5:G${sumRowIdx - 1}), 0)`,
        result: Math.round((rows.reduce((s, r) => s + r.rate, 0) / (rows.length || 1)) * 1000) / 1000,
      }
      sumRow.getCell(7).numFmt = "0.0%"
      sumRow.getCell(7).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
      sumRow.getCell(7).alignment = { vertical: "middle", horizontal: "center" }

      for (let c = 1; c <= totalCols; c++) {
        const cell = sumRow.getCell(c)
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "double", color: { argb: "FF153449" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
      }

      // Conditional formatting on Submission Rate %
      sheet.addConditionalFormatting({
        ref: `G5:G${rows.length + 4}`,
        rules: [
          {
            priority: 1,
            type: "colorScale",
            cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
            color: [{ argb: "FFFCE8E6" }, { argb: "FFFFF2C6" }, { argb: "FFC8EAD1" }],
          },
        ],
      })
    }
  }

  // 1. All Divisions Master Sheet
  const masterSheet = workbook.addWorksheet("All Divisions", {
    views: [{ showGridLines: true }],
  })
  renderMonthlySheet(masterSheet, bannerTitle, buildRows(classrooms))

  // 2. Individual Division Sheets
  presentDivisions.forEach((division) => {
    const divRooms = classroomsByDivision.get(division) || []
    const displayName = getDivisionDisplayName(division)
    const sheetName = displayName.replace(/[/\\?*[\]]/g, "-").substring(0, 31)

    const divSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    })
    const divTitle = `RHHS GREEN APP | ${displayName.toUpperCase()} — MONTHLY AUDIT (${monthTitle})`
    renderMonthlySheet(divSheet, divTitle, buildRows(divRooms))
  })

  return workbook
}
