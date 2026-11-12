"use client"

import { EcoLoader } from "@/components/common/eco-loader"
import { getSchoolMonth } from "@/lib/month-period"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, RefreshCw, Trophy, BarChart3 } from "lucide-react"
import { getDefaultMonthSettings, setDefaultMonthSetting, type MonthSetting } from "@/app/actions/winners-page-actions"

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
]

interface DefaultMonthSettingsProps {
  initialWinnersMonth?: MonthSetting | null
  initialLeaderboardMonth?: MonthSetting | null
  onMonthChange?: (key: "winners_display_month" | "leaderboard_display_month", setting: MonthSetting | null) => void
}

export function DefaultMonthSettings({
  initialWinnersMonth,
  initialLeaderboardMonth,
  onMonthChange
}: DefaultMonthSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(initialWinnersMonth === undefined)
  const [saving, setSaving] = useState<string | null>(null)

  const [winnersSetting, setWinnersSetting] = useState<MonthSetting | null>(initialWinnersMonth ?? null)
  const [leaderboardSetting, setLeaderboardSetting] = useState<MonthSetting | null>(initialLeaderboardMonth ?? null)

  const [tempWinners, setTempWinners] = useState<MonthSetting>(initialWinnersMonth || getSchoolMonth())

  const [tempLeaderboard, setTempLeaderboard] = useState<MonthSetting>(initialLeaderboardMonth || getSchoolMonth())

  const loadSettings = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const result = await getDefaultMonthSettings()
      if (signal?.aborted) return
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
    } catch (error) {
      if (signal?.aborted) return
      console.error("loadSettings failed:", error)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialWinnersMonth !== undefined && initialLeaderboardMonth !== undefined) {
      setWinnersSetting(initialWinnersMonth)
      setLeaderboardSetting(initialLeaderboardMonth)
      setTempWinners(initialWinnersMonth || getSchoolMonth())
      setTempLeaderboard(initialLeaderboardMonth || getSchoolMonth())
      setLoading(false)
      return
    }
    const controller = new AbortController()
    void loadSettings(controller.signal)
    return () => controller.abort()
  }, [initialWinnersMonth, initialLeaderboardMonth, loadSettings])

  const handleSave = async (key: "winners_display_month" | "leaderboard_display_month") => {
    setSaving(key)
    const setting = key === "winners_display_month" ? tempWinners : tempLeaderboard
    const result = await setDefaultMonthSetting(key, setting)
    setSaving(null)

    if (result.success) {
      onMonthChange?.(key, setting)
      if (key === "winners_display_month") setWinnersSetting(setting)
      else setLeaderboardSetting(setting)

      toast({
        title: "Setting Updated",
        description: `Default month for ${key === "winners_display_month" ? "winners" : "leaderboard"} has been set.`
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update setting.",
        variant: "destructive"
      })
    }
  }

  const handleReset = async (key: "winners_display_month" | "leaderboard_display_month") => {
    setSaving(key)
    const result = await setDefaultMonthSetting(key, null)
    setSaving(null)

    if (result.success) {
      onMonthChange?.(key, null)
      if (key === "winners_display_month") {
        setWinnersSetting(null)
        setTempWinners(getSchoolMonth())
      } else {
        setLeaderboardSetting(null)
        setTempLeaderboard(getSchoolMonth())
      }

      toast({
        title: "Setting Reset",
        description: `Default month for ${key === "winners_display_month" ? "winners" : "leaderboard"} reset to current.`
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reset setting.",
        variant: "destructive"
      })
    }
  }

  const years = Array.from(
    new Set([tempWinners.year, tempLeaderboard.year, ...Array.from({ length: 5 }, (_, i) => getSchoolMonth().year - i)])
  ).sort((a, b) => b - a)

  if (loading) {
    return <EcoLoader compact title="Preparing display settings" />
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
            Freeze the public winners page and admin declarations to the same competition month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">Year</Label>
              <Select
                value={tempWinners.year.toString()}
                onValueChange={(v) => setTempWinners((prev) => ({ ...prev, year: parseInt(v) }))}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Month</Label>
              <Select
                value={tempWinners.month.toString()}
                onValueChange={(v) => setTempWinners((prev) => ({ ...prev, month: parseInt(v) }))}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Status:</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${winnersSetting ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
              >
                {winnersSetting
                  ? `Frozen: ${MONTHS.find((m) => m.value === winnersSetting.month)?.label} ${winnersSetting.year}`
                  : leaderboardSetting
                    ? `Following Leaderboard: ${MONTHS.find((m) => m.value === leaderboardSetting.month)?.label} ${leaderboardSetting.year}`
                    : "Following Current Month"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                className="flex-1 min-h-11"
                onClick={() => handleSave("winners_display_month")}
                disabled={saving !== null}
              >
                {saving === "winners_display_month" ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Freeze to Month"
                )}
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
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
            Choose the leaderboard month in Monthly mode. Admin winners follow it when the Winners month is not
            separately frozen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">Year</Label>
              <Select
                value={tempLeaderboard.year.toString()}
                onValueChange={(v) => setTempLeaderboard((prev) => ({ ...prev, year: parseInt(v) }))}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Month</Label>
              <Select
                value={tempLeaderboard.month.toString()}
                onValueChange={(v) => setTempLeaderboard((prev) => ({ ...prev, month: parseInt(v) }))}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Status:</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${leaderboardSetting ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
              >
                {leaderboardSetting
                  ? `Frozen: ${MONTHS.find((m) => m.value === leaderboardSetting.month)?.label} ${leaderboardSetting.year}`
                  : "Following Current Month"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                className="flex-1 min-h-11"
                onClick={() => handleSave("leaderboard_display_month")}
                disabled={saving !== null}
              >
                {saving === "leaderboard_display_month" ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Freeze to Month"
                )}
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
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
