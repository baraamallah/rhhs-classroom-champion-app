"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  createAcademicYearArchive,
  getAcademicArchives,
  getAcademicArchiveById,
  deleteAcademicArchive,
} from "@/app/actions/data-management-actions"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import {
  Archive,
  Calendar,
  Trophy,
  Search,
  Sparkles,
  Layers,
  ArrowLeft,
  Trash2,
  FileText,
  Building2,
  Loader2,
  AlertTriangle,
  History,
  CheckCircle2,
} from "lucide-react"

export function AcademicArchiveManager() {
  const { toast } = useToast()
  const [archives, setArchives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [divisionFilter, setDivisionFilter] = useState("all")

  // Create form state
  const [archiveName, setArchiveName] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [archiveDescription, setArchiveDescription] = useState("")

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    setLoading(true)
    try {
      const res = await getAcademicArchives()
      if (res.success) {
        setArchives(res.data)
      }
    } catch (err) {
      console.error("Failed to load academic archives:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = async (archiveId: string) => {
    setLoadingDetail(true)
    try {
      const res = await getAcademicArchiveById(archiveId)
      if (res.success && res.data) {
        setSelectedArchive(res.data)
      } else {
        toast({ title: "Error", description: res.error || "Failed to load archive details", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCreateArchive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archiveName.trim()) {
      toast({ title: "Missing Name", description: "Please provide an archive name", variant: "destructive" })
      return
    }

    setCreating(true)
    try {
      const res = await createAcademicYearArchive(archiveName, archiveDescription, academicYear)
      if (res.success) {
        toast({
          title: "Academic Year Archived!",
          description: res.message || "Standings preserved and active evaluations reset for the new school year.",
        })
        setShowCreateModal(false)
        setArchiveName("")
        setAcademicYear("")
        setArchiveDescription("")
        await loadArchives()
      } else {
        toast({ title: "Archive Failed", description: res.error || "Failed to create archive", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Unexpected error occurred", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteArchive = async (archiveId: string) => {
    if (!confirm("Are you sure you want to permanently delete this academic year archive?")) return

    try {
      const res = await deleteAcademicArchive(archiveId)
      if (res.success) {
        toast({ title: "Archive Deleted", description: "The academic archive has been removed." })
        setSelectedArchive(null)
        await loadArchives()
      } else {
        toast({ title: "Delete Failed", description: res.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // Filter classrooms in snapshot
  const filteredLeaderboard = (selectedArchive?.leaderboard_snapshot || []).filter((item: any) => {
    const matchesSearch =
      item.classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classroom.grade.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDiv = divisionFilter === "all" || item.classroom.division === divisionFilter
    return matchesSearch && matchesDiv
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-emerald-500/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Long-Term History
            </Badge>
            <span className="text-xs text-muted-foreground">Historical Records & Year Transitions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Academic Year Archives
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Archive full school years with frozen final leaderboards, division champions, and evaluation records.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02]"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          New Year Archive
        </Button>
      </div>

      {/* Selected Archive Detailed View */}
      {selectedArchive ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedArchive(null)}
              className="rounded-xl text-xs"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Archive Library
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteArchive(selectedArchive.id)}
                className="text-destructive hover:bg-destructive/10 text-xs rounded-xl"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Archive
              </Button>
            </div>
          </div>

          {/* Archive Summary Header */}
          <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <History className="h-6 w-6 text-primary" />
                    {selectedArchive.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {selectedArchive.description || "Academic year historical snapshot."}
                  </CardDescription>
                </div>
                <div className="text-xs text-muted-foreground">
                  Archived on: {new Date(selectedArchive.archived_at).toLocaleDateString()}
                </div>
              </div>

              {/* Division Champions Podium */}
              {selectedArchive.division_champions && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {Object.entries(selectedArchive.division_champions).map(([division, champ]: [string, any]) => (
                    <div
                      key={division}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center text-center"
                    >
                      <Trophy className="h-4 w-4 text-amber-500 mb-1" />
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                        {division}
                      </span>
                      <span className="font-bold text-xs text-foreground mt-0.5">{champ.name}</span>
                      <span className="text-[10px] text-muted-foreground">{champ.totalScore} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Historical Leaderboard Search and Division Tabs */}
          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">Final Historical Standings</CardTitle>
                  <CardDescription className="text-xs">
                    Classroom scores and rankings preserved from this academic period
                  </CardDescription>
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    placeholder="Search historical classroom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Division Pills */}
              <div className="flex flex-wrap gap-1.5 pt-3">
                <Button
                  size="sm"
                  variant={divisionFilter === "all" ? "default" : "outline"}
                  onClick={() => setDivisionFilter("all")}
                  className="h-7 text-xs rounded-full"
                >
                  All Divisions
                </Button>
                {DIVISION_OPTIONS.map((d) => (
                  <Button
                    key={d.value}
                    size="sm"
                    variant={divisionFilter === d.value ? "default" : "outline"}
                    onClick={() => setDivisionFilter(d.value)}
                    className="h-7 text-xs rounded-full"
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {filteredLeaderboard.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No classrooms match your search in this historical archive.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLeaderboard.map((item: any, idx: number) => {
                    const rank = idx + 1
                    return (
                      <div
                        key={item.classroom.id || idx}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/70 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              rank === 1
                                ? "bg-amber-500/20 text-amber-600 border border-amber-500/30 font-black"
                                : rank === 2
                                ? "bg-slate-300/30 text-slate-700 dark:text-slate-300 font-bold"
                                : rank === 3
                                ? "bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold"
                                : "bg-background text-muted-foreground border border-border"
                            }`}
                          >
                            #{rank}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{item.classroom.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Grade {item.classroom.grade} &bull; {getDivisionDisplayName(item.classroom.division) || "Standard"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-extrabold text-sm text-foreground">{item.totalScore || 0} pts</p>
                          <p className="text-[11px] text-muted-foreground">Avg: {item.averageScore || 0}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Archive Library Cards Grid */
        <div>
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm">Loading academic archives...</p>
            </div>
          ) : archives.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-border p-12 text-center">
              <Archive className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground mb-1">No Academic Archives Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                At the end of an academic year or competition term, create a New Year Archive to snapshot final standings and start fresh.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="rounded-xl">
                <Sparkles className="mr-2 h-4 w-4" /> Create First Archive
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archives.map((archive) => (
                <Card
                  key={archive.id}
                  onClick={() => handleOpenDetail(archive.id)}
                  className="rounded-2xl border-border/80 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-muted text-foreground">
                        {archive.academic_year || "Academic Year"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(archive.archived_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors mt-2">
                      {archive.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {archive.description || "Preserved final standings and evaluations."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Evaluations</span>
                        <span className="font-bold text-foreground">{archive.total_evaluations || 0} records</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Classrooms</span>
                        <span className="font-bold text-foreground">{archive.total_classrooms || 0} rooms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* "New Year Archive" Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Create New Year Archive
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              This action snapshots current leaderboards and stores all evaluations into a permanent archive file, resetting live evaluations for the new year.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateArchive} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="archive-name">Archive Title *</Label>
              <Input
                id="archive-name"
                placeholder="e.g. Academic Year 2025-2026"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="academic-year">Academic Year Label</Label>
              <Input
                id="academic-year"
                placeholder="e.g. 2025-2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="archive-desc">Notes / Description</Label>
              <Textarea
                id="archive-desc"
                placeholder="e.g. Final annual green champions across all 5 school divisions."
                value={archiveDescription}
                onChange={(e) => setArchiveDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                All active classrooms and user accounts will remain untouched. Only active evaluations will be moved to the archive.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="bg-primary hover:bg-primary/90">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Archiving...
                  </>
                ) : (
                  "Archive & Reset Live Board"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
