"use client"

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
  const [showMonthly, setShowMonthly] = useState<boolean>(initialShowMonthly ?? true)
  const [loading, setLoading] = useState(initialShowMonthly === undefined)
  const [saving, setSaving] = useState(false)

  const hasLoaded = useRef(false)

  useEffect(() => {
    if (initialShowMonthly !== undefined || hasLoaded.current) return
    hasLoaded.current = true
    loadSetting()
  }, [])

  const loadSetting = async () => {
    setLoading(true)
    const result = await getLeaderboardPointsSetting()
    if (result.success) {
      setShowMonthly(result.showMonthly ?? true)
    }
    setLoading(false)
  }

  const handleToggle = async (checked: boolean) => {
    setSaving(true)
    const result = await setLeaderboardPointsSetting(checked)
    setSaving(false)

    if (result.success) {
      setShowMonthly(checked)
      toast({
        title: "Setting Updated",
        description: checked
          ? "The public leaderboard is now set to show points accumulated this month."
          : "The public leaderboard is now set to show total (all-time) points.",
      })
    } else {
      toast({
        title: "Error updating setting",
        description: result.error || "Failed to update leaderboard configuration.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          Leaderboard Points Mode
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Toggle how scores are computed and displayed on the public homepage leaderboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
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
                  : "Showing all unarchived evaluations across all-time."
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <span className={`text-xs font-semibold transition-colors duration-200 ${!showMonthly ? "text-primary" : "text-muted-foreground"}`}>
              All-Time
            </span>
            <Switch
              id="leaderboard-points-mode"
              checked={showMonthly}
              onCheckedChange={handleToggle}
              disabled={loading || saving}
              className="data-[state=checked]:bg-green-600"
            />
            <span className={`text-xs font-semibold transition-colors duration-200 ${showMonthly ? "text-primary" : "text-muted-foreground"}`}>
              Monthly
            </span>
          </div>
        </div>

        {!loading && (
          <div className="mt-4 p-3.5 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {showMonthly ? (
                <span>
                  <strong>Monthly Mode:</strong> Resets visually on the first of each month. Great for regular classroom challenges and monthly winner announcements.
                </span>
              ) : (
                <span>
                  <strong>All-Time Mode:</strong> Displays cumulative points across the entire school year (all unarchived evaluations). Ideal for long-term competition tracking.
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
