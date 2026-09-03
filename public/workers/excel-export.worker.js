/**
 * Web Worker for Off-Thread Excel (XLSX) Workbook Generation
 * Uses transferable ArrayBuffer for zero-copy memory transfer back to main thread.
 */

// Self-contained worker execution
self.onmessage = async function (e) {
  const { type, id, fileName, sheets } = e.data || {}

  if (type !== "EXPORT") return

  try {
    // Load XLSX library inside worker thread if not already present
    if (typeof XLSX === "undefined") {
      try {
        importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
      } catch (err) {
        throw new Error("Worker could not load XLSX engine: " + err.message)
      }
    }

    const workbook = XLSX.utils.book_new()

    for (const sheet of sheets) {
      const wsData = []

      if (sheet.stats && sheet.stats.length > 0) {
        wsData.push(["=== SUMMARY STATISTICS ===", ""])
        for (const stat of sheet.stats) {
          wsData.push([stat.label, stat.value])
        }
        wsData.push([])
        wsData.push([])
      }

      if (sheet.headers && sheet.headers.length > 0) {
        wsData.push(sheet.headers)
      }

      if (sheet.rows && sheet.rows.length > 0) {
        for (const row of sheet.rows) {
          wsData.push(row)
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Column widths calculation
      if (sheet.headers && sheet.headers.length > 0) {
        const colWidths = sheet.headers.map((h, i) => {
          let maxLen = h ? h.toString().length : 10
          if (sheet.rows) {
            for (const row of sheet.rows) {
              const cellVal = row[i] ? row[i].toString().length : 0
              if (cellVal > maxLen) maxLen = cellVal
            }
          }
          return { wch: Math.min(Math.max(maxLen + 2, 12), 45) }
        })
        ws["!cols"] = colWidths
      }

      const sheetName = (sheet.name || "Sheet").substring(0, 31)
      XLSX.utils.book_append_sheet(workbook, ws, sheetName)
    }

    // Generate binary Excel array buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const arrayBuffer = excelBuffer.buffer || excelBuffer

    // Zero-copy memory transfer
    self.postMessage(
      {
        type: "SUCCESS",
        id,
        fileName,
        buffer: arrayBuffer,
      },
      [arrayBuffer]
    )
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      id,
      error: err.message || "Failed to generate Excel file in background worker.",
    })
  }
}

self.onerror = function (err) {
  console.error("[Excel Worker Error]", err)
}
