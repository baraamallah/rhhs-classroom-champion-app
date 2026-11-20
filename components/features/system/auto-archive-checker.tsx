"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { checkAndAutoArchive } from "@/app/actions/auto-archive-actions"
import { getCurrentMonthPeriod } from "@/lib/month-period"

const ARCHIVE_ALLOWED_ROLES = new Set(["admin", "super_admin", "supervisor"])
const CHECK_INTERVAL_MS = 300_000 // 5 minutes

export function AutoArchiveChecker() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const lastCheckAtRef = useRef(0)

  const canTriggerArchive = Boolean(!loading && user?.role && ARCHIVE_ALLOWED_ROLES.has(user.role))

  useEffect(() => {
    if (!canTriggerArchive) return

    let stopped = false
    let checking = false

    const performCheck = async (force = false) => {
      if (checking || stopped) return
      const now = Date.now()
      if (!force && now - lastCheckAtRef.current < CHECK_INTERVAL_MS) return

      checking = true
      lastCheckAtRef.current = now
      try {
        const result = await checkAndAutoArchive()
        if (!stopped && result.archived) router.refresh()
      } catch (error) {
        console.error("[AutoArchive] Monthly check failed:", error)
      } finally {
        checking = false
      }
    }

    const initialCheck = setTimeout(() => void performCheck(true), 2000)
    const interval = setInterval(() => void performCheck(false), CHECK_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void performCheck(false)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearTimeout(initialCheck)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [canTriggerArchive, router])

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
