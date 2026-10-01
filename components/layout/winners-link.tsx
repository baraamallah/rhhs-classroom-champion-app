"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  getCachedWinnersVisibility,
  setCachedWinnersVisibility,
  fetchWinnersVisibility,
  onWinnersVisibilityChange,
} from "@/lib/winners-visibility"
import { TrophyIcon } from "@/components/common/icons"
import { cn } from "@/lib/utils"

export function WinnersLink({
  className,
  showOnMobile = true,
  variant = "pill",
  initialVisible,
  onClick,
}: {
  className?: string
  showOnMobile?: boolean
  variant?: "pill" | "text"
  initialVisible?: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === "/winners"

  // Initialize from server prop if provided, otherwise from cached local state.
  // Defaults to false so it NEVER flashes when hidden in admin.
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof initialVisible === "boolean") {
      return initialVisible
    }
    return getCachedWinnersVisibility(false)
  })

  useEffect(() => {
    if (typeof initialVisible === "boolean") {
      setCachedWinnersVisibility(initialVisible)
      setVisible(initialVisible)
    }

    // Subscribe to live visibility updates (e.g. admin toggles or storage updates)
    const unsubscribe = onWinnersVisibilityChange((next) => {
      setVisible(next)
    })

    // If no server value was passed down, perform a background fetch to verify
    if (typeof initialVisible !== "boolean") {
      void fetchWinnersVisibility().then((res) => {
        setVisible(res)
      })
    }

    return () => {
      unsubscribe()
    }
  }, [initialVisible])

  if (!visible) {
    return null
  }

  if (variant === "text") {
    return (
      <Link
        href="/winners"
        onClick={onClick}
        className={cn(
          "text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5",
          isActive ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground hover:text-foreground",
          !showOnMobile && "hidden sm:inline-flex",
          className
        )}
      >
        <TrophyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
        <span>Winners</span>
      </Link>
    )
  }

  return (
    <Link
      href="/winners"
      onClick={onClick}
      aria-label="View Monthly Champions and Winners"
      className={cn(
        "group relative inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3 sm:px-3.5 py-1.5 min-h-8.5 sm:min-h-9 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-200 active:scale-95 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        isActive
          ? "border-amber-500/60 bg-linear-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-900 dark:text-amber-200 shadow-xs font-bold"
          : "border-amber-500/30 bg-linear-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-800 dark:text-amber-300 shadow-2xs hover:shadow-xs hover:border-amber-500/50",
        !showOnMobile && "hidden sm:inline-flex",
        className
      )}
    >
      <TrophyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 group-hover:scale-110 transition-transform duration-200 shrink-0" />
      <span>Winners</span>
      <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
    </Link>
  )
}
