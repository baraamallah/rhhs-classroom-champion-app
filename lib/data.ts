import type { Classroom, ChecklistItem, Evaluation, User } from "./types"

// Mock classrooms
export const classrooms: Classroom[] = [
  { id: "1", name: "Room 101", grade: "5th Grade", is_active: true },
  { id: "2", name: "Room 102", grade: "6th Grade", is_active: true },
  { id: "3", name: "Room 103", grade: "5th Grade", is_active: true },
  { id: "4", name: "Room 104", grade: "6th Grade", is_active: true },
  { id: "5", name: "Room 105", grade: "7th Grade", is_active: true },
  { id: "6", name: "Room 106", grade: "7th Grade", is_active: true },
]

// Default checklist items
export const defaultChecklistItems: ChecklistItem[] = [
  { id: "1", title: "Windows Closed", description: "All windows are properly closed", points: 10, is_active: true, display_order: 1 },
  { id: "2", title: "Lights Off", description: "All lights are turned off when not needed", points: 15, is_active: true, display_order: 2 },
  { id: "3", title: "Waste Sorted", description: "Waste is properly sorted into recycling bins", points: 20, is_active: true, display_order: 3 },
  { id: "4", title: "Desks Clean", description: "All desks are clean and organized", points: 10, is_active: true, display_order: 4 },
  { id: "5", title: "Projector Stored", description: "Projector is properly stored away", points: 10, is_active: true, display_order: 5 },
  { id: "6", title: "No Litter", description: "No litter on the floor or around the room", points: 15, is_active: true, display_order: 6 },
  { id: "7", title: "Plants Cared For", description: "Classroom plants are watered and healthy", points: 10, is_active: true, display_order: 7 },
  { id: "8", title: "Proper Waste Bin Usage", description: "Correct items in correct bins", points: 10, is_active: true, display_order: 8 },
]

// Mock dates must be created when data is requested, not when this module loads.
export function createMockEvaluations(): Evaluation[] {
  const now = Date.now()
  const createEvaluation = (id: string, classroom_id: string, supervisor_id: string, daysAgo: number, items: Record<string, boolean>, total_score: number): Evaluation => ({
    id,
    classroom_id,
    supervisor_id,
    evaluation_date: new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    items,
    total_score,
    max_score: 100,
  })

  return [
    createEvaluation("1", "1", "sup1", 2, { "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": false, "8": true }, 90),
    createEvaluation("2", "2", "sup1", 1, { "1": true, "2": false, "3": true, "4": true, "5": true, "6": true, "7": true, "8": true }, 85),
    createEvaluation("3", "3", "sup2", 3, { "1": true, "2": true, "3": false, "4": true, "5": true, "6": false, "7": true, "8": true }, 70),
    createEvaluation("4", "1", "sup2", 5, { "1": true, "2": true, "3": true, "4": false, "5": true, "6": true, "7": true, "8": true }, 90),
    createEvaluation("5", "4", "sup1", 1, { "1": true, "2": true, "3": true, "4": true, "5": false, "6": true, "7": true, "8": true }, 90),
    createEvaluation("6", "5", "sup1", 4, { "1": false, "2": true, "3": true, "4": true, "5": true, "6": true, "7": false, "8": true }, 80),
  ]
}

// Mock users
export const users: User[] = [
  { id: "admin1", name: "Admin User", email: "admin@school.edu", role: "admin", password_hash: "", is_active: true },
  { id: "sup1", name: "John Supervisor", email: "john@school.edu", role: "supervisor", password_hash: "", is_active: true },
  { id: "sup2", name: "Sarah Supervisor", email: "sarah@school.edu", role: "supervisor", password_hash: "", is_active: true },
]
