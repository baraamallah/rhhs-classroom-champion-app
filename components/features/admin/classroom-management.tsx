"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Plus, Pencil, Trash2, Users, MoreVertical, Filter, CheckSquare, Square, Info, Layers, GraduationCap, Search, X } from "lucide-react"
import { createClassroom, updateClassroom, deleteClassroom, bulkUpdateClassroomDivisions } from "@/lib/supabase-data"
import { getAllUsers } from "@/app/actions/user-actions"
import { createClient } from "@/lib/supabase/client"
import type { Classroom, User } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"

interface ClassroomManagementProps {
  currentUser: User
}

interface ClassroomFormData {
  name: string
  grade: string
  division: string
  description: string
  supervisorIds: string[]
}

export function ClassroomManagement({ currentUser }: ClassroomManagementProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ClassroomFormData>({
    name: "",
    grade: "",
    division: "",
    description: "",
    supervisorIds: [],
  })

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadClassrooms(), loadSupervisors()])
      setLoading(false)
    }
    init()
  }, [])

  const loadClassrooms = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("classrooms")
        .select(`
          *,
          classroom_supervisors!classroom_id(
            supervisor_id,
            users!classroom_supervisors_supervisor_id_fkey(id, name, email)
          )
        `)
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error fetching classrooms:", error)
        toast({
          title: "Error",
          description: "Failed to load classrooms",
          variant: "destructive",
        })
      } else {
        // Transform data to flatten the nested structure
        const transformedData = (data || []).map((classroom: any) => ({
          ...classroom,
          supervisors: classroom.classroom_supervisors?.map((s: any) => s.users) || []
        }))
        setClassrooms(transformedData)
      }
    } catch (error) {
      console.error("Exception fetching classrooms:", error)
      toast({
        title: "Error",
        description: "Failed to load classrooms",
        variant: "destructive",
      })
    }
  }

  const loadSupervisors = async () => {
    try {
      const result = await getAllUsers()
      if (result.success) {
        // Filter to only supervisors
        const supervisorUsers = result.data.filter((user: any) => user.role === "supervisor")
        setSupervisors(supervisorUsers)
      } else {
        console.error("Failed to load supervisors:", result.error)
      }
    } catch (error) {
      console.error("Error loading supervisors:", error)
    }
  }

  const handleSubmit = async () => {
    setCreating(true)

    const result = await createClassroom(
      formData.name,
      formData.grade,
      formData.division,
      formData.description,
      formData.supervisorIds
    )

    if (result.success) {
      toast({
        title: "Success",
        description: "Classroom created successfully",
      })
      setFormData({ name: "", grade: "", division: "", description: "", supervisorIds: [] })
      setIsAdding(false)
      loadClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create classroom",
        variant: "destructive",
      })
    }

    setCreating(false)
  }

  const handleEdit = (classroom: Classroom) => {
    setEditingId(classroom.id)
    setFormData({
      name: classroom.name,
      grade: classroom.grade,
      division: classroom.division || "",
      description: classroom.description || "",
      supervisorIds: classroom.supervisors?.map(s => s.id) || [],
    })
    setIsAdding(false)
  }

  const handleUpdate = async () => {
    if (!editingId) return

    setCreating(true)

    const result = await updateClassroom(
      editingId,
      formData.name,
      formData.grade,
      formData.division,
      formData.description,
      formData.supervisorIds
    )

    if (result.success) {
      toast({
        title: "Success",
        description: "Classroom updated successfully",
      })
      setEditingId(null)
      setFormData({ name: "", grade: "", division: "", description: "", supervisorIds: [] })
      loadClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update classroom",
        variant: "destructive",
      })
    }

    setCreating(false)
  }

  const handleDelete = async (classroomId: string) => {
    if (!confirm("Are you sure you want to deactivate this classroom?")) return

    const result = await deleteClassroom(classroomId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Classroom deactivated successfully",
      })
      loadClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to deactivate classroom",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ name: "", grade: "", division: "", description: "", supervisorIds: [] })
  }

  const handleToggleSelect = (classroomId: string) => {
    const newSelected = new Set(selectedClassrooms)
    if (newSelected.has(classroomId)) {
      newSelected.delete(classroomId)
    } else {
      newSelected.add(classroomId)
    }
    setSelectedClassrooms(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedClassrooms.size === filteredClassrooms.length) {
      setSelectedClassrooms(new Set())
    } else {
      setSelectedClassrooms(new Set(filteredClassrooms.map(c => c.id)))
    }
  }

  const handleBulkUpdateDivision = async (division: string) => {
    if (selectedClassrooms.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one classroom",
        variant: "destructive",
      })
      return
    }

    setBulkUpdating(true)
    const result = await bulkUpdateClassroomDivisions(Array.from(selectedClassrooms), division)

    if (result.success) {
      toast({
        title: "Success",
        description: `Updated division for ${result.updatedCount || selectedClassrooms.size} classroom(s)`,
      })
      setSelectedClassrooms(new Set())
      loadClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update divisions",
        variant: "destructive",
      })
    }

    setBulkUpdating(false)
  }

  const handleQuickDivisionChange = async (classroomId: string, division: string) => {
    const classroom = classrooms.find(c => c.id === classroomId)
    if (!classroom) return

    setBulkUpdating(true)
    const result = await bulkUpdateClassroomDivisions([classroomId], division)

    if (result.success) {
      toast({
        title: "Success",
        description: "Division updated successfully",
      })
      loadClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update division",
        variant: "destructive",
      })
    }

    setBulkUpdating(false)
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ name: "", grade: "", division: "", description: "", supervisorIds: [] })
  }

  // Filter classrooms by division and normalized search query across name, grade, and all supervisors
  const filteredClassrooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return classrooms.filter((classroom) => {
      const matchesDivision = selectedDivision === "all" || classroom.division === selectedDivision
      if (!matchesDivision) return false
      if (!query) return true

      const matchesName = classroom.name.toLowerCase().includes(query)
      const matchesGrade = classroom.grade.toLowerCase().includes(query)
      const matchesSupervisor = classroom.supervisors?.some((supervisor) =>
        supervisor.name.toLowerCase().includes(query)
      )
      return matchesName || matchesGrade || Boolean(matchesSupervisor)
    })
  }, [classrooms, selectedDivision, searchQuery])

  // Clear selection when filter or search changes
  useEffect(() => {
    setSelectedClassrooms(new Set())
  }, [selectedDivision, searchQuery])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Campus Directory"
        badgeLabel="Divisions & Supervisor Assignments"
        title="Classrooms & Divisions"
        description="Register classrooms, organize grade divisions, and assign faculty supervisors across campus."
        action={
          !isAdding && !editingId ? (
            <Button
              onClick={handleAddNew}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Classroom
            </Button>
          ) : undefined
        }
      />

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 p-5 sm:p-6 border-b">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-primary" />
              Classroom Directory
            </CardTitle>
            <CardDescription className="text-sm">
              Register and organize classrooms for evaluations and tracking.
            </CardDescription>
          </div>
        </CardHeader>
      <CardContent className="p-0 sm:p-6 space-y-6">
        {/* Division Filter and Bulk Actions */}
        <div className="px-4 sm:px-0 space-y-4 pt-4 sm:pt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-muted/20 rounded-xl border border-border/40 shadow-inner">
            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by classroom name, grade, or supervisor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 bg-background h-10 text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Division Selector */}
            <div className="flex items-center gap-2 text-muted-foreground min-w-max">
              <Filter className="h-4 w-4" />
              <Label className="text-sm font-bold uppercase tracking-wider">Division</Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="w-full sm:w-56 bg-background h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All School Divisions</SelectItem>
                  {DIVISION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedClassrooms.size > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-primary/10 border-2 border-primary/20 rounded-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                  {selectedClassrooms.size}
                </div>
                <span className="text-sm font-bold text-primary uppercase tracking-tight">
                  {selectedClassrooms.size === 1 ? 'Classroom' : 'Classrooms'} selected for update
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest whitespace-nowrap">Apply Division:</Label>
                  <Select
                    onValueChange={handleBulkUpdateDivision}
                    disabled={bulkUpdating}
                  >
                    <SelectTrigger className="w-45 bg-background h-9 text-xs">
                      <SelectValue placeholder="Choose division..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClassrooms(new Set())}
                  disabled={bulkUpdating}
                  className="text-xs font-semibold"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Classrooms List */}
        <div className="space-y-4">
          {/* Add Form */}
          {isAdding && (
            <div className="mx-4 sm:mx-0 p-6 bg-primary/5 rounded-xl border-2 border-primary/10 space-y-6 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Plus className="h-5 w-5" />
                Register New Classroom
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Name / Room Number</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Room 101 or Science Lab"
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-xs font-bold uppercase text-muted-foreground">Grade Level</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g., Grade 9"
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division" className="text-xs font-bold uppercase text-muted-foreground">Assigned Division</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(value) => setFormData({ ...formData, division: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase text-muted-foreground">Additional Notes (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description or location details..."
                    rows={2}
                    className="bg-background resize-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Assign Responsible Supervisors</Label>
                  <div className="border-2 border-border/40 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto bg-background/50">
                    {supervisors.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-full py-4 text-center italic">No active supervisors found in the system.</p>
                    ) : (
                      supervisors.map((supervisor) => (
                        <div key={supervisor.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/40">
                          <input
                            type="checkbox"
                            id={`supervisor-${supervisor.id}`}
                            checked={formData.supervisorIds.includes(supervisor.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  supervisorIds: [...formData.supervisorIds, supervisor.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  supervisorIds: formData.supervisorIds.filter(id => id !== supervisor.id)
                                })
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          <label
                            htmlFor={`supervisor-${supervisor.id}`}
                            className="text-xs font-medium cursor-pointer truncate"
                            title={supervisor.email}
                          >
                            {supervisor.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={creating} className="flex-1 sm:flex-none">
                  {creating ? "Saving..." : "Register Classroom"}
                </Button>
                <Button onClick={handleCancel} variant="ghost" className="flex-1 sm:flex-none">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm font-medium">Synchronizing classroom data...</p>
            </div>
          ) : filteredClassrooms.length === 0 ? (
            <div className="py-20 text-center px-6">
              <Info className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-bold text-muted-foreground mb-1">No classrooms found</p>
              <p className="text-sm text-muted-foreground/70 mb-6 max-w-sm mx-auto">
                {searchQuery.trim()
                  ? `No classrooms match "${searchQuery.trim()}"${selectedDivision !== "all" ? ` in the ${getDivisionDisplayName(selectedDivision)} division` : ""}.`
                  : selectedDivision === "all"
                  ? "Your school directory is currently empty. Start by adding a classroom."
                  : `There are no classrooms currently assigned to the ${getDivisionDisplayName(selectedDivision)} division.`}
              </p>
              {searchQuery.trim() ? (
                <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">Clear Search</Button>
              ) : selectedDivision !== "all" ? (
                <Button onClick={() => setSelectedDivision("all")} variant="outline" size="sm">Show All Divisions</Button>
              ) : (
                <Button onClick={handleAddNew} size="sm">Add First Classroom</Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Header */}
              <div className="flex items-center px-4 sm:px-0 py-2 border-b sm:border-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded"
                >
                  {selectedClassrooms.size === filteredClassrooms.length && filteredClassrooms.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span>Toggle All ({filteredClassrooms.length})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 px-4 sm:px-0">
                {filteredClassrooms.map((classroom) => (
                  <div key={classroom.id} className="group relative border border-border/60 rounded-xl bg-card hover:bg-muted/5 transition-all duration-200 hover:shadow-md">
                    {editingId === classroom.id ? (
                      // Inline edit form
                      <div className="p-6 space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Pencil className="h-4 w-4" />
                          Update: {classroom.name}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${classroom.id}`} className="text-xs font-bold uppercase text-muted-foreground">Classroom Name</Label>
                            <Input
                              id={`edit-name-${classroom.id}`}
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="bg-background"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-grade-${classroom.id}`} className="text-xs font-bold uppercase text-muted-foreground">Grade Level</Label>
                            <Input
                              id={`edit-grade-${classroom.id}`}
                              value={formData.grade}
                              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                              className="bg-background"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-division-${classroom.id}`} className="text-xs font-bold uppercase text-muted-foreground">Division</Label>
                            <Select
                              value={formData.division}
                              onValueChange={(value) => setFormData({ ...formData, division: value })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select division" />
                              </SelectTrigger>
                              <SelectContent>
                                {DIVISION_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor={`edit-description-${classroom.id}`} className="text-xs font-bold uppercase text-muted-foreground">Notes</Label>
                            <Textarea
                              id={`edit-description-${classroom.id}`}
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={2}
                              className="bg-background resize-none"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Update Supervisors</Label>
                            <div className="border-2 border-border/40 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto bg-background/50">
                              {supervisors.length === 0 ? (
                                <p className="text-sm text-muted-foreground col-span-full py-4 text-center italic">No active supervisors found.</p>
                              ) : (
                                supervisors.map((supervisor) => (
                                  <div key={`edit-supervisor-${supervisor.id}`} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/40">
                                    <input
                                      type="checkbox"
                                      id={`edit-supervisor-${supervisor.id}`}
                                      checked={formData.supervisorIds.includes(supervisor.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormData({
                                            ...formData,
                                            supervisorIds: [...formData.supervisorIds, supervisor.id]
                                          })
                                        } else {
                                          setFormData({
                                            ...formData,
                                            supervisorIds: formData.supervisorIds.filter(id => id !== supervisor.id)
                                          })
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <label
                                      htmlFor={`edit-supervisor-${supervisor.id}`}
                                      className="text-xs font-medium cursor-pointer truncate"
                                    >
                                      {supervisor.name}
                                    </label>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={handleUpdate} disabled={creating} className="flex-1 sm:flex-none">
                            Update Details
                          </Button>
                          <Button onClick={handleCancel} variant="ghost" className="flex-1 sm:flex-none">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal display view
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(classroom.id)}
                            className="shrink-0 transition-transform hover:scale-110 active:scale-95"
                          >
                            {selectedClassrooms.has(classroom.id) ? (
                              <CheckSquare className="h-6 w-6 text-primary" />
                            ) : (
                              <Square className="h-6 w-6 text-muted-foreground/30" />
                            )}
                          </button>

                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm border border-primary/20">
                            <Building2 className="h-6 w-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                              <h4 className="font-extrabold text-foreground text-lg tracking-tight truncate leading-tight">
                                {classroom.name}
                              </h4>
                              <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase text-muted-foreground tracking-tight">
                                <GraduationCap className="h-3 w-3" />
                                {classroom.grade}
                              </div>
                              {classroom.division && (
                                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-primary/10">
                                  <Layers className="h-3 w-3" />
                                  {getDivisionDisplayName(classroom.division)}
                                </div>
                              )}
                            </div>

                            {classroom.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1 italic">
                                {classroom.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4">
                              {classroom.supervisors && classroom.supervisors.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1.5">
                                    {classroom.supervisors.slice(0, 3).map((s) => (
                                      <div key={s.id} className="h-5 w-5 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[8px] font-bold shadow-sm" title={s.name}>
                                        {s.name.substring(0, 1)}
                                      </div>
                                    ))}
                                    {classroom.supervisors.length > 3 && (
                                      <div className="h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold">
                                        +{classroom.supervisors.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                                    Responsible: {classroom.supervisors.map(s => s.name.split(' ')[0]).join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] font-bold uppercase text-amber-600/70 tracking-widest flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  Unsupervised
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0">
                          <div className="flex sm:hidden items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                            Quick Division:
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={classroom.division || ""}
                              onValueChange={(value) => handleQuickDivisionChange(classroom.id, value)}
                              disabled={bulkUpdating}
                            >
                              <SelectTrigger className="h-9 w-32.5 sm:w-37.5 bg-background border-border/60 text-xs font-semibold shadow-sm">
                                <SelectValue placeholder="Set division" />
                              </SelectTrigger>
                              <SelectContent>
                                {DIVISION_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
                                >
                                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEdit(classroom)} className="py-2.5">
                                  <Pencil className="h-4 w-4 mr-2 text-primary" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(classroom.id)}
                                  variant="destructive"
                                  className="py-2.5"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent >
    </Card >
    </div>
  )
}
