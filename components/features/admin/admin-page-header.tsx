"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface AdminPageHeaderProps {
  badge: string
  badgeLabel?: string
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  gradientClassName?: string
}

export function AdminPageHeader({
  badge,
  badgeLabel,
  title,
  description,
  action,
  className,
  gradientClassName,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-emerald-500/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs",
        gradientClassName,
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold px-2.5 py-0.5"
          >
            {badge}
          </Badge>
          {badgeLabel && (
            <span className="text-xs text-muted-foreground font-medium">
              {badgeLabel}
            </span>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>

      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  )
}
