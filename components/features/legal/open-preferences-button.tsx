"use client"

import { Settings } from "lucide-react"
import { useConsent } from "@/components/providers/consent-provider"
import { Button } from "@/components/ui/button"

export function OpenPreferencesButton({
  className = "",
  variant = "default" as const,
}: {
  className?: string
  variant?: "default" | "outline" | "secondary"
}) {
  const { openModal } = useConsent()

  return (
    <Button
      variant={variant}
      onClick={openModal}
      className={`min-h-11 text-xs font-semibold gap-2 ${className}`}
    >
      <Settings className="h-4 w-4" />
      <span>Open Privacy &amp; Cookie Preferences</span>
    </Button>
  )
}
