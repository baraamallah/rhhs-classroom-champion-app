"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getWinnersPageVisibility } from "@/app/actions/winners-page-actions"
import { TrophyIcon } from "@/components/common/icons"
import { cn } from "@/lib/utils"

export function WinnersLink({
  className,
  showOnMobile = false,
  variant = "pill",
}: {
  className?: string
  showOnMobile?: boolean
  variant?: "pill" | "text"
}) {
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function checkVisibility() {
      const result = await getWinnersPageVisibility()
      if (isMounted) {
        if (result.success) {
          setVisible(result.visible ?? true)
        }
        setLoading(false)
      }
    }
    void checkVisibility()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading || !visible) {
    return null
  }

  if (variant === "text") {
    return (
      <Link
        href="/winners"
        className={cn(
          "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5",
          !showOnMobile && "hidden sm:inline-flex",
          className
        )}
      >
        <TrophyIcon className="h-4 w-4 text-amber-500" />
        <span>Winners</span>
      </Link>
    )
  }

  return (
    <Link
      href="/winners"
      aria-label="View Monthly Champions and Winners"
      className={cn(
        "group relative inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1 sm:py-1.5 min-h-8 sm:min-h-9 text-[11px] xs:text-xs sm:text-sm font-semibold rounded-full border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-700 dark:text-amber-300 shadow-2xs hover:shadow-xs hover:border-amber-500/50 transition-all duration-200 active:scale-95 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        !showOnMobile && "hidden sm:inline-flex",
        className
      )}
    >
      <TrophyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 group-hover:scale-110 transition-transform duration-200" />
      <span>Winners</span>
      <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
    </Link>
  )
}
