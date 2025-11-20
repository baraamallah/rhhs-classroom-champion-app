export interface Classroom {
  id: string
  name: string
  grade: string
  description?: string
  // supervisor_id is deprecated in favor of supervisors array
  supervisor_id?: string
  created_by?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  // Joined data from relations
  supervisor?: {
    name: string
    email: string
  }
  supervisors?: {
    id: string
    name: string
    email: string
  }[]
  created_by_user?: {
    name: string
    email: string
  }
}

export interface ChecklistItem {
  id: string
  title: string
  description?: string
  points: number
  category?: string
  is_active: boolean
  display_order: number
  created_by?: string
  // assigned_supervisor_id is deprecated in favor of assigned_supervisors array
  assigned_supervisor_id?: string
  created_at?: string
  updated_at?: string
  // Joined data from relations
  created_by_user?: {
    name: string
    email: string
  }
  assigned_supervisor?: {
    name: string
    email: string
  }
  assigned_supervisors?: {
    id: string
    name: string
    email: string
  }[]
}

export interface Evaluation {
  id: string
  classroom_id: string
  supervisor_id: string
  evaluation_date: string
  items: Record<string, boolean> // Object with item_id: checked status
  total_score: number
  max_score: number
  notes?: string
  created_at?: string
  // Joined data from relations
  classroom?: {
    name: string
    grade: string
  }
  supervisor?: {
    name: string
    email: string
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "supervisor" | "viewer"
  password_hash?: string
  created_by?: string
  is_active: boolean
  last_login_at?: string
  created_at?: string
  updated_at?: string
  // Joined data from relations
  created_by_user?: {
    name: string
    email: string
  }
  // Classroom assignments for supervisors
  classrooms?: {
    id: string
    name: string
    grade: string
  }[]
}

export interface ClassroomScore {
  classroom: {
    id: string
    name: string
    grade: string
  }
  totalScore: number
  evaluationCount: number
  averageScore: number
  lastEvaluated: string
}

// New interfaces for enhanced functionality
export interface UserPermission {
  id: string
  user_id: string
  permission: string
  granted_by?: string
  granted_at: string
  // Joined data from relations
  granted_by_user?: {
    name: string
    email: string
  }
}

export interface SystemSetting {
  id: string
  key: string
  value: any
  description?: string
  updated_by?: string
  updated_at: string
  // Joined data from relations
  updated_by_user?: {
    name: string
    email: string
  }
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  // Joined data from relations
  user?: {
    name: string
    email: string
  }
}
