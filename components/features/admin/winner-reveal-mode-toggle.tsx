"use client"

import { SettingHelp } from "./setting-help"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PartyPopper, HelpCircle } from "lucide-react"
import { getWinnerRevealMode, setWinnerRevealMode } from "@/app/actions/winners-page-actions"

interface WinnerRevealModeToggleProps {
  initialEnabled?: boolean
}

export function WinnerRevealModeToggle({ initialEnabled }: WinnerRevealModeToggleProps) {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState<boolean>(initialEnabled ?? false)
  const [loading, setLoading] = useState(initialEnabled === undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialEnabled !== undefined) return
    let cancelled = false
    async function load() {
      try {
        const result = await getWinnerRevealMode()
        if (cancelled) return
        if (result.success) setEnabled(result.enabled ?? false)
      } catch (error) {
        console.error("Could not load setting", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [initialEnabled])

  const handleToggle = async (checked: boolean) => {
    setSaving(true)
    try {
      const result = await setWinnerRevealMode(checked)
      if (result.success) {
        setEnabled(checked)
        toast({
          title: "Winner Reveal Mode Updated",
          description: checked
            ? "The homepage will now show a winner reveal button instead of the leaderboard."
            : "The homepage will now show the normal leaderboard."
        })
      } else {
        toast({
          title: "Error updating setting",
          description: result.error || "Failed to update winner reveal mode.",
          variant: "destructive"
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="bg-muted/30 p-5 sm:p-6 border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <PartyPopper className="h-5 w-5 text-primary" />
          Winner Reveal Mode
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Hide the leaderboard and show a "Check Winner" button on the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="winner-reveal-mode" className="text-sm font-semibold text-foreground">
              Winner Reveal Mode
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {loading
                ? "Loading configuration..."
                : enabled
                  ? "Leaderboard is currently hidden for all users."
                  : "Leaderboard is currently visible."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <span
              className={`text-xs font-semibold transition-colors duration-200 ${
                !enabled ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Disabled
            </span>
            <Switch
              id="winner-reveal-mode"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading || saving}
              className="data-[state=checked]:bg-green-600"
            />
            <span
              className={`text-xs font-semibold transition-colors duration-200 ${
                enabled ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Enabled
            </span>
          </div>
        </div>

        {!loading && (
          <SettingHelp>
            {enabled ? (
              <span>
                <strong>Winner Reveal Active:</strong> Users visiting the homepage will see a "Check Winner" button.
                Clicking it reveals the winners with a confetti animation.
              </span>
            ) : (
              <span>
                <strong>Standard Mode:</strong> The homepage displays the real-time leaderboard filtered by the selected
                points aggregation mode.
              </span>
            )}
          </SettingHelp>
        )}
      </CardContent>
    </Card>
  )
}
