"use client"

import { SettingHelp } from "./setting-help"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, HelpCircle } from "lucide-react"
import { getLeaderboardPointsSetting, setLeaderboardPointsSetting } from "@/app/actions/winners-page-actions"

interface LeaderboardSettingsToggleProps {
  initialShowMonthly?: boolean
}

export function LeaderboardSettingsToggle({ initialShowMonthly }: LeaderboardSettingsToggleProps) {
  const { toast } = useToast()
  const [showMonthly, setShowMonthly] = useState<boolean>(initialShowMonthly ?? false)
  const [loading, setLoading] = useState(initialShowMonthly === undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialShowMonthly !== undefined) return
    let cancelled = false
    async function load() {
      try {
        const result = await getLeaderboardPointsSetting()
        if (cancelled) return
        if (result.success) setShowMonthly(result.showMonthly ?? false)
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
  }, [initialShowMonthly])

  const handleToggle = async (checked: boolean) => {
    setSaving(true)
    try {
      const result = await setLeaderboardPointsSetting(checked)
      if (result.success) {
        setShowMonthly(checked)
        toast({
          title: "Setting Updated",
          description: checked
            ? "Leaderboard will now show points for the current month only."
            : "Leaderboard will now show all-time accumulated points."
        })
      } else {
        toast({
          title: "Error updating setting",
          description: result.error || "Failed to update leaderboard setting.",
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
          <BarChart3 className="h-5 w-5 text-primary" />
          Leaderboard Points Mode
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Toggle how scores are computed and displayed on the public homepage leaderboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="leaderboard-points-mode" className="text-sm font-semibold text-foreground">
              Points Aggregation Mode
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {loading
                ? "Loading configuration..."
                : showMonthly
                  ? "Showing evaluations for the current calendar month only."
                  : "Showing all-time accumulated points for the entire academic term."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <span
              className={`text-xs font-semibold transition-colors duration-200 ${
                !showMonthly ? "text-primary" : "text-muted-foreground"
              }`}
            >
              All-Time
            </span>
            <Switch
              id="leaderboard-points-mode"
              checked={showMonthly}
              onCheckedChange={handleToggle}
              disabled={loading || saving}
              className="data-[state=checked]:bg-green-600"
            />
            <span
              className={`text-xs font-semibold transition-colors duration-200 ${
                showMonthly ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
          </div>
        </div>

        {!loading && (
          <SettingHelp>
            {showMonthly ? (
              <span>
                <strong>Monthly Mode:</strong> Classrooms start fresh every 1st of the month.
              </span>
            ) : (
              <span>
                <strong>All-Time Mode:</strong> Points accumulate across the entire academic year.
              </span>
            )}
          </SettingHelp>
        )}
      </CardContent>
    </Card>
  )
}
