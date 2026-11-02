"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { checkAndAutoArchive } from "@/app/actions/auto-archive-actions"
import { getCurrentMonthPeriod } from "@/lib/month-period"

export function AutoArchiveChecker() {
  const router = useRouter()
  useEffect(() => {
    const initialMonth = getCurrentMonthPeriod().key
    let stopped = false
    let checking = false
    let boundaryTimer: ReturnType<typeof setTimeout>
    const performCheck = async () => {
      if (checking || stopped) return
      checking = true
      try {
        const result = await checkAndAutoArchive()
        if (!stopped && result.archived) router.refresh()
      } catch (error) {
        console.error("[AutoArchive] Monthly check failed:", error)
      } finally {
        checking = false
      }
    }
    const checkBoundary = () => {
      if (stopped) return
      const period = getCurrentMonthPeriod()
      if (period.key !== initialMonth) {
        // Reset client-loaded evaluation lists as well as server-rendered scores.
        window.location.reload()
        return
      }
      clearTimeout(boundaryTimer)
      boundaryTimer = setTimeout(checkBoundary, Math.min(Date.parse(period.end) - Date.now() + 50, 86_400_000))
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkBoundary()
        void performCheck()
      }
    }
    checkBoundary()
    const initialCheck = setTimeout(performCheck, 2000)
    const interval = setInterval(performCheck, 300_000)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearTimeout(initialCheck)
      clearTimeout(boundaryTimer)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [router])
  return null
}
