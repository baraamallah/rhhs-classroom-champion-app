"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ChecklistItem, User } from "@/lib/types"
import { getAllUsers, getChecklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem } from "@/lib/supabase-data"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pencil, Trash2, Plus, MoreVertical, LayoutList, GripVertical, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ChecklistManagerProps {
  currentUser: User
}

interface ChecklistItemFormData {
  title: string
  description: string
  points: number
  category: string
  displayOrder: number
  assignedSupervisorIds: string[]
}

export function ChecklistManager({ currentUser }: ChecklistManagerProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<ChecklistItem | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ChecklistItemFormData>({
    title: "",
    description: "",
    points: 10,
    category: "General",
    displayOrder: 0,
    assignedSupervisorIds: []
  })
  const [supervisors, setSupervisors] = useState<User[]>([])

  const fetchItems = async () => {
    try {
      const [itemsData, usersResult] = await Promise.all([
        getChecklistItems(),
        getAllUsers()
      ])

      setItems(itemsData)

      if (usersResult.success) {
        const supervisorList = usersResult.data.filter((u: User) => u.role === 'supervisor')
        setSupervisors(supervisorList)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSave = async () => {
    if (!formData || !formData.title || !formData.title.trim()) return

    try {
      const result = await addChecklistItem(
        formData.title,
        formData.description,
        formData.points,
        formData.category,
        formData.displayOrder,
        undefined, // createdBy will be handled by RLS or backend
        formData.assignedSupervisorIds
      )

      if (result.success) {
        toast({
          title: "Success",
          description: "Checklist item added successfully",
        })
        setIsAddOpen(false)
        fetchItems()
        setFormData({
          title: "",
          description: "",
          points: 10,
          category: "General",
          displayOrder: 0,
          assignedSupervisorIds: []
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving checklist item:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!currentItem || !formData || !formData.title || !formData.title.trim()) return

    try {
      const result = await updateChecklistItem(
        currentItem.id,
        formData.title,
        formData.description,
        formData.points,
        formData.category,
        formData.displayOrder,
        currentItem.is_active,
        formData.assignedSupervisorIds
      )

      if (result.success) {
        toast({
          title: "Success",
          description: "Checklist item updated successfully",
        })
        setIsEditOpen(false)
        setCurrentItem(null)
        fetchItems()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating checklist item:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: ChecklistItem) => {
    setCurrentItem(item)
    setFormData({
      title: item.title,
      description: item.description || "",
      points: item.points,
      category: item.category || "General",
      displayOrder: item.display_order,
      assignedSupervisorIds: item.assigned_supervisors?.map(s => s.id) || []
    })
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const result = await deleteChecklistItem(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Item deleted successfully",
        })
        fetchItems()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting checklist item:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsAddOpen(false)
    setIsEditOpen(false)
    setCurrentItem(null)
    setFormData({
      title: "",
      description: "",
      points: 10,
      category: "General",
      displayOrder: 0,
      assignedSupervisorIds: []
    })
  }

  const handleAddNew = () => {
    setFormData({
      title: "",
      description: "",
      points: 10,
      category: "General",
      displayOrder: 0,
      assignedSupervisorIds: []
    })
    setIsAddOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading checklist items...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <LayoutList className="h-5 w-5 text-primary" />
              Checklist Items
            </CardTitle>
            <CardDescription className="text-sm">
              Define the criteria supervisors use during classroom evaluations.
            </CardDescription>
          </div>
          {!isAddOpen && !isEditOpen && (
            <Button onClick={handleAddNew} size="sm" className="w-full sm:w-auto shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Criterion
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Items List */}
        <div className="divide-y divide-border">
          {/* Add Form */}
          {isAddOpen && (
            <div className="p-6 bg-primary/5 border-b space-y-6 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Plus className="h-4 w-4" />
                Add New Evaluation Criterion
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Criterion Name</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Windows Closed & Locked"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Energy Conservation"
                    className="bg-background"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description & Instructions</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed instructions for supervisors on how to verify this item..."
                    rows={3}
                    className="bg-background resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Points Value</Label>
                  <div className="relative">
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
                      className="bg-background pl-10"
                    />
                    <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort Order</Label>
                  <div className="relative">
                    <Input
                      id="displayOrder"
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: Number.parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-background pl-10"
                    />
                    <GripVertical className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign to Supervisors</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 border rounded-lg bg-background shadow-inner">
                  {supervisors.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full py-4 text-center">No supervisors available.</p>
                  ) : (
                    supervisors.map((supervisor) => (
                      <div key={supervisor.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          id={`supervisor-${supervisor.id}`}
                          checked={formData.assignedSupervisorIds.includes(supervisor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                assignedSupervisorIds: [...formData.assignedSupervisorIds, supervisor.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                assignedSupervisorIds: formData.assignedSupervisorIds.filter(id => id !== supervisor.id)
                              })
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <label
                          htmlFor={`supervisor-${supervisor.id}`}
                          className="text-sm font-medium leading-none cursor-pointer truncate"
                        >
                          {supervisor.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} className="flex-1 sm:flex-none">
                  Save Criterion
                </Button>
                <Button onClick={handleCancel} variant="ghost" className="flex-1 sm:flex-none">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No checklist items defined</p>
              <p className="text-sm text-muted-foreground/70 mb-6">Start by adding your first evaluation criterion.</p>
              <Button onClick={handleAddNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="group relative transition-all hover:bg-muted/20">
                  {isEditOpen && currentItem?.id === item.id ? (
                    // Inline edit form
                    <div className="p-6 bg-primary/5 space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Pencil className="h-4 w-4" />
                        Edit Criterion: {item.title}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-title-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Criterion Name</Label>
                          <Input
                            id={`edit-title-${item.id}`}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Windows Closed"
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-category-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                          <Input
                            id={`edit-category-${item.id}`}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g., energy, waste, cleanliness"
                            className="bg-background"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`edit-description-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description & Instructions</Label>
                          <Textarea
                            id={`edit-description-${item.id}`}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what needs to be checked"
                            rows={3}
                            className="bg-background resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-points-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Points Value</Label>
                          <Input
                            id={`edit-points-${item.id}`}
                            type="number"
                            min="1"
                            max="100"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-displayOrder-${item.id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort Order</Label>
                          <Input
                            id={`edit-displayOrder-${item.id}`}
                            type="number"
                            min="0"
                            value={formData.displayOrder}
                            onChange={(e) => setFormData({ ...formData, displayOrder: Number.parseInt(e.target.value) || 0 })}
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Update Supervisor Assignments</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 border rounded-lg bg-background shadow-inner">
                          {supervisors.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-full py-4 text-center">No supervisors available.</p>
                          ) : (
                            supervisors.map((supervisor) => (
                              <div key={`edit-supervisor-${supervisor.id}`} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                <input
                                  type="checkbox"
                                  id={`edit-supervisor-${supervisor.id}`}
                                  checked={formData.assignedSupervisorIds.includes(supervisor.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        assignedSupervisorIds: [...formData.assignedSupervisorIds, supervisor.id]
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        assignedSupervisorIds: formData.assignedSupervisorIds.filter(id => id !== supervisor.id)
                                      })
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <label
                                  htmlFor={`edit-supervisor-${supervisor.id}`}
                                  className="text-sm font-medium leading-none cursor-pointer truncate"
                                >
                                  {supervisor.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleUpdate} className="flex-1 sm:flex-none">
                          Update Criterion
                        </Button>
                        <Button onClick={handleCancel} variant="ghost" className="flex-1 sm:flex-none">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Normal display view
                    <div className="flex items-center gap-4 p-4 sm:p-6">
                      <div className="hidden sm:flex flex-col items-center justify-center p-2 text-muted-foreground">
                        <GripVertical className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-mono mt-1">{item.display_order || 0}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-foreground text-base sm:text-lg tracking-tight truncate">
                            {item.title}
                          </h4>
                          {item.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none max-w-2xl mb-3">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-1 rounded">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {item.points} Points Possible
                          </div>

                          {item.assigned_supervisors && item.assigned_supervisors.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Assigned:</span>
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {item.assigned_supervisors.slice(0, 5).map((supervisor) => (
                                  <div
                                    key={supervisor.id}
                                    className="h-6 w-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground shadow-sm"
                                    title={supervisor.name}
                                  >
                                    {supervisor.name.substring(0, 1)}
                                  </div>
                                ))}
                                {item.assigned_supervisors.length > 5 && (
                                  <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                                    +{item.assigned_supervisors.length - 5}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold uppercase text-amber-600/80 tracking-widest flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Unassigned
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full hover:bg-muted group-hover:shadow-sm transition-all"
                            >
                              <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEdit(item)} className="py-2.5">
                              <Pencil className="h-4 w-4 mr-2 text-primary" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              variant="destructive"
                              className="py-2.5"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Item
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
      <div className="bg-muted/30 px-6 py-4 border-t">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Total potential score: <span className="text-primary">{items.reduce((sum, item) => sum + item.points, 0)} points</span>
        </p>
      </div>
    </Card>
  )
}
