"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { checkAndAutoArchive } from "@/app/actions/auto-archive-actions"
import { getCurrentMonthPeriod } from "@/lib/month-period"

export function AutoArchiveChecker() {
  const router = useRouter()
  useEffect(() => {
    let stopped = false
    let checking = false
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
    const initialCheck = setTimeout(performCheck, 2000)
    const interval = setInterval(performCheck, 300_000)
    const onVisible = () => {
      if (document.visibilityState === "visible") void performCheck()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearTimeout(initialCheck)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [router])

  useEffect(() => {
    const initialMonth = getCurrentMonthPeriod().key
    let stopped = false
    const checkBoundary = () => {
      if (stopped) return
      const period = getCurrentMonthPeriod()
      if (period.key !== initialMonth) {
        window.location.reload()
        return
      }
      clearTimeout(boundaryTimer)
      boundaryTimer = setTimeout(checkBoundary, Math.min(Date.parse(period.end) - Date.now() + 50, 86_400_000))
    }
    const period = getCurrentMonthPeriod()
    let boundaryTimer = setTimeout(checkBoundary, Math.min(Date.parse(period.end) - Date.now() + 50, 86_400_000))
    const onVisible = () => {
      if (document.visibilityState === "visible") checkBoundary()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearTimeout(boundaryTimer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])
  return null
}
