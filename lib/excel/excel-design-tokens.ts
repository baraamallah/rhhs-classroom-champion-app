import type ExcelJS from "exceljs"

/**
 * Standard Design Tokens extracted from RHHS_Green_App_October_Week_2_Rankings_Shaded.xlsx
 */
export const EXCEL_COLORS = {
  // Brand Banner
  BANNER_TEAL: "FF087F73",
  // Table Header Navy
  HEADER_NAVY: "FF153449",
  // Key Metric Highlight Forest Green
  HIGHLIGHT_GREEN: "FF176B4B",
  // Status Colors
  STATUS_GREEN: "FF059669",
  STATUS_AMBER: "FFD97706",
  STATUS_RED: "FFE11D48",
  STATUS_GRAY: "FF6B7280",
  // Neutral Colors
  WHITE: "FFFFFFFF",
  ZEBRA_LIGHT: "FFF8FAFC",
  BORDER_LIGHT: "FFE2E8F0",
  BORDER_MEDIUM: "FFCBD5E1",
  TEXT_DARK: "FF1E293B",
  TEXT_MUTED: "FF64748B",
} as const

export const EXCEL_FONTS = {
  FONT_FAMILY: "Calibri",
  BANNER: {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: EXCEL_COLORS.WHITE },
  },
  SUBTITLE: {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: EXCEL_COLORS.TEXT_MUTED },
  },
  HEADER: {
    name: "Calibri",
    size: 10.5,
    bold: true,
    color: { argb: EXCEL_COLORS.WHITE },
  },
  DATA: {
    name: "Calibri",
    size: 10,
    color: { argb: EXCEL_COLORS.TEXT_DARK },
  },
  DATA_BOLD: {
    name: "Calibri",
    size: 10,
    bold: true,
    color: { argb: EXCEL_COLORS.TEXT_DARK },
  },
  FOOTNOTE: {
    name: "Calibri",
    size: 9.5,
    italic: true,
    color: { argb: EXCEL_COLORS.TEXT_MUTED },
  },
}

export const EXCEL_BORDERS = {
  THIN: {
    top: { style: "thin" as const, color: { argb: EXCEL_COLORS.BORDER_LIGHT } },
    bottom: { style: "thin" as const, color: { argb: EXCEL_COLORS.BORDER_LIGHT } },
    left: { style: "thin" as const, color: { argb: EXCEL_COLORS.BORDER_LIGHT } },
    right: { style: "thin" as const, color: { argb: EXCEL_COLORS.BORDER_LIGHT } },
  },
}

/**
 * Apply solid Teal banner on Row 1 across given column count
 */
export function styleBannerRow(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  title: string,
  totalColumns: number
) {
  const row = worksheet.getRow(rowNumber)
  row.height = 26
  row.getCell(1).value = title

  // Fill all cells across banner row with Teal
  for (let c = 1; c <= totalColumns; c++) {
    const cell = row.getCell(c)
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.BANNER_TEAL },
    }
    cell.font = EXCEL_FONTS.BANNER
    cell.alignment = {
      vertical: "middle",
      horizontal: c === 1 ? "left" : "center",
      indent: c === 1 ? 1 : 0,
    }
  }
}

/**
 * Apply subtitle styling on Row 2
 */
export function styleSubtitleRow(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  subtitle: string
) {
  const row = worksheet.getRow(rowNumber)
  row.height = 20
  const cell = row.getCell(1)
  cell.value = subtitle
  cell.font = EXCEL_FONTS.SUBTITLE
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
}

/**
 * Apply styled Table Header on Row 4
 */
export function styleHeaderRow(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  headers: string[],
  highlightColumnIndices: number[] = []
) {
  const row = worksheet.getRow(rowNumber)
  row.height = 28

  headers.forEach((headerText, index) => {
    const colIdx = index + 1
    const cell = row.getCell(colIdx)
    cell.value = headerText
    cell.font = EXCEL_FONTS.HEADER

    const isHighlight = highlightColumnIndices.includes(colIdx)
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: isHighlight ? EXCEL_COLORS.HIGHLIGHT_GREEN : EXCEL_COLORS.HEADER_NAVY,
      },
    }

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FF0E2536" } },
      bottom: { style: "medium", color: { argb: "FF0E2536" } },
      left: { style: "thin", color: { argb: "FF0E2536" } },
      right: { style: "thin", color: { argb: "FF0E2536" } },
    }
  })
}

/**
 * Trigger client-side browser download for Excel ArrayBuffer / Uint8Array
 */
export function downloadWorkbookBuffer(buffer: ArrayBuffer | Uint8Array, fileName: string) {
  if (typeof window === "undefined") return
  const blob = new Blob([buffer as any], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
