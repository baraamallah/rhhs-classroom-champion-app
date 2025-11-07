import type { Classroom, ChecklistItem, Evaluation, User } from "./types"

// Mock classrooms
export const classrooms: Classroom[] = [
  { id: "1", name: "Room 101", teacher: "Ms. Johnson", grade: "5th Grade" },
  { id: "2", name: "Room 102", teacher: "Mr. Smith", grade: "6th Grade" },
  { id: "3", name: "Room 103", teacher: "Mrs. Davis", grade: "5th Grade" },
  { id: "4", name: "Room 104", teacher: "Mr. Wilson", grade: "6th Grade" },
  { id: "5", name: "Room 105", teacher: "Ms. Brown", grade: "7th Grade" },
  { id: "6", name: "Room 106", teacher: "Mr. Garcia", grade: "7th Grade" },
]

// Default checklist items
export const defaultChecklistItems: ChecklistItem[] = [
  { id: "1", name: "Windows Closed", description: "All windows are properly closed", points: 10, order: 1 },
  { id: "2", name: "Lights Off", description: "All lights are turned off when not needed", points: 15, order: 2 },
  { id: "3", name: "Waste Sorted", description: "Waste is properly sorted into recycling bins", points: 20, order: 3 },
  { id: "4", name: "Desks Clean", description: "All desks are clean and organized", points: 10, order: 4 },
  { id: "5", name: "Projector Stored", description: "Projector is properly stored away", points: 10, order: 5 },
  { id: "6", name: "No Litter", description: "No litter on the floor or around the room", points: 15, order: 6 },
  { id: "7", name: "Plants Cared For", description: "Classroom plants are watered and healthy", points: 10, order: 7 },
  { id: "8", name: "Proper Waste Bin Usage", description: "Correct items in correct bins", points: 10, order: 8 },
]

// Mock evaluations
export const mockEvaluations: Evaluation[] = [
  {
    id: "1",
    classroomId: "1",
    supervisorId: "sup1",
    supervisorName: "John Supervisor",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    items: { "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": false, "8": true },
    totalScore: 90,
  },
  {
    id: "2",
    classroomId: "2",
    supervisorId: "sup1",
    supervisorName: "John Supervisor",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: { "1": true, "2": false, "3": true, "4": true, "5": true, "6": true, "7": true, "8": true },
    totalScore: 85,
  },
  {
    id: "3",
    classroomId: "3",
    supervisorId: "sup2",
    supervisorName: "Sarah Supervisor",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: { "1": true, "2": true, "3": false, "4": true, "5": true, "6": false, "7": true, "8": true },
    totalScore: 70,
  },
  {
    id: "4",
    classroomId: "1",
    supervisorId: "sup2",
    supervisorName: "Sarah Supervisor",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    items: { "1": true, "2": true, "3": true, "4": false, "5": true, "6": true, "7": true, "8": true },
    totalScore: 90,
  },
  {
    id: "5",
    classroomId: "4",
    supervisorId: "sup1",
    supervisorName: "John Supervisor",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: { "1": true, "2": true, "3": true, "4": true, "5": false, "6": true, "7": true, "8": true },
    totalScore: 90,
  },
  {
    id: "6",
    classroomId: "5",
    supervisorId: "sup1",
    supervisorName: "John Supervisor",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    items: { "1": false, "2": true, "3": true, "4": true, "5": true, "6": true, "7": false, "8": true },
    totalScore: 80,
  },
]

// Mock users
export const users: User[] = [
  { id: "admin1", name: "Admin User", email: "admin@school.edu", role: "admin", password: "admin123" },
  { id: "sup1", name: "John Supervisor", email: "john@school.edu", role: "supervisor", password: "super123" },
  { id: "sup2", name: "Sarah Supervisor", email: "sarah@school.edu", role: "supervisor", password: "super123" },
]
