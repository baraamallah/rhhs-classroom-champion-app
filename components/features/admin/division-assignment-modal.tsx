"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { assignSupervisorToClassrooms, assignDivisionToSupervisor } from "@/app/actions/user-actions"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { Search, Sparkles, Building2, CheckSquare, Square, Layers, Loader2 } from "lucide-react"

interface Classroom {
  id: string
  name: string
  grade: string
  division?: string
}

interface DivisionAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  supervisor: { id: string; name: string; email?: string } | null
  availableClassrooms: Classroom[]
  currentAssignedIds: string[]
  onSuccess: () => void
}

export function DivisionAssignmentModal({
  isOpen,
  onClose,
  supervisor,
  availableClassrooms,
  currentAssignedIds,
  onSuccess,
}: DivisionAssignmentModalProps) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>(currentAssignedIds)
  const [searchQuery, setSearchQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [activeDivisionTab, setActiveDivisionTab] = useState<string>("all")

  // Sync initial selection whenever modal opens with new supervisor
  useMemo(() => {
    setSelectedIds(currentAssignedIds)
  }, [currentAssignedIds, isOpen])

  const filteredClassrooms = useMemo(() => {
    return availableClassrooms.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.division && c.division.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDivision = activeDivisionTab === "all" || c.division === activeDivisionTab

      return matchesSearch && matchesDivision
    })
  }, [availableClassrooms, searchQuery, activeDivisionTab])

  // Group classrooms by division for easy display
  const classroomsByDivision = useMemo(() => {
    const groups: Record<string, Classroom[]> = {}
    DIVISION_OPTIONS.forEach((d) => {
      groups[d.value] = availableClassrooms.filter((c) => c.division === d.value)
    })
    return groups
  }, [availableClassrooms])

  const handleToggleClassroom = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleAssignWholeDivision = async (division: string) => {
    if (!supervisor) return
    const divisionRooms = classroomsByDivision[division] || []
    if (divisionRooms.length === 0) {
      toast({
        title: "No Classrooms Found",
        description: `No active classrooms exist in division "${division}".`,
        variant: "destructive",
      })
      return
    }

    const divisionIds = divisionRooms.map((c) => c.id)
    // Add all division classrooms to selectedIds without duplicating
    setSelectedIds((prev) => Array.from(new Set([...prev, ...divisionIds])))

    toast({
      title: `${division} Selected`,
      description: `Added ${divisionIds.length} classrooms to selection. Click "Save Assignments" to commit.`,
    })
  }

  const handleRemoveWholeDivision = (division: string) => {
    const divisionRooms = classroomsByDivision[division] || []
    const divisionIds = new Set(divisionRooms.map((c) => c.id))
    setSelectedIds((prev) => prev.filter((id) => !divisionIds.has(id)))

    toast({
      title: `${division} Removed`,
      description: `Removed ${divisionRooms.length} classrooms from selection.`,
    })
  }

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredClassrooms.map((c) => c.id)
    setSelectedIds((prev) => Array.from(new Set([...prev, ...idsToAdd])))
  }

  const handleDeselectAllFiltered = () => {
    const idsToRemove = new Set(filteredClassrooms.map((c) => c.id))
    setSelectedIds((prev) => prev.filter((id) => !idsToRemove.has(id)))
  }

  const handleSave = async () => {
    if (!supervisor) return
    setSaving(true)
    try {
      const result = await assignSupervisorToClassrooms(supervisor.id, selectedIds)
      if (result.success) {
        toast({
          title: "Assignments Updated",
          description: `Successfully assigned ${selectedIds.length} classrooms to ${supervisor.name}.`,
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Assignment Failed",
          description: result.error || "Could not update assignments.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!supervisor) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary bg-primary/10 border-primary/20">
                  Supervisor Assignments
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedIds.length} Selected
                </span>
              </div>
              <DialogTitle className="text-xl font-bold">
                Assign Classrooms to {supervisor.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Assign individual classrooms or click any division pill below to select the whole division at once.
              </DialogDescription>
            </div>
          </div>

          {/* Quick Whole-Division 1-Click Selectors */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> 1-Click Whole Division Quick-Assign:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DIVISION_OPTIONS.map((div) => {
                const count = (classroomsByDivision[div.value] || []).length
                const selectedInDiv = (classroomsByDivision[div.value] || []).filter((c) =>
                  selectedIds.includes(c.id)
                ).length
                const allSelected = count > 0 && selectedInDiv === count

                return (
                  <Button
                    key={div.value}
                    type="button"
                    variant={allSelected ? "default" : "outline"}
                    size="sm"
                    className={`h-7 text-xs rounded-full transition-all ${
                      allSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() =>
                      allSelected
                        ? handleRemoveWholeDivision(div.value)
                        : handleAssignWholeDivision(div.value)
                    }
                  >
                    {div.label} ({selectedInDiv}/{count})
                  </Button>
                )
              })}
            </div>
          </div>
        </DialogHeader>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by room name or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-9 rounded-xl border-border"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="h-8 text-xs text-primary font-medium"
            >
              <CheckSquare className="mr-1 h-3.5 w-3.5" /> Select All Filtered
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeselectAllFiltered}
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
            >
              <Square className="mr-1 h-3.5 w-3.5" /> Clear Filtered
            </Button>
          </div>
        </div>

        {/* Scrollable Classrooms List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-95 scrollbar-thin">
          {filteredClassrooms.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium">No classrooms found matching your filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredClassrooms.map((classroom) => {
                const isChecked = selectedIds.includes(classroom.id)

                return (
                  <div
                    key={classroom.id}
                    onClick={() => handleToggleClassroom(classroom.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
                      isChecked
                        ? "bg-primary/10 border-primary/40 shadow-xs text-foreground"
                        : "bg-card border-border/70 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleClassroom(classroom.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-sm text-foreground truncate">{classroom.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Grade {classroom.grade} &bull; {classroom.division || "No Division"}
                        </p>
                      </div>
                    </div>

                    {classroom.division && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0 font-normal ml-2 hidden sm:inline-flex"
                      >
                        {classroom.division}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border bg-card/60 backdrop-blur-sm flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground font-medium">
            Total Selected: <span className="font-bold text-foreground">{selectedIds.length}</span> /{" "}
            {availableClassrooms.length}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                `Save Assignments (${selectedIds.length})`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
