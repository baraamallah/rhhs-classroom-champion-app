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
