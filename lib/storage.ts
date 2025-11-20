"use client"

import type { ChecklistItem, Evaluation, User } from "./types"
import { defaultChecklistItems, mockEvaluations, users as defaultUsers } from "./data"

// Client-side storage using localStorage
export const storage = {
  // Checklist items
  getChecklistItems: (): ChecklistItem[] => {
    if (typeof window === "undefined") return defaultChecklistItems
    const stored = localStorage.getItem("checklistItems")
    return stored ? JSON.parse(stored) : defaultChecklistItems
  },

  setChecklistItems: (items: ChecklistItem[]) => {
    localStorage.setItem("checklistItems", JSON.stringify(items))
  },

  addChecklistItem: async (
    title: string,
    description: string,
    points: number,
    category: string,
    displayOrder: number,
    createdBy: string | undefined,
    assignedSupervisorIds: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const items = storage.getChecklistItems()
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        title,
        description,
        points,
        category,
        display_order: displayOrder,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_supervisors: assignedSupervisorIds.map(id => ({ id }))
      }
      items.push(newItem)
      storage.setChecklistItems(items)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Failed to add checklist item" }
    }
  },

  updateChecklistItem: async (
    id: string,
    title: string,
    description: string,
    points: number,
    category: string,
    displayOrder: number,
    isActive: boolean | undefined,
    assignedSupervisorIds: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const items = storage.getChecklistItems()
      const index = items.findIndex(item => item.id === id)
      if (index === -1) {
        return { success: false, error: "Item not found" }
      }
      
      items[index] = {
        ...items[index],
        title,
        description,
        points,
        category,
        display_order: displayOrder,
        is_active: isActive !== undefined ? isActive : items[index].is_active,
        updated_at: new Date().toISOString(),
        assigned_supervisors: assignedSupervisorIds.map(supId => ({ id: supId }))
      }
      
      storage.setChecklistItems(items)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Failed to update checklist item" }
    }
  },

  deleteChecklistItem: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const items = storage.getChecklistItems()
      const index = items.findIndex(item => item.id === id)
      if (index === -1) {
        return { success: false, error: "Item not found" }
      }
      
      items.splice(index, 1)
      storage.setChecklistItems(items)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Failed to delete checklist item" }
    }
  },

  // Evaluations
  getEvaluations: (): Evaluation[] => {
    if (typeof window === "undefined") return mockEvaluations
    const stored = localStorage.getItem("evaluations")
    return stored ? JSON.parse(stored) : mockEvaluations
  },

  addEvaluation: (evaluation: Evaluation) => {
    const evaluations = storage.getEvaluations()
    evaluations.push(evaluation)
    localStorage.setItem("evaluations", JSON.stringify(evaluations))
  },

  // Users
  getUsers: (): User[] => {
    if (typeof window === "undefined") return defaultUsers
    const stored = localStorage.getItem("users")
    return stored ? JSON.parse(stored) : defaultUsers
  },

  addUser: (user: User) => {
    const users = storage.getUsers()
    users.push(user)
    localStorage.setItem("users", JSON.stringify(users))
  },

  // Auth
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("currentUser")
    return stored ? JSON.parse(stored) : null
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user))
    } else {
      localStorage.removeItem("currentUser")
    }
  },

  logout: () => {
    localStorage.removeItem("currentUser")
  },
}
