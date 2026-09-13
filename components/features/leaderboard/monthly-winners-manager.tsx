"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  TrophyIcon,
  Calendar,
  Award,
  Trash2,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Crown
} from "lucide-react"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import {
  declareMonthlyWinner,
  getMonthlyWinners,
  deleteMonthlyWinner,
  getTopClassroomsByDivision,
} from "@/app/actions/monthly-winners-actions"
import { getClassrooms } from "@/lib/supabase-data"
import type { Classroom } from "@/lib/types"
import { m, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import { WinnerCertificateModal } from "@/components/features/leaderboard/winner-certificate-modal"
import Link from "next/link"

const DIVISIONS = DIVISION_OPTIONS.map((opt) => opt.value)
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
  { value: 12, label: "December" },
]

export function MonthlyWinnersManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [batchDeclaring, setBatchDeclaring] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [winners, setWinners] = useState<any[]>([])
  const [topClassrooms, setTopClassrooms] = useState<Record<string, any[]>>({})
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; winnerId: string; divisionName?: string }>({
    open: false,
    winnerId: "",
  })
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [manualSelection, setManualSelection] = useState<Record<string, string>>({})
  const [changingDivision, setChangingDivision] = useState<string | null>(null)

  // Certificate Modal State
  const [previewWinner, setPreviewWinner] = useState<{
    classroomName: string
    grade: string
    division: string
    rank: number
    totalScore: number
    averageScore: number
    evaluationCount: number
    month: string
    year: number
    winCount?: number
  } | null>(null)
  const [isCertificateOpen, setIsCertificateOpen] = useState(false)

  const hasMounted = useRef(false)

  const loadWinners = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getMonthlyWinners(selectedYear, selectedMonth)
      if (result.success) {
        setWinners(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load winners",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth, toast])

  const loadClassrooms = useCallback(async () => {
    try {
      const data = await getClassrooms()
      setClassrooms(data)
    } catch (error) {
      console.error("Error loading classrooms:", error)
    }
  }, [])

  const loadTopClassrooms = useCallback(async () => {
    setLoading(true)
    const topClassroomsMap: Record<string, any[]> = {}

    try {
      const results = await Promise.all(
        DIVISIONS.map(async (division) => ({
          division,
          result: await getTopClassroomsByDivision(division, selectedYear, selectedMonth),
        }))
      )
      for (const { division, result } of results) {
        if (result.success) {
          topClassroomsMap[division] = result.data || []
        }
      }
      setTopClassrooms(topClassroomsMap)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      void loadClassrooms()
    }
    void Promise.all([loadWinners(), loadTopClassrooms()])
  }, [loadClassrooms, loadTopClassrooms, loadWinners])

  const handleDeclareWinner = async (division: string, classroomData: any) => {
    if (!classroomData || !classroomData.classroom) return

    setLoading(true)
    let result
    try {
      result = await declareMonthlyWinner(
        classroomData.classroom.id,
        division,
        selectedYear,
        selectedMonth,
        classroomData.totalScore || 0,
        classroomData.averageScore || 0,
        classroomData.evaluationCount || 0
      )
    } finally {
      setLoading(false)
    }

    if (result.success) {
      toast({
        title: "Winner Declared!",
        description: `Successfully crowned ${classroomData.classroom.name} as ${getDivisionDisplayName(division)} Champion.`,
      })
      setChangingDivision(null)
      loadWinners()
      loadTopClassrooms()
    } else {
      toast({
        title: "Declaration Failed",
        description: result.error || "Failed to declare winner",
        variant: "destructive",
      })
    }
  }

  // Auto-Declare All #1 Leaders
  const handleAutoDeclareAllLeaders = async () => {
    setBatchDeclaring(true)
    let declaredCount = 0
    let failureCount = 0

    try {
      for (const division of DIVISIONS) {
        const existingWinner = winners.find((w) => w.division === division)
        if (existingWinner) continue // already declared

        const topContenders = topClassrooms[division] || []
        if (topContenders.length > 0) {
          const leader = topContenders[0]
          const res = await declareMonthlyWinner(
            leader.classroom.id,
            division,
            selectedYear,
            selectedMonth,
            leader.totalScore || 0,
            leader.averageScore || 0,
            leader.evaluationCount || 0
          )
          if (res.success) {
            declaredCount++
          } else {
            failureCount++
          }
        }
      }

      if (declaredCount > 0) {
        toast({
          title: "Auto-Declaration Complete",
          description: `Successfully declared ${declaredCount} division champions from top evaluations!`,
        })
      } else if (failureCount === 0) {
        toast({
          title: "No Action Needed",
          description: "All divisions are already declared or lack evaluation records.",
        })
      }

      await Promise.all([loadWinners(), loadTopClassrooms()])
    } catch (err: any) {
      toast({
        title: "Batch Declaration Error",
        description: err.message || "Failed to complete auto-declaration.",
        variant: "destructive",
      })
    } finally {
      setBatchDeclaring(false)
      setBatchConfirmOpen(false)
    }
  }

  const handleDeleteWinner = async () => {
    if (!deleteDialog.winnerId) return

    setLoading(true)
    let result
    try {
      result = await deleteMonthlyWinner(deleteDialog.winnerId)
    } finally {
      setLoading(false)
    }
    setDeleteDialog({ open: false, winnerId: "" })

    if (result.success) {
      toast({
        title: "Winner Removed",
        description: "The champion declaration has been removed.",
      })
      loadWinners()
      loadTopClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete winner",
        variant: "destructive",
      })
    }
  }

  const handleManualDeclare = (division: string) => {
    const classroomId = manualSelection[division]
    if (!classroomId) return

    const topClassroom = topClassrooms[division]?.find((c) => c.classroom.id === classroomId)
    if (topClassroom) {
      handleDeclareWinner(division, topClassroom)
    } else {
      const classroom = classrooms.find((c) => c.id === classroomId)
      if (classroom) {
        handleDeclareWinner(division, {
          classroom,
          totalScore: 0,
          averageScore: 0,
          evaluationCount: 0,
        })
      }
    }

    setManualSelection((prev) => {
      const next = { ...prev }
      delete next[division]
      return next
    })
  }

  const handleOpenCertificate = (winnerRecord: any) => {
    setPreviewWinner({
      classroomName: winnerRecord.classrooms?.name || "Classroom Champion",
      grade: winnerRecord.classrooms?.grade || "N/A",
      division: winnerRecord.division,
      rank: 1,
      totalScore: winnerRecord.total_score,
      averageScore: Number(winnerRecord.average_score),
      evaluationCount: winnerRecord.evaluation_count,
      month: MONTHS.find((m) => m.value === winnerRecord.month)?.label || "Current",
      year: winnerRecord.year,
    })
    setIsCertificateOpen(true)
  }

  // Count unassigned divisions with eligible #1 leaders
  const unassignedWithLeaders = useMemo(() => {
    return DIVISIONS.filter((division) => {
      const isDeclared = winners.some((w) => w.division === division)
      const hasLeader = (topClassrooms[division] || []).length > 0
      return !isDeclared && hasLeader
    })
  }, [winners, topClassrooms])

  const declaredCount = winners.length
  const totalDivisions = DIVISIONS.length
  const progressPercent = Math.round((declaredCount / totalDivisions) * 100)
  const currentMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || ""

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <LazyMotionProvider>
      <div className="space-y-6">
        {/* Certificate Modal for instant preview */}
        <WinnerCertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          winner={previewWinner}
        />

        {/* Executive Header & Month Controls Bar */}
        <Card className="rounded-2xl border-amber-500/30 shadow-md bg-linear-to-r from-amber-500/10 via-card to-card overflow-hidden">
          <CardHeader className="p-4 sm:p-6 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Monthly Award Administration</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black tracking-tight">
                  Declare Monthly Champions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Review division standings, declare official winners, and preview certificates for the public showcase.
                </CardDescription>
              </div>

              {/* View Public Winners Link */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full min-h-11 px-4 gap-2 bg-card/80 hover:border-amber-500/60 text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
              >
                <Link href="/winners" target="_blank">
                  <span>View Public /winners</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Period Selector & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Year Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Academic Year
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="min-h-11 font-semibold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="font-medium">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Competition Month
                </label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger className="min-h-11 font-semibold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()} className="font-medium">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 1-Click Auto Declare Button */}
              <div>
                <Button
                  onClick={() => setBatchConfirmOpen(true)}
                  disabled={batchDeclaring || loading || unassignedWithLeaders.length === 0}
                  className="w-full min-h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 text-xs sm:text-sm cursor-pointer transition-all"
                >
                  <Zap className={`w-4 h-4 mr-2 ${batchDeclaring ? "animate-spin" : "fill-current"}`} />
                  <span>
                    Auto-Declare All #1s ({unassignedWithLeaders.length})
                  </span>
                </Button>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="p-4 rounded-xl bg-card/70 border border-border/80 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold flex items-center gap-1.5 text-foreground">
                  <TrophyIcon className="w-4 h-4 text-amber-500" />
                  <span>Declaration Progress: {currentMonthLabel} {selectedYear}</span>
                </span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {declaredCount} of {totalDivisions} Divisions Crowned ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Division Declaring Cards Grid */}
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((division) => {
            const winner = winners.find((w) => w.division === division)
            const topContenders = topClassrooms[division] || []
            const leader = topContenders[0]
            const isChanging = changingDivision === division

            return (
              <Card
                key={division}
                className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                  winner
                    ? "border-2 border-amber-400/80 dark:border-amber-500/70 shadow-md shadow-amber-500/10 bg-linear-to-b from-amber-500/10 via-card to-card"
                    : "border border-border/80 bg-card/60"
                }`}
              >
                {/* Division Card Header */}
                <CardHeader className="p-4 pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          winner ? "bg-amber-500 shadow-xs shadow-amber-500" : "bg-muted-foreground/40"
                        }`}
                      />
                      <CardTitle className="text-base font-extrabold truncate">
                        {getDivisionDisplayName(division)}
                      </CardTitle>
                    </div>

                    {winner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3 h-3 text-amber-500" />
                        <span>Declared</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">
                        <AlertCircle className="w-3 h-3" />
                        <span>Action Needed</span>
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* State 1: Winner Already Declared (Unless changing) */}
                  {winner && !isChanging ? (
                    <div className="space-y-3.5">
                      {/* Champion Identity Box */}
                      <div className="p-3.5 rounded-xl bg-linear-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">
                              Current Champion
                            </span>
                            <p className="text-base font-black text-foreground truncate">
                              {winner.classrooms?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Grade {winner.classrooms?.grade || "N/A"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                              {winner.total_score}
                            </p>
                            <p className="text-[9px] uppercase font-bold text-muted-foreground">points</p>
                          </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Average</span>
                            <p className="font-bold text-foreground">{Number(winner.average_score).toFixed(1)}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Evaluations</span>
                            <p className="font-bold text-foreground">{winner.evaluation_count}</p>
                          </div>
                        </div>

                        {winner.declared_by_user && (
                          <p className="text-[10px] text-muted-foreground mt-2 italic">
                            Declared by: {winner.declared_by_user.name}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons: Preview Certificate, Change, Remove */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleOpenCertificate(winner)}
                          variant="outline"
                          size="sm"
                          className="w-full min-h-10 rounded-xl font-bold bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs cursor-pointer gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Preview Certificate</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => setChangingDivision(division)}
                            variant="outline"
                            size="sm"
                            className="min-h-10 text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Change Winner
                          </Button>
                          <Button
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                winnerId: winner.id,
                                divisionName: getDivisionDisplayName(division),
                              })
                            }
                            variant="ghost"
                            size="sm"
                            className="min-h-10 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* State 2: Winner Not Declared OR Currently Changing */
                    <div className="space-y-4">
                      {isChanging && (
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            Changing Champion
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChangingDivision(null)}
                            className="h-7 text-xs px-2 cursor-pointer"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Live #1 Leader from Evaluations */}
                      {leader ? (
                        <div className="p-3.5 rounded-xl bg-card border-2 border-amber-500/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                              <Crown className="w-3 h-3 text-amber-500" />
                              #1 Live Leader
                            </span>
                            <span className="text-xs font-extrabold text-foreground">
                              {leader.totalScore} pts
                            </span>
                          </div>

                          <div>
                            <p className="font-extrabold text-base text-foreground leading-snug">
                              {leader.classroom.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Grade {leader.classroom.grade} • Avg: {leader.averageScore.toFixed(1)} ({leader.evaluationCount} evals)
                            </p>
                          </div>

                          {/* 1-Click Declare Button */}
                          <Button
                            onClick={() => handleDeclareWinner(division, leader)}
                            disabled={loading}
                            className="w-full min-h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs shadow-xs cursor-pointer gap-1.5"
                          >
                            <Award className="w-4 h-4 mr-1" />
                            <span>Declare {leader.classroom.name} as Champion</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 text-center rounded-xl bg-muted/40 border border-border/60">
                          <p className="text-xs font-semibold text-muted-foreground">
                            No evaluations found in {currentMonthLabel} {selectedYear}
                          </p>
                        </div>
                      )}

                      {/* Runner-Ups Quick Picker (if > 1 classroom in topContenders) */}
                      {topContenders.length > 1 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Or Pick From Contenders:
                          </p>
                          <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                            {topContenders.slice(1, 4).map((contender, cIdx) => (
                              <div
                                key={contender.classroom.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/70 hover:border-amber-500/40 text-xs transition-colors"
                              >
                                <div className="min-w-0 flex-1 mr-2">
                                  <span className="font-bold text-foreground truncate block">
                                    #{cIdx + 2} {contender.classroom.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {contender.totalScore} pts • Avg {contender.averageScore.toFixed(1)}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleDeclareWinner(division, contender)}
                                  disabled={loading}
                                  className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-muted hover:bg-amber-500/20 text-foreground cursor-pointer shrink-0"
                                >
                                  Declare
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manual Override Selector */}
                      <div className="pt-2 border-t border-border/50 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Custom Classroom Override:
                        </p>
                        <div className="flex gap-2">
                          <Select
                            value={manualSelection[division] || ""}
                            onValueChange={(v) =>
                              setManualSelection((prev) => ({ ...prev, [division]: v }))
                            }
                          >
                            <SelectTrigger className="flex-1 min-h-10 text-xs">
                              <SelectValue placeholder="Select classroom..." />
                            </SelectTrigger>
                            <SelectContent>
                              {classrooms
                                .filter((c) => c.division === division)
                                .map((c) => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">
                                    {c.name} (Grade {c.grade})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            disabled={!manualSelection[division] || loading}
                            onClick={() => handleManualDeclare(division)}
                            className="min-h-10 px-3 text-xs font-bold cursor-pointer shrink-0"
                          >
                            Set
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, winnerId: "" })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Champion Declaration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will revoke the winner status for {deleteDialog.divisionName || "this division"} in{" "}
                {currentMonthLabel} {selectedYear}. The certificate will no longer be visible on the public /winners page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <AlertDialogCancel className="min-h-11 cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteWinner}
                className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              >
                Delete Declaration
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Auto-Declare All Leaders Confirmation Dialog */}
        <AlertDialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-current" />
                <span>Auto-Declare {unassignedWithLeaders.length} Division Champions?</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-xs sm:text-sm">
                <span>
                  This will automatically declare the #1 ranked classroom from active evaluations for each undeclared division in {currentMonthLabel} {selectedYear}:
                </span>
                <ul className="list-disc pl-5 font-semibold text-foreground space-y-1">
                  {unassignedWithLeaders.map((div) => {
                    const ldr = topClassrooms[div]?.[0]
                    return (
                      <li key={div}>
                        {getDivisionDisplayName(div)}: <strong>{ldr?.classroom?.name}</strong> ({ldr?.totalScore} pts)
                      </li>
                    )
                  })}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <AlertDialogCancel className="min-h-11 cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAutoDeclareAllLeaders}
                disabled={batchDeclaring}
                className="min-h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                {batchDeclaring ? "Declaring..." : "Confirm Auto-Declaration"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LazyMotionProvider>
  )
}
