"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ChecklistItem, User } from "@/lib/types"
import { getChecklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem, getAllUsers } from "@/lib/supabase-data"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pencil, Trash2, Plus, MoreVertical } from "lucide-react"
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
        const supervisorList = usersResult.data.filter(u => u.role === 'supervisor')
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
    if (!formData.title.trim()) return

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
    if (!currentItem || !formData.title.trim()) return

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Checklist Items</CardTitle>
            <CardDescription>Manage evaluation criteria and point values</CardDescription>
          </div>
          {!isAddOpen && !isEditOpen && (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items List */}
        <div className="space-y-2">
          {/* Add Form */}
          {isAddOpen && (
            <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Item Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Windows Closed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what needs to be checked"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., energy, waste, cleanliness"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
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
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`supervisor-${supervisor.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {supervisor.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  Create Item
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No checklist items yet. Add your first item above!</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card">
                {isEditOpen && currentItem?.id === item.id ? (
                  // Inline edit form
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-title-${item.id}`}>Item Name</Label>
                      <Input
                        id={`edit-title-${item.id}`}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Windows Closed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-description-${item.id}`}>Description</Label>
                      <Textarea
                        id={`edit-description-${item.id}`}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what needs to be checked"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-points-${item.id}`}>Points</Label>
                        <Input
                          id={`edit-points-${item.id}`}
                          type="number"
                          min="1"
                          max="100"
                          value={formData.points}
                          onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-category-${item.id}`}>Category</Label>
                        <Input
                          id={`edit-category-${item.id}`}
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="e.g., energy, waste, cleanliness"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-displayOrder-${item.id}`}>Display Order</Label>
                      <Input
                        id={`edit-displayOrder-${item.id}`}
                        type="number"
                        min="0"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: Number.parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
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
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <label
                                htmlFor={`edit-supervisor-${supervisor.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {supervisor.name}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdate} size="sm">
                        Update Item
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal display view
                  <div className="flex items-start gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        {item.category && (
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Order: {item.display_order || 0}</span>
                          <span>Points: {item.points}</span>
                        </div>
                        {item.assigned_supervisors && item.assigned_supervisors.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs text-muted-foreground mr-1">Assigned to:</span>
                            {item.assigned_supervisors.map((supervisor) => (
                              <span key={supervisor.id} className="text-xs bg-secondary px-1.5 py-0.5 rounded-md text-secondary-foreground">
                                {supervisor.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-primary">{item.points} pts</span>
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
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
