import type ExcelJS from "exceljs"
import { format } from "date-fns"
import {
  EXCEL_COLORS,
  EXCEL_FONTS,
  EXCEL_BORDERS,
  styleBannerRow,
  styleSubtitleRow,
  styleHeaderRow,
} from "./excel-design-tokens"
import { getDivisionDisplayName } from "@/lib/division-display"

export interface MasterExportData {
  evaluations: any[]
  archivedEvals: any[]
  classrooms: any[]
  supervisors: any[]
  winners: any[]
}

/**
 * Builds the Master Excel Workbook with publication-grade Teal & Navy styling,
 * auto-fit column widths, number formats, and per-division tabs.
 */
export async function buildMasterExcelWorkbook(data: MasterExportData): Promise<ExcelJS.Workbook> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "RHHS Classroom Champion"
  workbook.created = new Date()

  const { evaluations = [], archivedEvals = [], classrooms = [], supervisors = [], winners = [] } = data
  const dateStr = format(new Date(), "yyyy-MM-dd")

  const DIVISIONS = ["Pre-School", "Elementary", "Middle School", "High School", "Technical Institute"]

  // ==========================================
  // SHEET 1: Summary Dashboard
  // ==========================================
  const dashSheet = workbook.addWorksheet("Summary Dashboard", { views: [{ showGridLines: true }] })
  dashSheet.columns = [{ width: 28 }, { width: 20 }, { width: 45 }]
  styleBannerRow(dashSheet, 1, `RHHS CLASSROOM CHAMPION | SYSTEM DASHBOARD — ${dateStr}`, 3)
  styleSubtitleRow(dashSheet, 2, "High-level metrics and system totals summary.")
  dashSheet.getRow(3).height = 10
  styleHeaderRow(dashSheet, 4, ["Metric", "Value", "Description"])

  const totalEvaluations = evaluations.length + archivedEvals.length
  const avgScore =
    evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) / evaluations.length)
      : 0
  const totalPoints = evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0)

  const summaryMetrics = [
    ["Total Classrooms", classrooms.length, "Total registered classrooms in system"],
    ["Active Supervisors", supervisors.length, "Registered active supervisors"],
    ["Total Evaluations", totalEvaluations, "Active and archived evaluations"],
    ["Active Evaluations", evaluations.length, "Current active evaluation submissions"],
    ["Archived Evaluations", archivedEvals.length, "Evaluations moved to archive storage"],
    ["Monthly Winners Declared", winners.length, "Total official monthly champions declared"],
    ["Average Score", avgScore, "Average score across active evaluations"],
    ["Total Points Awarded", totalPoints, "Cumulative total points awarded"],
  ]

  summaryMetrics.forEach((m, idx) => {
    const r = dashSheet.getRow(idx + 5)
    r.height = 21
    m.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = val
      cell.font = EXCEL_FONTS.DATA
      cell.border = EXCEL_BORDERS.THIN
      cell.alignment = {
        vertical: "middle",
        horizontal: cIdx === 1 ? "center" : "left",
        indent: cIdx === 0 || cIdx === 2 ? 1 : 0,
      }
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
      }
    })
  })

  // ==========================================
  // SHEET 2: Division Statistics
  // ==========================================
  const divStatsSheet = workbook.addWorksheet("Division Statistics", { views: [{ showGridLines: true }] })
  divStatsSheet.columns = [
    { width: 24 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 22 },
  ]
  styleBannerRow(divStatsSheet, 1, `RHHS CLASSROOM CHAMPION | DIVISION ANALYTICS — ${dateStr}`, 7)
  styleSubtitleRow(divStatsSheet, 2, "Performance aggregated across all academic divisions.")
  divStatsSheet.getRow(3).height = 10
  styleHeaderRow(divStatsSheet, 4, [
    "Division",
    "Classrooms",
    "Evaluations",
    "Total Points",
    "Avg Score",
    "Winners Declared",
    "Performance Rating",
  ], [5])

  const divStats = DIVISIONS.map((div) => {
    const divEvals = evaluations.filter((e) => (e.classrooms?.division || e.classroom?.division) === div)
    const divClassrooms = classrooms.filter((c) => c.division === div)
    const divWinners = winners.filter((w) => w.division === div)
    const pts = divEvals.reduce((sum, e) => sum + (e.total_score || 0), 0)
    const avg = divEvals.length > 0 ? Math.round(pts / divEvals.length) : 0
    return {
      division: getDivisionDisplayName(div),
      classrooms: divClassrooms.length,
      evaluations: divEvals.length,
      totalPoints: pts,
      avgScore: avg,
      winners: divWinners.length,
      rating: avg >= 90 ? "Excellent" : avg >= 75 ? "Good" : avg >= 60 ? "Fair" : "Needs Improvement",
    }
  })

  divStats.forEach((d, idx) => {
    const r = divStatsSheet.getRow(idx + 5)
    r.height = 21
    const vals = [
      d.division,
      d.classrooms,
      d.evaluations,
      d.totalPoints,
      d.avgScore,
      d.winners,
      d.rating,
    ]
    vals.forEach((v, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = v
      cell.font = EXCEL_FONTS.DATA
      cell.border = EXCEL_BORDERS.THIN
      cell.alignment = {
        vertical: "middle",
        horizontal: cIdx === 0 ? "left" : "center",
        indent: cIdx === 0 ? 1 : 0,
      }
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
      }
    })
  })

  // ==========================================
  // SHEET 3: Classroom Rankings
  // ==========================================
  const roomRankSheet = workbook.addWorksheet("Classroom Rankings", { views: [{ showGridLines: true }] })
  roomRankSheet.columns = [
    { width: 10 },
    { width: 22 },
    { width: 14 },
    { width: 22 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
  ]
  styleBannerRow(roomRankSheet, 1, `RHHS CLASSROOM CHAMPION | OVERALL CLASSROOM LEADERBOARD`, 9)
  styleSubtitleRow(roomRankSheet, 2, "Rankings sorted by cumulative evaluation points.")
  roomRankSheet.getRow(3).height = 10
  styleHeaderRow(roomRankSheet, 4, [
    "Rank",
    "Classroom",
    "Grade",
    "Division",
    "Evaluations",
    "Total Score",
    "Avg Score",
    "Wins",
    "Status",
  ], [6])

  const classroomStats = classrooms
    .map((c) => {
      const cEvals = evaluations.filter((e) => e.classroom_id === c.id)
      const pts = cEvals.reduce((sum, e) => sum + (e.total_score || 0), 0)
      const avg = cEvals.length > 0 ? Math.round(pts / cEvals.length) : 0
      const winCount = winners.filter((w) => w.classroom_id === c.id).length
      return {
        ...c,
        evalCount: cEvals.length,
        totalScore: pts,
        avgScore: avg,
        winCount,
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)

  classroomStats.forEach((c, idx) => {
    const r = roomRankSheet.getRow(idx + 5)
    r.height = 21
    const vals = [
      idx + 1,
      c.name,
      c.grade || "",
      getDivisionDisplayName(c.division),
      c.evalCount,
      c.totalScore,
      c.avgScore,
      c.winCount,
      c.is_active ? "Active" : "Inactive",
    ]
    vals.forEach((v, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = v
      cell.font = EXCEL_FONTS.DATA
      cell.border = EXCEL_BORDERS.THIN
      cell.alignment = {
        vertical: "middle",
        horizontal: cIdx === 1 || cIdx === 3 ? "left" : "center",
        indent: cIdx === 1 || cIdx === 3 ? 1 : 0,
      }
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
      }
    })
  })

  // ==========================================
  // SHEET 4: Active Evaluations
  // ==========================================
  const evalSheet = workbook.addWorksheet("Active Evaluations", { views: [{ showGridLines: true }] })
  evalSheet.columns = [
    { width: 14 },
    { width: 22 },
    { width: 12 },
    { width: 22 },
    { width: 24 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 35 },
  ]
  styleBannerRow(evalSheet, 1, `RHHS CLASSROOM CHAMPION | EVALUATION AUDIT LOG`, 9)
  styleSubtitleRow(evalSheet, 2, `Showing all ${evaluations.length} active evaluation records.`)
  evalSheet.getRow(3).height = 10
  styleHeaderRow(evalSheet, 4, [
    "Date",
    "Classroom",
    "Grade",
    "Division",
    "Supervisor",
    "Score",
    "Max Score",
    "Percentage",
    "Notes",
  ], [8])

  evaluations.forEach((e, idx) => {
    const r = evalSheet.getRow(idx + 5)
    r.height = 21
    const room = e.classrooms || e.classroom
    const pct = e.max_score > 0 ? e.total_score / e.max_score : 0
    const vals = [
      e.evaluation_date ? format(new Date(e.evaluation_date), "yyyy-MM-dd") : "",
      room?.name || "Unknown",
      room?.grade || "",
      getDivisionDisplayName(room?.division),
      e.users?.name || e.supervisor?.name || "Unknown",
      e.total_score,
      e.max_score,
      pct,
      e.notes || "",
    ]
    vals.forEach((v, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = v
      cell.font = EXCEL_FONTS.DATA
      cell.border = EXCEL_BORDERS.THIN
      cell.alignment = {
        vertical: "middle",
        horizontal: cIdx === 1 || cIdx === 3 || cIdx === 4 || cIdx === 8 ? "left" : "center",
        indent: cIdx === 1 || cIdx === 3 || cIdx === 4 || cIdx === 8 ? 1 : 0,
      }
      if (cIdx === 7) {
        cell.numFmt = "0.0%"
      }
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
      }
    })
  })

  // ==========================================
  // SHEET 5: Monthly Winners
  // ==========================================
  if (winners && winners.length > 0) {
    const winSheet = workbook.addWorksheet("Monthly Winners", { views: [{ showGridLines: true }] })
    winSheet.columns = [
      { width: 14 },
      { width: 10 },
      { width: 22 },
      { width: 24 },
      { width: 12 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 24 },
      { width: 14 },
    ]
    styleBannerRow(winSheet, 1, `RHHS CLASSROOM CHAMPION | MONTHLY CHAMPIONS ARCHIVE`, 10)
    styleSubtitleRow(winSheet, 2, "Official monthly green classroom champions.")
    winSheet.getRow(3).height = 10
    styleHeaderRow(winSheet, 4, [
      "Month",
      "Year",
      "Division",
      "Winner Classroom",
      "Grade",
      "Total Score",
      "Avg Score",
      "Evaluations",
      "Declared By",
      "Declared Date",
    ], [7])

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]

    winners.forEach((w, idx) => {
      const r = winSheet.getRow(idx + 5)
      r.height = 21
      const room = w.classrooms || w.classroom
      const vals = [
        MONTH_NAMES[(w.month || 1) - 1],
        w.year,
        getDivisionDisplayName(w.division),
        room?.name || "Unknown",
        room?.grade || "",
        w.total_score,
        typeof w.average_score === "number" ? Math.round(w.average_score * 10) / 10 : w.average_score,
        w.evaluation_count,
        w.declared_by_user?.name || "Admin",
        w.declared_at ? format(new Date(w.declared_at), "yyyy-MM-dd") : "",
      ]
      vals.forEach((v, cIdx) => {
        const cell = r.getCell(cIdx + 1)
        cell.value = v
        cell.font = EXCEL_FONTS.DATA
        cell.border = EXCEL_BORDERS.THIN
        cell.alignment = {
          vertical: "middle",
          horizontal: cIdx === 2 || cIdx === 3 || cIdx === 8 ? "left" : "center",
          indent: cIdx === 2 || cIdx === 3 || cIdx === 8 ? 1 : 0,
        }
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
        }
      })
    })
  }

  // ==========================================
  // SHEETS 6+: Individual Division Sheets for Classrooms & Evals
  // ==========================================
  DIVISIONS.forEach((div) => {
    const divRooms = classrooms.filter((c) => c.division === div)
    const divEvals = evaluations.filter((e) => (e.classrooms?.division || e.classroom?.division) === div)
    if (divRooms.length === 0) return

    const displayName = getDivisionDisplayName(div)
    const sheetName = displayName.replace(/[/\\?*[\]]/g, "-").substring(0, 31)
    const divSheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] })

    divSheet.columns = [
      { width: 10 }, // Rank
      { width: 24 }, // Classroom
      { width: 14 }, // Grade
      { width: 16 }, // Evaluations
      { width: 16 }, // Total Score
      { width: 16 }, // Avg Score
      { width: 16 }, // Wins
    ]

    styleBannerRow(divSheet, 1, `RHHS CLASSROOM CHAMPION | ${displayName.toUpperCase()} DIVISION SUMMARY`, 7)
    styleSubtitleRow(divSheet, 2, `Classrooms: ${divRooms.length} | Total Evaluations: ${divEvals.length}`)
    divSheet.getRow(3).height = 10
    styleHeaderRow(divSheet, 4, [
      "Rank",
      "Classroom",
      "Grade",
      "Evaluations",
      "Total Score",
      "Avg Score",
      "Wins",
    ], [6])

    const divRoomStats = divRooms
      .map((c) => {
        const cEvals = divEvals.filter((e) => e.classroom_id === c.id)
        const pts = cEvals.reduce((sum, e) => sum + (e.total_score || 0), 0)
        const avg = cEvals.length > 0 ? Math.round(pts / cEvals.length) : 0
        const winCount = winners.filter((w) => w.classroom_id === c.id).length
        return { ...c, evalCount: cEvals.length, totalScore: pts, avgScore: avg, winCount }
      })
      .sort((a, b) => b.totalScore - a.totalScore)

    divRoomStats.forEach((c, idx) => {
      const r = divSheet.getRow(idx + 5)
      r.height = 21
      const vals = [idx + 1, c.name, c.grade || "", c.evalCount, c.totalScore, c.avgScore, c.winCount]
      vals.forEach((v, cIdx) => {
        const cell = r.getCell(cIdx + 1)
        cell.value = v
        cell.font = EXCEL_FONTS.DATA
        cell.border = EXCEL_BORDERS.THIN
        cell.alignment = {
          vertical: "middle",
          horizontal: cIdx === 1 ? "left" : "center",
          indent: cIdx === 1 ? 1 : 0,
        }
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
        }
      })
    })
  })

  return workbook
}

/**
 * Builds Filtered Evaluations Custom Workbook with shaded styling
 * and separate sheets per division when all divisions are included.
 */
export async function buildFilteredEvaluationsWorkbook({
  evaluations,
  classrooms,
  startDate,
  endDate,
  selectedDivision,
}: {
  evaluations: any[]
  classrooms: any[]
  startDate: string
  endDate: string
  selectedDivision: string
}): Promise<ExcelJS.Workbook> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "RHHS Classroom Champion"
  workbook.created = new Date()

  const classroomMap = new Map(classrooms.map((c) => [c.id, c]))
  const filterDesc = selectedDivision === "all" ? "All Divisions" : getDivisionDisplayName(selectedDivision)
  const bannerTitle = `RHHS CLASSROOM CHAMPION | EVALUATION REPORT (${startDate} TO ${endDate})`
  const subtitle = `Filter: ${filterDesc} | Total Matching Records: ${evaluations.length}`

  const headers = [
    "Date",
    "Classroom",
    "Grade",
    "Division",
    "Supervisor",
    "Score",
    "Max Score",
    "Percentage",
    "Submission Time",
  ]
  const totalCols = headers.length

  const renderEvalSheet = (sheet: ExcelJS.Worksheet, title: string, evals: any[]) => {
    sheet.columns = [
      { width: 14 },
      { width: 22 },
      { width: 12 },
      { width: 22 },
      { width: 24 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 20 },
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
    styleHeaderRow(sheet, 4, headers, [8])

    evals.forEach((e, idx) => {
      const curRowIdx = idx + 5
      const r = sheet.getRow(curRowIdx)
      r.height = 21
      const room = classroomMap.get(e.classroom_id) || e.classroom || e.classrooms
      const pct = e.max_score > 0 ? e.total_score / e.max_score : 0
      const vals = [
        e.evaluation_date ? format(new Date(e.evaluation_date), "yyyy-MM-dd") : "",
        room?.name || "Unknown",
        room?.grade || "",
        getDivisionDisplayName(room?.division),
        e.supervisor?.name || e.users?.name || "Unknown",
        e.total_score,
        e.max_score,
        {
          formula: `IF(G${curRowIdx}>0, F${curRowIdx}/G${curRowIdx}, 0)`,
          result: pct,
        },
        e.created_at ? format(new Date(e.created_at), "yyyy-MM-dd h:mm a") : "",
      ]

      vals.forEach((v, cIdx) => {
        const cell = r.getCell(cIdx + 1)
        cell.value = v
        cell.font = EXCEL_FONTS.DATA
        cell.border = EXCEL_BORDERS.THIN
        cell.alignment = {
          vertical: "middle",
          horizontal: cIdx === 1 || cIdx === 3 || cIdx === 4 ? "left" : "center",
          indent: cIdx === 1 || cIdx === 3 || cIdx === 4 ? 1 : 0,
        }
        if (cIdx === 7) {
          cell.numFmt = "0.0%"
          if (pct >= 0.9) {
            cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } }
          }
        }
        if (idx % 2 === 1 && !cell.fill) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.ZEBRA_LIGHT } }
        }
      })
    })

    // Summary Row
    if (evals.length > 0) {
      const sumRowIdx = evals.length + 5
      const sumRow = sheet.getRow(sumRowIdx)
      sumRow.height = 24

      sumRow.getCell(1).value = "TOTAL / AVERAGE"
      sumRow.getCell(1).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(2).value = `${evals.length} Evaluations`
      sumRow.getCell(2).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF153449" } }
      sumRow.getCell(2).alignment = { vertical: "middle", horizontal: "left", indent: 1 }

      sumRow.getCell(3).value = "—"
      sumRow.getCell(3).alignment = { vertical: "middle", horizontal: "center" }
      sumRow.getCell(4).value = "—"
      sumRow.getCell(4).alignment = { vertical: "middle", horizontal: "center" }
      sumRow.getCell(5).value = "—"
      sumRow.getCell(5).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(6).value = {
        formula: `IFERROR(AVERAGE(F5:F${sumRowIdx - 1}), 0)`,
        result: Math.round((evals.reduce((s, e) => s + (e.total_score || 0), 0) / (evals.length || 1)) * 10) / 10,
      }
      sumRow.getCell(6).numFmt = "0.0"
      sumRow.getCell(6).font = { name: "Aptos", size: 10, bold: true }
      sumRow.getCell(6).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(7).value = {
        formula: `IFERROR(AVERAGE(G5:G${sumRowIdx - 1}), 0)`,
        result: Math.round((evals.reduce((s, e) => s + (e.max_score || 0), 0) / (evals.length || 1)) * 10) / 10,
      }
      sumRow.getCell(7).numFmt = "0.0"
      sumRow.getCell(7).font = { name: "Aptos", size: 10, bold: true }
      sumRow.getCell(7).alignment = { vertical: "middle", horizontal: "center" }

      const avgPct = evals.reduce((s, e) => s + (e.max_score > 0 ? e.total_score / e.max_score : 0), 0) / (evals.length || 1)
      sumRow.getCell(8).value = {
        formula: `IFERROR(AVERAGE(H5:H${sumRowIdx - 1}), 0)`,
        result: Math.round(avgPct * 1000) / 1000,
      }
      sumRow.getCell(8).numFmt = "0.0%"
      sumRow.getCell(8).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FF087F73" } }
      sumRow.getCell(8).alignment = { vertical: "middle", horizontal: "center" }

      sumRow.getCell(9).value = "—"
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

  // Master Sheet
  const masterSheet = workbook.addWorksheet("All Evaluations", { views: [{ showGridLines: true }] })
  renderEvalSheet(masterSheet, bannerTitle, evaluations)

  // If all divisions, also generate individual division tabs
  if (selectedDivision === "all") {
    const DIVISIONS = ["Pre-School", "Elementary", "Middle School", "High School", "Technical Institute"]
    DIVISIONS.forEach((div) => {
      const divEvals = evaluations.filter((e) => {
        const room = classroomMap.get(e.classroom_id) || e.classroom || e.classrooms
        return room?.division === div
      })
      if (divEvals.length === 0) return

      const displayName = getDivisionDisplayName(div)
      const sheetName = displayName.replace(/[/\\?*[\]]/g, "-").substring(0, 31)
      const divSheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] })
      const divTitle = `RHHS CLASSROOM CHAMPION | ${displayName.toUpperCase()} (${startDate} TO ${endDate})`
      renderEvalSheet(divSheet, divTitle, divEvals)
    })
  }

  return workbook
}
