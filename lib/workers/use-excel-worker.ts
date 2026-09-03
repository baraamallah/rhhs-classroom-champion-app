"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface ExportSheetData {
  name: string
  headers?: string[]
  rows: (string | number)[][]
  stats?: { label: string; value: string | number }[]
}

interface PendingRequest {
  resolve: (value: boolean) => void
  reject: (reason: any) => void
  fileName: string
}

export function useExcelWorker() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string>("")
  const workerRef = useRef<Worker | null>(null)
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map())

  // Initialize Worker
  const getWorker = useCallback((): Worker | null => {
    if (typeof window === "undefined") return null

    if (!workerRef.current && window.Worker) {
      try {
        const worker = new Worker("/workers/excel-export.worker.js")

        worker.onmessage = (e: MessageEvent) => {
          const { type, id, fileName, buffer, error } = e.data || {}
          const pending = pendingRequests.current.get(id)
          if (!pending) return

          pendingRequests.current.delete(id)
          setIsExporting(pendingRequests.current.size > 0)
          setExportProgress("")

          if (type === "SUCCESS" && buffer) {
            try {
              // Convert transferred ArrayBuffer to downloadable Blob
              const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = fileName || pending.fileName || "export.xlsx"
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              toast({
                title: "Export Ready",
                description: `Downloaded ${fileName || pending.fileName}`,
              })
              pending.resolve(true)
            } catch (err: any) {
              toast({
                title: "Download Error",
                description: err.message || "Failed to trigger file download.",
                variant: "destructive",
              })
              pending.reject(err)
            }
          } else {
            toast({
              title: "Export Error",
              description: error || "Background worker encountered an error.",
              variant: "destructive",
            })
            pending.reject(new Error(error || "Worker export failed"))
          }
        }

        worker.onerror = (err) => {
          console.error("[useExcelWorker] Worker error:", err)
          toast({
            title: "Worker Error",
            description: "Worker encountered an error. Switching to main thread fallback.",
            variant: "destructive",
          })
          // Reject all pending and clear
          pendingRequests.current.forEach((pending) => {
            pending.reject(err)
          })
          pendingRequests.current.clear()
          setIsExporting(false)
          setExportProgress("")
        }

        worker.onmessageerror = (err) => {
          console.error("[useExcelWorker] Message deserialization error:", err)
        }

        workerRef.current = worker
      } catch (err) {
        console.warn("[useExcelWorker] Could not create Worker, will use main-thread fallback:", err)
        workerRef.current = null
      }
    }

    return workerRef.current
  }, [toast])

  // Teardown worker on component unmount
  useEffect(() => {
    const pending = pendingRequests.current
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      pending.clear()
    }
  }, [])

  // Main-thread fallback function
  const runMainThreadFallback = useCallback(
    async (sheets: ExportSheetData[], fileName: string): Promise<boolean> => {
      try {
        setExportProgress("Loading export engine...")
        // Dynamically load XLSX script if not present
        if (typeof window !== "undefined" && !(window as any).XLSX) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const XLSX = (window as any).XLSX
      if (!XLSX) throw new Error("XLSX library not available.")

      setExportProgress("Building workbook...")
      const workbook = XLSX.utils.book_new()

      sheets.forEach((sheet) => {
        const wsData: (string | number)[][] = []
        if (sheet.stats && sheet.stats.length > 0) {
          wsData.push(["=== SUMMARY STATISTICS ===", ""])
          sheet.stats.forEach((s) => wsData.push([s.label, s.value]))
          wsData.push([])
          wsData.push([])
        }
        if (sheet.headers) wsData.push(sheet.headers)
        if (sheet.rows) sheet.rows.forEach((r) => wsData.push(r))

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        XLSX.utils.book_append_sheet(workbook, ws, sheet.name.substring(0, 31))
      })

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Ready",
        description: `Downloaded ${fileName}`,
      })
      return true
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export data.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsExporting(false)
      setExportProgress("")
    }
  }, [toast])

  /**
   * Dispatches an export job to the Web Worker.
   * Transfers ownership of memory and provides unique request isolation.
   */
  const exportSheets = useCallback(
    async (sheets: ExportSheetData[], fileName: string): Promise<boolean> => {
      setIsExporting(true)
      setExportProgress("Processing in background worker...")

      const worker = getWorker()
      if (!worker) {
        return runMainThreadFallback(sheets, fileName)
      }

      const id = crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random()}`

      return new Promise<boolean>((resolve, reject) => {
        pendingRequests.current.set(id, { resolve, reject, fileName })

        worker.postMessage({
          type: "EXPORT",
          id,
          fileName,
          sheets,
        })
      }).catch((err) => {
        console.warn("[useExcelWorker] Worker failed, attempting fallback:", err)
        return runMainThreadFallback(sheets, fileName)
      })
    },
    [getWorker, runMainThreadFallback]
  )

  const abortExport = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingRequests.current.clear()
    setIsExporting(false)
    setExportProgress("")
    toast({
      title: "Export Cancelled",
      description: "Background export was cancelled.",
    })
  }, [toast])

  return {
    exportSheets,
    isExporting,
    exportProgress,
    abortExport,
  }
}
