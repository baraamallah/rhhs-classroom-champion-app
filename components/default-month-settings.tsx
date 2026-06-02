"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, RefreshCw, Trophy, BarChart3 } from "lucide-react"
import { getDefaultMonthSettings, setDefaultMonthSetting, MonthSetting } from "@/app/actions/winners-page-actions"

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function DefaultMonthSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const [winnersSetting, setWinnersSetting] = useState<MonthSetting | null>(null)
  const [leaderboardSetting, setLeaderboardSetting] = useState<MonthSetting | null>(null)

  const [tempWinners, setTempWinners] = useState<MonthSetting>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  const [tempLeaderboard, setTempLeaderboard] = useState<MonthSetting>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getDefaultMonthSettings()
    if (result.success) {
      setWinnersSetting(result.winnersMonth || null)
      setLeaderboardSetting(result.leaderboardMonth || null)

      if (result.winnersMonth) {
        setTempWinners(result.winnersMonth)
      }
      if (result.leaderboardMonth) {
        setTempLeaderboard(result.leaderboardMonth)
      }
    }
    setLoading(false)
  }

  const handleSave = async (key: "winners_display_month" | "leaderboard_display_month") => {
    setSaving(key)
    const setting = key === "winners_display_month" ? tempWinners : tempLeaderboard
    const result = await setDefaultMonthSetting(key, setting)
    setSaving(null)

    if (result.success) {
      if (key === "winners_display_month") setWinnersSetting(setting)
      else setLeaderboardSetting(setting)

      toast({
        title: "Setting Updated",
        description: `Default month for ${key === "winners_display_month" ? "winners" : "leaderboard"} has been set.`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update setting.",
        variant: "destructive",
      })
    }
  }

  const handleReset = async (key: "winners_display_month" | "leaderboard_display_month") => {
    setSaving(key)
    const result = await setDefaultMonthSetting(key, null)
    setSaving(null)

    if (result.success) {
      if (key === "winners_display_month") {
        setWinnersSetting(null)
        setTempWinners({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
      } else {
        setLeaderboardSetting(null)
        setTempLeaderboard({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
      }

      toast({
        title: "Setting Reset",
        description: `Default month for ${key === "winners_display_month" ? "winners" : "leaderboard"} reset to current.`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reset setting.",
        variant: "destructive",
      })
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading settings...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Winners Page Default Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Winners Display Month
          </CardTitle>
          <CardDescription>
            Choose which month to show by default on the Winners page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">Year</Label>
              <Select
                value={tempWinners.year.toString()}
                onValueChange={(v) => setTempWinners(prev => ({ ...prev, year: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Month</Label>
              <Select
                value={tempWinners.month.toString()}
                onValueChange={(v) => setTempWinners(prev => ({ ...prev, month: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${winnersSetting ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                {winnersSetting ? `Frozen: ${MONTHS.find(m => m.value === winnersSetting.month)?.label} ${winnersSetting.year}` : "Following Current Month"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                className="flex-1"
                onClick={() => handleSave("winners_display_month")}
                disabled={saving !== null}
              >
                {saving === "winners_display_month" ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : "Freeze to Month"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReset("winners_display_month")}
                disabled={saving !== null || !winnersSetting}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Default Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Leaderboard Display Month
          </CardTitle>
          <CardDescription>
            Choose which month to show on the leaderboard (only if "Monthly" mode is active).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">Year</Label>
              <Select
                value={tempLeaderboard.year.toString()}
                onValueChange={(v) => setTempLeaderboard(prev => ({ ...prev, year: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Month</Label>
              <Select
                value={tempLeaderboard.month.toString()}
                onValueChange={(v) => setTempLeaderboard(prev => ({ ...prev, month: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${leaderboardSetting ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                {leaderboardSetting ? `Frozen: ${MONTHS.find(m => m.value === leaderboardSetting.month)?.label} ${leaderboardSetting.year}` : "Following Current Month"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                className="flex-1"
                onClick={() => handleSave("leaderboard_display_month")}
                disabled={saving !== null}
              >
                {saving === "leaderboard_display_month" ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : "Freeze to Month"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReset("leaderboard_display_month")}
                disabled={saving !== null || !leaderboardSetting}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
