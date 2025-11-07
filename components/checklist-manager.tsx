"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ChecklistItem, User } from "@/lib/types"
import { getChecklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem } from "@/lib/supabase-data"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pencil, Trash2, Plus, MoreVertical } from "lucide-react"

interface ChecklistManagerProps {
  currentUser: User
}

export function ChecklistManager({ currentUser }: ChecklistManagerProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    points: 10, 
    category: "", 
    displayOrder: 0 
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      const data = await getChecklistItems()
      setItems(data)
      setError(null)
    } catch (error) {
      console.error("[v0] Error fetching checklist items:", error)
      setError("Failed to load checklist items")
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
      let result
      if (editingId) {
        result = await updateChecklistItem(
          editingId, 
          formData.title, 
          formData.description, 
          formData.points,
          formData.category || undefined,
          formData.displayOrder,
          true
        )
        if (result.success) {
          setEditingId(null)
        }
      } else {
        result = await addChecklistItem(
          formData.title, 
          formData.description, 
          formData.points,
          formData.category || undefined,
          formData.displayOrder,
          currentUser.id
        )
        if (result.success) {
          setIsAdding(false)
        }
      }

      if (!result.success) {
        setError(result.error || "Failed to save item")
        return
      }

      setFormData({ title: "", description: "", points: 10, category: "", displayOrder: 0 })
      setError(null)
      await fetchItems()
    } catch (error) {
      console.error("[v0] Error saving checklist item:", error)
      setError("An unexpected error occurred")
    }
  }

  const handleEdit = (item: ChecklistItem) => {
    setEditingId(item.id)
    setFormData({ 
      title: item.title, 
      description: item.description || "", 
      points: item.points,
      category: item.category || "",
      displayOrder: item.display_order || 0
    })
    setIsAdding(false)
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const result = await deleteChecklistItem(id)
      if (!result.success) {
        setError(result.error || "Failed to delete item")
        return
      }
      setError(null)
      await fetchItems()
    } catch (error) {
      console.error("[v0] Error deleting checklist item:", error)
      setError("An unexpected error occurred")
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ title: "", description: "", points: 10, category: "", displayOrder: 0 })
    setError(null)
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ title: "", description: "", points: 10, category: "", displayOrder: 0 })
    setError(null)
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
          {!isAdding && !editingId && (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {/* Add Form */}
          {isAdding && (
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
                {editingId === item.id ? (
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
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
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
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Order: {item.display_order || 0}</span>
                        <span>Points: {item.points}</span>
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
