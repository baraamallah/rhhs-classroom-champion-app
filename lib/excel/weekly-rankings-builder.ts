import type ExcelJS from "exceljs"
import { format, startOfWeek, addDays, parseISO } from "date-fns"
import {
  EXCEL_COLORS,
  EXCEL_FONTS,
  EXCEL_BORDERS,
  styleBannerRow,
  styleSubtitleRow,
  styleHeaderRow,
} from "./excel-design-tokens"
import { getDivisionDisplayName } from "@/lib/division-display"

export interface ClassroomData {
  id: string
  name: string
  grade: string
  division?: string
}

export interface EvaluationData {
  id: string
  classroom_id: string
  evaluation_date: string
  total_score: number
  max_score: number
  created_at?: string
  classroom?: {
    id?: string
    name: string
    grade: string
    division?: string
  }
}

export interface BuildWeeklyRankingsOptions {
  evaluations: EvaluationData[]
  classrooms: ClassroomData[]
  /** Start date (typically Monday) in yyyy-MM-dd format or Date */
  startDate?: string | Date
  /** Specific workdays to use. Defaults to 5 days Mon-Fri starting from startDate */
  workDays?: Date[]
  periodLabel?: string
  subtitle?: string
}

export interface ClassroomWeeklyRow {
  division: string
  classroom: string
  dailyScores: (number | null)[] // Mon..Fri normalized 0..1 or null
  daysCount: number
  completionPct: number
  avgSubmittedPct: number
  weeklyPointsPct: number
  divisionRank: number
  recognition: string
  evaluationRecords: number
  grade: string
}

/**
 * Builds the complete publication-grade Excel workbook matching
 * RHHS_Green_App_October_Week_2_Rankings_Shaded.xlsx
 * Includes:
 * 1. "All Divisions" master rankings tab with formulas & shaded highlights
 * 2. "Greenest Winners" winners summary & methodology tab
 * 3. Dedicated tab for every individual division with formulas & summaries
 */
export async function buildWeeklyRankingsWorkbook({
  evaluations,
  classrooms,
  startDate,
  workDays,
  periodLabel,
  subtitle = "Shaded weekly points highlight performance across all five days; blank daily cells mean no recorded submission.",
}: BuildWeeklyRankingsOptions): Promise<ExcelJS.Workbook> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "RHHS Classroom Champion"
  workbook.lastModifiedBy = "RHHS Green App"
  workbook.created = new Date()
  workbook.modified = new Date()

  // 1. Determine the 5 school days (Mon–Fri)
  let days: Date[]
  if (workDays && workDays.length > 0) {
    days = workDays
  } else {
    const baseDate = startDate
      ? typeof startDate === "string"
        ? parseISO(startDate)
        : startDate
      : new Date()
    const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
    days = Array.from({ length: 5 }, (_, i) => addDays(monday, i))
  }

  const totalDays = days.length
  const startDayStr = format(days[0], "d")
  const endDayStr = format(days[days.length - 1], "d MMMM")
  const monthYearStr = format(days[0], "MMMM yyyy").toUpperCase()
  const dateRangeStr = `${startDayStr}–${endDayStr}`

  const resolvedPeriodLabel =
    periodLabel ||
    `RHHS GREEN APP | ${monthYearStr} (${dateRangeStr.toUpperCase()})`

  // 2. Map evaluations by classroom_id and dateStr (yyyy-MM-dd)
  // Handles UTC ISO timestamps ("2026-10-09T12:00:00+00:00") and plain date strings
  const evalMap = new Map<string, Map<string, EvaluationData>>()
  evaluations.forEach((ev) => {
    if (!ev.classroom_id || !ev.evaluation_date) return
    let dStr = ev.evaluation_date.includes("T")
      ? ev.evaluation_date.split("T")[0]
      : ev.evaluation_date.substring(0, 10)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      try {
        dStr = format(parseISO(ev.evaluation_date), "yyyy-MM-dd")
      } catch {}
    }

    if (!evalMap.has(ev.classroom_id)) {
      evalMap.set(ev.classroom_id, new Map())
    }
    const classDays = evalMap.get(ev.classroom_id)!
    const existing = classDays.get(dStr)
    if (!existing || ev.total_score > existing.total_score) {
      classDays.set(dStr, ev)
    }
  })

  // Count total evaluation records per classroom
  const evalCountMap = new Map<string, number>()
  evaluations.forEach((ev) => {
    if (!ev.classroom_id) return
    evalCountMap.set(ev.classroom_id, (evalCountMap.get(ev.classroom_id) || 0) + 1)
  })

  // 3. Known divisions order
  const divisionOrder = [
    "Pre-School",
    "Elementary",
    "Middle School",
    "High School",
    "Technical Institute",
  ]

  // Group classrooms by division
  const classroomsByDivision = new Map<string, ClassroomData[]>()
  classrooms.forEach((c) => {
    const div = c.division || "Unassigned"
    if (!classroomsByDivision.has(div)) {
      classroomsByDivision.set(div, [])
    }
    classroomsByDivision.get(div)!.push(c)
  })

  // Order divisions according to canonical list first, then any extra
  const presentDivisions = Array.from(classroomsByDivision.keys()).sort((a, b) => {
    const idxA = divisionOrder.indexOf(a)
    const idxB = divisionOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  // 4. Calculate rows per division
  const divisionRowsMap = new Map<string, ClassroomWeeklyRow[]>()
  const allRows: ClassroomWeeklyRow[] = []

  presentDivisions.forEach((division) => {
    const rooms = classroomsByDivision.get(division) || []

    const rows: ClassroomWeeklyRow[] = rooms.map((c) => {
      const classDays = evalMap.get(c.id)
      const dailyScores: (number | null)[] = []
      let daysCount = 0
      let sumScores = 0

      days.forEach((d) => {
        const dStr = format(d, "yyyy-MM-dd")
        const ev = classDays?.get(dStr)
        if (ev && ev.max_score > 0) {
          const normScore = Math.round((ev.total_score / ev.max_score) * 1000) / 1000
          dailyScores.push(normScore)
          daysCount++
          sumScores += normScore
        } else {
          dailyScores.push(null)
        }
      })

      const completionPct = totalDays > 0 ? daysCount / totalDays : 0
      const avgSubmittedPct = daysCount > 0 ? sumScores / daysCount : 0
      const weeklyPointsPct = totalDays > 0 ? sumScores / totalDays : 0

      return {
        division: getDivisionDisplayName(c.division),
        classroom: c.name,
        dailyScores,
        daysCount,
        completionPct,
        avgSubmittedPct,
        weeklyPointsPct,
        divisionRank: 0,
        recognition: "",
        evaluationRecords: evalCountMap.get(c.id) || 0,
        grade: c.grade || "",
      }
    })

    // Sort within division: weeklyPointsPct DESC, avgSubmittedPct DESC, daysCount DESC, classroom ASC
    rows.sort((a, b) => {
      if (b.weeklyPointsPct !== a.weeklyPointsPct) {
        return b.weeklyPointsPct - a.weeklyPointsPct
      }
      if (b.avgSubmittedPct !== a.avgSubmittedPct) {
        return b.avgSubmittedPct - a.avgSubmittedPct
      }
      if (b.daysCount !== a.daysCount) {
        return b.daysCount - a.daysCount
      }
      return a.classroom.localeCompare(b.classroom)
    })

    // Assign ranks & Greenest recognition
    let currentRank = 1
    rows.forEach((r, idx) => {
      if (idx > 0) {
        const prev = rows[idx - 1]
        if (
          Math.abs(prev.weeklyPointsPct - r.weeklyPointsPct) < 0.0001 &&
          Math.abs(prev.avgSubmittedPct - r.avgSubmittedPct) < 0.0001
        ) {
          r.divisionRank = prev.divisionRank
        } else {
          r.divisionRank = currentRank
        }
      } else {
        r.divisionRank = 1
      }
      currentRank++

      if (r.divisionRank === 1 && r.weeklyPointsPct > 0) {
        r.recognition = "Greenest"
      }
    })

    divisionRowsMap.set(division, rows)
    allRows.push(...rows)
  })

  // Headers definitions
  const dayHeaders = days.map((d) => format(d, "EEE d")) // e.g. "Mon 5", "Tue 6"
  const tableHeaders = [
    "Division",
    "Classroom",
    ...dayHeaders,
    `Days / ${totalDays}`,
    "Completion %",
    "Avg submitted %",
    "Weekly points %",
    "Division rank",
    "Recognition",
    "Evaluation records",
    "Grade",
  ]
  const totalCols = tableHeaders.length
  const weeklyPointsColIndex = 3 + totalDays + 3 // 11

  // Helper to render a rankings sheet with formulas, highlights, and summary row
  const renderRankingsSheet = (
    sheet: ExcelJS.Worksheet,
    bannerTitle: string,
    rows: ClassroomWeeklyRow[]
  ) => {
    // 1. Column widths
    sheet.columns = [
      { width: 22 }, // Division
      { width: 22 }, // Classroom
      ...days.map(() => ({ width: 14 })), // Daily scores
      { width: 17 }, // Days / 5
      { width: 18 }, // Completion %
      { width: 18 }, // Avg submitted %
      { width: 19 }, // Weekly points % (Highlighted)
      { width: 17 }, // Division rank
      { width: 18 }, // Recognition
      { width: 18 }, // Evaluation records
      { width: 16 }, // Grade
    ]

    // 2. Freeze Panes: Freeze rows 1-4 & columns A-B for effortless navigation
    sheet.views = [
      {
        state: "frozen",
        xSplit: 2,
        ySplit: 4,
        showGridLines: true,
      },
    ]

    // Row 1: Banner
    styleBannerRow(sheet, 1, bannerTitle, totalCols)

    // Row 2: Subtitle
    styleSubtitleRow(sheet, 2, subtitle)

    // Row 3: Blank separator (height 10)
    sheet.getRow(3).height = 10

    // Row 4: Headers
    styleHeaderRow(sheet, 4, tableHeaders, [weeklyPointsColIndex])

    // Row 5+: Data rows
    rows.forEach((r, rowIdx) => {
      const curRowIndex = rowIdx + 5
      const curRow = sheet.getRow(curRowIndex)
      curRow.height = 21

      // Col 1: Division
      const cellDiv = curRow.getCell(1)
      cellDiv.value = r.division
      cellDiv.font = EXCEL_FONTS.DATA
      cellDiv.border = EXCEL_BORDERS.THIN
      cellDiv.alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 2: Classroom (Bold if Greenest)
      const cellRoom = curRow.getCell(2)
      cellRoom.value = r.classroom
      cellRoom.font =
        r.recognition === "Greenest"
          ? { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
          : EXCEL_FONTS.DATA
      cellRoom.border = EXCEL_BORDERS.THIN
      cellRoom.alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Cols 3..3 + totalDays - 1: Daily Scores (Mon..Fri)
      r.dailyScores.forEach((score, dIdx) => {
        const cell = curRow.getCell(3 + dIdx)
        cell.border = EXCEL_BORDERS.THIN
        cell.alignment = { vertical: "middle", horizontal: "center" }

        if (score !== null) {
          cell.value = score
          cell.numFmt = "0.0%"
          // In-cell highlight for perfect 1.0 (100%) score
          if (score === 1.0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE6F4EA" }, // Soft mint
            }
            cell.font = {
              name: "Aptos",
              size: 10,
              bold: true,
              color: { argb: "FF137333" }, // Forest green
            }
          } else if (score >= 0.9) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0FDF4" }, // Very soft emerald
            }
            cell.font = EXCEL_FONTS.DATA
          } else {
            cell.font = EXCEL_FONTS.DATA
          }
        } else {
          cell.value = null
          cell.font = EXCEL_FONTS.DATA
        }
      })

      // Col 8: Days / 5 (FORMULA: =COUNT(C{row}:G{row}))
      const cellDays = curRow.getCell(3 + totalDays)
      cellDays.value = {
        formula: `COUNT(C${curRowIndex}:G${curRowIndex})`,
        result: r.daysCount,
      }
      cellDays.font = EXCEL_FONTS.DATA
      cellDays.border = EXCEL_BORDERS.THIN
      cellDays.alignment = { vertical: "middle", horizontal: "center" }

      // Col 9: Completion % (FORMULA: =H{row}/5)
      const cellComp = curRow.getCell(3 + totalDays + 1)
      cellComp.value = {
        formula: `H${curRowIndex}/${totalDays}`,
        result: r.completionPct,
      }
      cellComp.numFmt = "0.0%"
      cellComp.font = EXCEL_FONTS.DATA
      cellComp.border = EXCEL_BORDERS.THIN
      cellComp.alignment = { vertical: "middle", horizontal: "center" }

      // Col 10: Avg submitted % (FORMULA: =IFERROR(AVERAGE(C{row}:G{row}), 0))
      const cellAvg = curRow.getCell(3 + totalDays + 2)
      cellAvg.value = {
        formula: `IFERROR(AVERAGE(C${curRowIndex}:G${curRowIndex}), 0)`,
        result: r.avgSubmittedPct,
      }
      cellAvg.numFmt = "0.0%"
      cellAvg.font = EXCEL_FONTS.DATA
      cellAvg.border = EXCEL_BORDERS.THIN
      cellAvg.alignment = { vertical: "middle", horizontal: "center" }

      // Col 11: Weekly points % (FORMULA: =SUM(C{row}:G{row})/5)
      const cellWkPts = curRow.getCell(3 + totalDays + 3)
      cellWkPts.value = {
        formula: `SUM(C${curRowIndex}:G${curRowIndex})/${totalDays}`,
        result: r.weeklyPointsPct,
      }
      cellWkPts.numFmt = "0.0%"
      cellWkPts.font =
        r.weeklyPointsPct >= 0.9
          ? { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
          : EXCEL_FONTS.DATA
      cellWkPts.border = EXCEL_BORDERS.THIN
      cellWkPts.alignment = { vertical: "middle", horizontal: "center" }

      // Col 12: Division rank (Rank 1 highlighted)
      const cellRank = curRow.getCell(3 + totalDays + 4)
      cellRank.value = r.divisionRank
      cellRank.border = EXCEL_BORDERS.THIN
      cellRank.alignment = { vertical: "middle", horizontal: "center" }
      if (r.divisionRank === 1 && r.weeklyPointsPct > 0) {
        cellRank.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
        cellRank.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8F5E9" },
        }
      } else {
        cellRank.font = EXCEL_FONTS.DATA
      }

      // Col 13: Recognition (Greenest badge)
      const cellRecog = curRow.getCell(3 + totalDays + 5)
      cellRecog.value = r.recognition
      cellRecog.border = EXCEL_BORDERS.THIN
      cellRecog.alignment = { vertical: "middle", horizontal: "center" }
      if (r.recognition === "Greenest") {
        cellRecog.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
        cellRecog.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6F4EA" },
        }
      } else {
        cellRecog.font = EXCEL_FONTS.DATA
      }

      // Col 14: Evaluation records
      const cellRecords = curRow.getCell(3 + totalDays + 6)
      cellRecords.value = r.evaluationRecords
      cellRecords.font = EXCEL_FONTS.DATA
      cellRecords.border = EXCEL_BORDERS.THIN
      cellRecords.alignment = { vertical: "middle", horizontal: "center" }

      // Col 15: Grade
      const cellGrade = curRow.getCell(3 + totalDays + 7)
      cellGrade.value = r.grade
      cellGrade.font = EXCEL_FONTS.DATA
      cellGrade.border = EXCEL_BORDERS.THIN
      cellGrade.alignment = { vertical: "middle", horizontal: "center" }

      // Zebra striping for non-highlighted cells
      if (rowIdx % 2 === 1) {
        for (let c = 1; c <= totalCols; c++) {
          const cCell = curRow.getCell(c)
          if (!cCell.fill) {
            cCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT },
            }
          }
        }
      }
    })

    // 3. Summary / Division Average Footer Row
    if (rows.length > 0) {
      const summaryRowIndex = rows.length + 5
      const sumRow = sheet.getRow(summaryRowIndex)
      sumRow.height = 24

      // Col 1: Label
      sumRow.getCell(1).value = "AVERAGE / SUMMARY"
      sumRow.getCell(1).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Col 2: Total count
      sumRow.getCell(2).value = `${rows.length} Classrooms`
      sumRow.getCell(2).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      // Cols 3..3 + totalDays - 1: Daily Averages
      const dayCols = ["C", "D", "E", "F", "G"]
      days.forEach((_, dIdx) => {
        const colLetter = dayCols[dIdx] || "C"
        const c = sumRow.getCell(3 + dIdx)
        const dailyAvg =
          rows.reduce((sum, r) => sum + (r.dailyScores[dIdx] || 0), 0) / (rows.length || 1)
        c.value = {
          formula: `IFERROR(AVERAGE(${colLetter}5:${colLetter}${summaryRowIndex - 1}), 0)`,
          result: Math.round(dailyAvg * 1000) / 1000,
        }
        c.numFmt = "0.0%"
        c.font = { name: "Aptos", size: 10, bold: true }
        c.alignment = { vertical: "middle", horizontal: "center" }
      })

      // Col 8: Avg Days
      const avgDays = rows.reduce((sum, r) => sum + r.daysCount, 0) / (rows.length || 1)
      const cDays = sumRow.getCell(3 + totalDays)
      cDays.value = {
        formula: `IFERROR(AVERAGE(H5:H${summaryRowIndex - 1}), 0)`,
        result: Math.round(avgDays * 10) / 10,
      }
      cDays.numFmt = "0.0"
      cDays.font = { name: "Aptos", size: 10, bold: true }
      cDays.alignment = { vertical: "middle", horizontal: "center" }

      // Col 9: Avg Completion %
      const avgComp = rows.reduce((sum, r) => sum + r.completionPct, 0) / (rows.length || 1)
      const cComp = sumRow.getCell(3 + totalDays + 1)
      cComp.value = {
        formula: `IFERROR(AVERAGE(I5:I${summaryRowIndex - 1}), 0)`,
        result: Math.round(avgComp * 1000) / 1000,
      }
      cComp.numFmt = "0.0%"
      cComp.font = { name: "Aptos", size: 10, bold: true }
      cComp.alignment = { vertical: "middle", horizontal: "center" }

      // Col 10: Avg Submitted %
      const avgSub = rows.reduce((sum, r) => sum + r.avgSubmittedPct, 0) / (rows.length || 1)
      const cSub = sumRow.getCell(3 + totalDays + 2)
      cSub.value = {
        formula: `IFERROR(AVERAGE(J5:J${summaryRowIndex - 1}), 0)`,
        result: Math.round(avgSub * 1000) / 1000,
      }
      cSub.numFmt = "0.0%"
      cSub.font = { name: "Aptos", size: 10, bold: true }
      cSub.alignment = { vertical: "middle", horizontal: "center" }

      // Col 11: Avg Weekly Points %
      const avgWk = rows.reduce((sum, r) => sum + r.weeklyPointsPct, 0) / (rows.length || 1)
      const cWk = sumRow.getCell(3 + totalDays + 3)
      cWk.value = {
        formula: `IFERROR(AVERAGE(K5:K${summaryRowIndex - 1}), 0)`,
        result: Math.round(avgWk * 1000) / 1000,
      }
      cWk.numFmt = "0.0%"
      cWk.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
      cWk.alignment = { vertical: "middle", horizontal: "center" }

      // Col 12: Rank
      const cRk = sumRow.getCell(3 + totalDays + 4)
      cRk.value = "—"
      cRk.alignment = { vertical: "middle", horizontal: "center" }

      // Col 13: Greenest count
      const greenestCount = rows.filter((r) => r.recognition === "Greenest").length
      const cRec = sumRow.getCell(3 + totalDays + 5)
      cRec.value = `${greenestCount} Greenest`
      cRec.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
      cRec.alignment = { vertical: "middle", horizontal: "center" }

      // Col 14: Total evaluations
      const totalEvalRecords = rows.reduce((sum, r) => sum + r.evaluationRecords, 0)
      const cTot = sumRow.getCell(3 + totalDays + 6)
      cTot.value = {
        formula: `SUM(N5:N${summaryRowIndex - 1})`,
        result: totalEvalRecords,
      }
      cTot.numFmt = "#,##0"
      cTot.font = { name: "Aptos", size: 10, bold: true }
      cTot.alignment = { vertical: "middle", horizontal: "center" }

      // Col 15: Grade
      const cGrd = sumRow.getCell(3 + totalDays + 7)
      cGrd.value = "—"
      cGrd.alignment = { vertical: "middle", horizontal: "center" }

      // Style summary borders & fill
      for (let col = 1; col <= totalCols; col++) {
        const c = sumRow.getCell(col)
        c.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "double", color: { argb: "FF153449" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        }
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        }
      }

      // 4. Conditional Formatting Color Scales matching benchmark spreadsheet
      const lastDataRow = rows.length + 4

      // Daily scores color scale (C5:G{lastDataRow})
      sheet.addConditionalFormatting({
        ref: `C5:G${lastDataRow}`,
        rules: [
          {
            priority: 1,
            type: "colorScale",
            cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
            color: [{ argb: "FFFCE8E6" }, { argb: "FFFFF2C6" }, { argb: "FFC8EAD1" }],
          },
        ],
      })

      // Completion % color scale (I5:I{lastDataRow})
      sheet.addConditionalFormatting({
        ref: `I5:I${lastDataRow}`,
        rules: [
          {
            priority: 2,
            type: "colorScale",
            cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
            color: [{ argb: "FFFCE8E6" }, { argb: "FFFFF2C6" }, { argb: "FFC8EAD1" }],
          },
        ],
      })

      // Avg submitted % color scale (J5:J{lastDataRow})
      sheet.addConditionalFormatting({
        ref: `J5:J${lastDataRow}`,
        rules: [
          {
            priority: 3,
            type: "colorScale",
            cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
            color: [{ argb: "FFFCE8E6" }, { argb: "FFFFF2C6" }, { argb: "FFC8EAD1" }],
          },
        ],
      })

      // Weekly points % color scale (K5:K{lastDataRow})
      sheet.addConditionalFormatting({
        ref: `K5:K${lastDataRow}`,
        rules: [
          {
            priority: 4,
            type: "colorScale",
            cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
            color: [{ argb: "FFFCE8E6" }, { argb: "FFFFF2C6" }, { argb: "FFC8EAD1" }],
          },
        ],
      })
    }
  }

  // ==========================================
  // SHEET 1: "All Divisions" (Master Overview)
  // ==========================================
  const masterSheet = workbook.addWorksheet("All Divisions", {
    views: [{ showGridLines: true }],
  })
  renderRankingsSheet(masterSheet, resolvedPeriodLabel, allRows)

  // ==========================================
  // SHEET 2: "Greenest Winners" (Summary Tab)
  // ==========================================
  const winnersSheet = workbook.addWorksheet("Greenest Winners", {
    views: [{ showGridLines: true }],
  })
  winnersSheet.columns = [
    { width: 24 }, // Division
    { width: 28 }, // Winning classroom(s)
    { width: 20 }, // Weekly points %
    { width: 18 }, // Days submitted
    { width: 20 }, // Avg submitted %
    { width: 34 }, // Status
  ]

  winnersSheet.views = [
    {
      state: "frozen",
      xSplit: 2,
      ySplit: 3,
      showGridLines: true,
    },
  ]

  // Winner Banner
  const winnerBannerTitle = `${monthYearStr} | GREENEST CLASSROOMS`
  styleBannerRow(winnersSheet, 1, winnerBannerTitle, 6)

  // Blank separator
  winnersSheet.getRow(2).height = 10

  // Winners Headers
  const winnerHeaders = [
    "Division",
    "Winning classroom(s)",
    "Weekly points %",
    "Days submitted",
    "Avg submitted %",
    "Status",
  ]
  styleHeaderRow(winnersSheet, 3, winnerHeaders, [3])

  // Aggregate winners per division
  let winnerRowIndex = 4
  presentDivisions.forEach((div) => {
    const rows = divisionRowsMap.get(div) || []
    const topRanked = rows.filter((r) => r.divisionRank === 1 && r.weeklyPointsPct > 0)

    if (topRanked.length > 0) {
      const winningNames = topRanked.map((t) => t.classroom).join(", ")
      const topPts = topRanked[0].weeklyPointsPct
      const daysStr = topRanked.map((t) => `${t.daysCount}/${totalDays}`).join(", ")
      const avgSub = topRanked[0].avgSubmittedPct
      const allComplete = topRanked.every((t) => t.daysCount === totalDays)
      const status = allComplete
        ? "Complete weekly submissions"
        : "Provisional — partial submissions"

      const wRow = winnersSheet.getRow(winnerRowIndex)
      wRow.height = 22

      const vals = [getDivisionDisplayName(div), winningNames, topPts, daysStr, avgSub, status]
      vals.forEach((v, idx) => {
        const cell = wRow.getCell(idx + 1)
        cell.value = v
        cell.font = idx === 1 ? EXCEL_FONTS.DATA_BOLD : EXCEL_FONTS.DATA
        cell.border = EXCEL_BORDERS.THIN
        cell.alignment = {
          vertical: "middle",
          horizontal: idx === 0 || idx === 1 ? "left" : "center",
          indent: idx === 0 || idx === 1 ? 1 : 0,
        }
        if (idx === 2 || idx === 4) {
          cell.numFmt = "0.0%"
        }
        if (idx === 2) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6F4EA" },
          }
          cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
        }
      })
      winnerRowIndex++
    }
  })

  // Footnotes
  const footRow1 = winnersSheet.getRow(winnerRowIndex + 2)
  footRow1.getCell(1).value =
    `Method: weekly points average all ${totalDays} days, assigning zero points for days with no submission. Winners are highest within each division.`
  footRow1.getCell(1).font = EXCEL_FONTS.FOOTNOTE

  const footRow2 = winnersSheet.getRow(winnerRowIndex + 3)
  footRow2.getCell(1).value =
    "Only classrooms present in the exported records are included. Missing evaluations are not evidence of poor environmental performance."
  footRow2.getCell(1).font = EXCEL_FONTS.FOOTNOTE

  // ==========================================
  // SHEETS 3–N: Individual Tab for Every Division
  // ==========================================
  presentDivisions.forEach((division) => {
    const divRows = divisionRowsMap.get(division) || []
    const displayName = getDivisionDisplayName(division)
    const sheetName = displayName.replace(/[/\\?*[\]]/g, "-").substring(0, 31)

    const divSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    })

    const divBannerTitle = `RHHS GREEN APP | ${displayName.toUpperCase()} — ${monthYearStr} (${dateRangeStr.toUpperCase()})`
    renderRankingsSheet(divSheet, divBannerTitle, divRows)
  })

  return workbook
}
