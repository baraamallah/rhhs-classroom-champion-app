import type React from "react"
import {
  ClipboardList,
  Building2,
  FileText,
  BarChart3,
  Users,
  Archive,
  Database,
  Download,
  Calendar,
  LineChart
} from "lucide-react"

export const STATS_ALLOWED_TAB_IDS = ["tracking", "statistics", "exports"]

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  superAdminOnly?: boolean
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "classrooms", label: "Classrooms", icon: Building2 },
  { id: "users", label: "Staff & Users", icon: Users },
  { id: "checklist", label: "Rubrics", icon: ClipboardList },
  { id: "edit-evaluation", label: "Edit Evaluation", icon: FileText },
  { id: "evaluations", label: "Evaluations", icon: FileText },
  { id: "tracking", label: "Tracking", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "statistics", label: "Analytics", icon: LineChart },
  { id: "exports", label: "Data Exports", icon: Download },
  { id: "academic-archives", label: "New Year Archive", icon: Archive },
  { id: "system", label: "System Settings", icon: Database }
]
