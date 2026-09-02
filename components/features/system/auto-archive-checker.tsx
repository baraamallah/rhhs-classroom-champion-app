"use client"

import { useEffect, useRef } from "react"
import { checkAndAutoArchive } from "@/app/actions/auto-archive-actions"

/**
 * Component that automatically checks for and performs monthly archiving.
 * Runs once per session to avoid redundant checks.
 */
export function AutoArchiveChecker() {
  const hasChecked = useRef(false)

  useEffect(() => {
    // Only run once per session
    if (hasChecked.current) return
    hasChecked.current = true

    // Run the check asynchronously without blocking the UI
    const performCheck = async () => {
      try {
        const result = await checkAndAutoArchive()
        
        if (result.archived) {
          console.log(`[AutoArchive] Successfully archived ${result.count} evaluations from ${result.fromMonth}`)
        }
      } catch (error) {
        console.error("[AutoArchive] Error during check:", error)
      }
    }

    // Delay slightly to not impact initial page load
    const timeout = setTimeout(performCheck, 2000)
    
    return () => clearTimeout(timeout)
  }, [])

  // This component renders nothing
  return null
}
