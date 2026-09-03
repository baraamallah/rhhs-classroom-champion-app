"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  archiveEvaluations,
  getAllEvaluationsForManagement,
} from "@/app/actions/data-management-actions"
import { Loader2, Archive, Search, FileSpreadsheet, Trophy } from "lucide-react"
import { MonthlyWinnersManager } from "@/components/features/leaderboard/monthly-winners-manager"
import { GlobalSystemControls } from "@/components/features/admin/global-system-controls"
import { DefaultMonthSettings } from "@/components/features/admin/default-month-settings"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { getAdminSettings } from "@/app/actions/winners-page-actions"
import type { AdminSettings } from "@/app/actions/winners-page-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EvaluationData {
  id: string
  evaluation_date: string
  total_score: number
  max_score: number
  created_at: string
  classrooms: { name: string; grade: string } | null
  users: { name: string } | null
}

export function DataManagementPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean
    count: number
  }>({ open: false, count: 0 })

  const [evaluations, setEvaluations] = useState<EvaluationData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSettings | undefined>(undefined)

  useEffect(() => {
    loadEvaluations()
    loadAdminSettings()
  }, [])

  const loadAdminSettings = async () => {
    const result = await getAdminSettings()
    if (result.success && result.settings) {
      setAdminSettings(result.settings)
    }
  }

  const loadEvaluations = async () => {
    setLoading(true)
    const result = await getAllEvaluationsForManagement()
    setLoading(false)

    if (result.success && result.data) {
      setEvaluations(result.data as EvaluationData[])
      console.log(`[DataManagementPanel] Loaded ${result.data.length} evaluations`)
    } else if (result.error) {
      console.error("[DataManagementPanel] Error loading evaluations:", result.error)
      toast({
        title: "Error loading evaluations",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const filteredEvaluations = useMemo(() => {
    if (!searchTerm) return evaluations
    const term = searchTerm.toLowerCase()
    return evaluations.filter(
      (evaluation) =>
        evaluation.classrooms?.name.toLowerCase().includes(term) ||
        evaluation.classrooms?.grade.toLowerCase().includes(term) ||
        evaluation.users?.name.toLowerCase().includes(term) ||
        new Date(evaluation.evaluation_date).toLocaleDateString().includes(term)
    )
  }, [evaluations, searchTerm])

  const handleSelectAll = () => {
    if (selectedEvaluations.length === filteredEvaluations.length) {
      setSelectedEvaluations([])
    } else {
      setSelectedEvaluations(filteredEvaluations.map((e) => e.id))
    }
  }

  const toggleSelection = (id: string) => {
    if (selectedEvaluations.includes(id)) {
      setSelectedEvaluations(selectedEvaluations.filter((e) => e !== id))
    } else {
      setSelectedEvaluations([...selectedEvaluations, id])
    }
  }

  const handleArchiveSelected = async () => {
    if (selectedEvaluations.length === 0) return

    setLoading(true)
    const result = await archiveEvaluations(selectedEvaluations)
    setLoading(false)
    setArchiveDialog({ open: false, count: 0 })

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setSelectedEvaluations([])
      loadEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to archive evaluations",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Core Administration"
        badgeLabel="Data Operations & System Control"
        title="System & Settings"
        description="Configure global runtime controls, manage default display months, and oversee evaluation lifecycle archives."
      />

      <GlobalSystemControls
        initialSettings={adminSettings}
        onSettingsChange={setAdminSettings}
      />

      <DefaultMonthSettings
        initialWinnersMonth={adminSettings?.winners_display_month}
        initialLeaderboardMonth={adminSettings?.leaderboard_display_month}
      />

      <Tabs defaultValue="archive" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl h-auto w-full sm:w-auto">
          <TabsTrigger
            value="archive"
            className="rounded-lg py-2.5 px-8 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive Operations
          </TabsTrigger>
          <TabsTrigger
            value="winners"
            className="rounded-lg py-2.5 px-8 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold"
          >
            <Trophy className="h-4 w-4 mr-2 text-amber-500" />
            Monthly Winners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="archive" className="space-y-6 mt-6">
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-primary" />
                  Archive Active Evaluations
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select active evaluations to move to the archive table. This preserves historical records while clearing the active queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by classroom, grade, supervisor, or date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={selectedEvaluations.length > 0 ? "default" : "outline"}
                  onClick={() => setArchiveDialog({ open: true, count: selectedEvaluations.length })}
                  disabled={loading || selectedEvaluations.length === 0}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive ({selectedEvaluations.length})
                </Button>
              </div>

              <div className="border border-border/70 rounded-xl overflow-hidden">
                <div className="flex items-center p-3 border-b bg-muted/40">
                  <Checkbox
                    checked={
                      selectedEvaluations.length === filteredEvaluations.length &&
                      filteredEvaluations.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    disabled={loading || filteredEvaluations.length === 0}
                  />
                  <span className="ml-3 text-sm font-medium text-muted-foreground">
                    {selectedEvaluations.length} selected
                  </span>
                </div>
                <div className="max-h-100 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading evaluations...
                    </div>
                  ) : filteredEvaluations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {searchTerm ? "No evaluations match your search." : "No evaluations found."}
                    </div>
                  ) : (
                    filteredEvaluations.map((evaluation) => (
                      <div
                        key={evaluation.id}
                        className="flex items-center p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <Checkbox
                          checked={selectedEvaluations.includes(evaluation.id)}
                          onCheckedChange={() => toggleSelection(evaluation.id)}
                          disabled={loading}
                        />
                        <div className="ml-3 flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {evaluation.classrooms?.name || "Unknown"}
                              <span className="text-muted-foreground font-normal ml-1">
                                ({evaluation.classrooms?.grade || "N/A"})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supervisor: {evaluation.users?.name || "Unknown"}
                            </p>
                          </div>
                          <div className="text-right md:text-left">
                            <p className="text-sm font-semibold text-foreground">
                              Score: {evaluation.total_score}/{evaluation.max_score}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(evaluation.evaluation_date).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 font-mono">
                              {evaluation.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={loadEvaluations} disabled={loading} size="sm">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary/20 bg-primary/5 overflow-hidden">
            <CardHeader className="p-4 sm:p-5">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Data Exports & Reporting
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  Dedicated Page Available
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                System database backups, multi-sheet Master Excel reports, and custom filtered evaluation queries are housed in the dedicated <strong>Data Exports</strong> tab in the navigation sidebar. Academic year snapshots and table restores are managed in the <strong>Academic Archive</strong> tab.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="winners" className="mt-6">
          <MonthlyWinnersManager />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={archiveDialog.open}
        onOpenChange={(open) => setArchiveDialog({ ...archiveDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveDialog.count} Evaluations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the selected evaluations to the archive table and remove them from the active list.
              This action preserves the data for history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchiveSelected}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive Selected
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
