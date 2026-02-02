"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Plus, Pencil, Trash2, Users, MoreVertical, Filter, CheckSquare, Square } from "lucide-react"
import { createClassroom, updateClassroom, deleteClassroom, getAllUsers, bulkUpdateClassroomDivisions } from "@/lib/supabase-data"
import { createClient } from "@/lib/supabase/client"
import type { Classroom, User } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"

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
    loadClassrooms()
    loadSupervisors()
  }, [])

  const loadClassrooms = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const loadSupervisors = async () => {
    try {
      const result = await getAllUsers()
      if (result.success) {
        // Filter to only supervisors
        const supervisorUsers = result.data.filter(user => user.role === "supervisor")
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

  // Filter classrooms by division
  const filteredClassrooms = selectedDivision === "all"
    ? classrooms
    : classrooms.filter(classroom => classroom.division === selectedDivision)

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedClassrooms(new Set())
  }, [selectedDivision])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Classrooms
            </CardTitle>
            <CardDescription>Manage classrooms in the system</CardDescription>
          </div>
          {!isAdding && !editingId && (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Classroom
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Division Filter and Bulk Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Filter by Division:</Label>
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {DIVISION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Action Bar */}
          {selectedClassrooms.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedClassrooms.size} classroom{selectedClassrooms.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Bulk Change Division:</Label>
                <Select
                  onValueChange={handleBulkUpdateDivision}
                  disabled={bulkUpdating}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISION_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClassrooms(new Set())}
                  disabled={bulkUpdating}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Classrooms List */}
        <div className="space-y-2">
          {/* Add Form */}
          {isAdding && (
            <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Classroom Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Room 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="Grade 5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(value) => setFormData({ ...formData, division: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of the classroom"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Assigned Supervisors</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto bg-background">
                    {supervisors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No supervisors found.</p>
                    ) : (
                      supervisors.map((supervisor) => (
                        <div key={supervisor.id} className="flex items-center space-x-2">
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
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={`supervisor-${supervisor.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {supervisor.name} ({supervisor.email})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={creating} size="sm">
                  {creating ? "Saving..." : "Create Classroom"}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading classrooms...</p>
          ) : filteredClassrooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {selectedDivision === "all" ? "No classrooms found" : `No classrooms in ${selectedDivision}`}
            </p>
          ) : (
            <div className="space-y-3">
              {/* Select All Header */}
              <div className="flex items-center gap-2 p-2 border-b">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {selectedClassrooms.size === filteredClassrooms.length && filteredClassrooms.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span>Select All ({filteredClassrooms.length})</span>
                </button>
              </div>

              {filteredClassrooms.map((classroom) => (
                <div key={classroom.id} className="border border-border rounded-lg bg-card">
                  {editingId === classroom.id ? (
                    // Inline edit form

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${classroom.id}`}>Classroom Name</Label>
                          <Input
                            id={`edit-name-${classroom.id}`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Room 101"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-grade-${classroom.id}`}>Grade</Label>
                          <Input
                            id={`edit-grade-${classroom.id}`}
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            placeholder="Grade 5"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-division-${classroom.id}`}>Division</Label>
                          <Select
                            value={formData.division}
                            onValueChange={(value) => setFormData({ ...formData, division: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                              {DIVISION_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`edit-description-${classroom.id}`}>Description</Label>
                          <Textarea
                            id={`edit-description-${classroom.id}`}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description of the classroom"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Assigned Supervisors</Label>
                          <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto bg-background">
                            {supervisors.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No supervisors found.</p>
                            ) : (
                              supervisors.map((supervisor) => (
                                <div key={`edit-supervisor-${supervisor.id}`} className="flex items-center space-x-2">
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
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor={`edit-supervisor-${supervisor.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {supervisor.name} ({supervisor.email})
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdate} disabled={creating} size="sm">
                          {creating ? "Saving..." : "Update Classroom"}
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Normal display view
                    <div className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => handleToggleSelect(classroom.id)}
                          className="flex-shrink-0"
                        >
                          {selectedClassrooms.has(classroom.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground">{classroom.name}</p>
                            <span className="text-sm text-muted-foreground">{classroom.grade}</span>
                            {classroom.division && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {getDivisionDisplayName(classroom.division)}
                              </span>
                            )}
                          </div>
                          {classroom.description && (
                            <p className="text-sm text-muted-foreground">{classroom.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1">
                            {classroom.supervisors && classroom.supervisors.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mr-1">
                                  <Users className="h-3 w-3" />
                                  <span>Supervisors:</span>
                                </div>
                                {classroom.supervisors.map((supervisor) => (
                                  <span key={supervisor.id} className="text-xs bg-secondary px-1.5 py-0.5 rounded-md text-secondary-foreground">
                                    {supervisor.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No supervisors assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Quick Division Change */}
                        <div className="flex items-center gap-1 border rounded-md p-1">
                          <span className="text-xs text-muted-foreground px-2">Division:</span>
                          <Select
                            value={classroom.division || ""}
                            onValueChange={(value) => handleQuickDivisionChange(classroom.id, value)}
                            disabled={bulkUpdating}
                          >
                            <SelectTrigger className="h-8 w-[140px] border-0 shadow-none">
                              <SelectValue placeholder="Set division" />
                            </SelectTrigger>
                            <SelectContent>
                              {DIVISION_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(classroom)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Classroom
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(classroom.id)}
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Classroom
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent >
    </Card >
  )
}
