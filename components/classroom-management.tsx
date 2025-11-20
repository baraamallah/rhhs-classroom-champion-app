"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Plus, Pencil, Trash2, Users, MoreVertical } from "lucide-react"
import { createClassroom, updateClassroom, deleteClassroom, getAllUsers } from "@/lib/supabase-data"
import { createClient } from "@/lib/supabase/client"
import type { Classroom, User } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface ClassroomManagementProps {
  currentUser: User
}

interface ClassroomFormData {
  name: string
  grade: string
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
  const { toast } = useToast()

  const [formData, setFormData] = useState<ClassroomFormData>({
    name: "",
    grade: "",
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
      formData.description || undefined,
      formData.supervisorIds,
      currentUser.id
    )

    if (result.success) {
      toast({
        title: "Success",
        description: "Classroom created successfully",
      })
      setFormData({ name: "", grade: "", description: "", supervisorIds: [] })
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
      formData.description || undefined,
      formData.supervisorIds
    )

    if (result.success) {
      toast({
        title: "Success",
        description: "Classroom updated successfully",
      })
      setEditingId(null)
      setFormData({ name: "", grade: "", description: "", supervisorIds: [] })
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
    setFormData({ name: "", grade: "", description: "", supervisorIds: [] })
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ name: "", grade: "", description: "", supervisorIds: [] })
  }

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
          ) : classrooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No classrooms found</p>
          ) : (
            <div className="space-y-3">
              {classrooms.map((classroom) => (
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{classroom.name}</p>
                            <span className="text-sm text-muted-foreground">{classroom.grade}</span>
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
      </CardContent>
    </Card>
  )
}
