"use client"

import { usePathname } from "next/navigation"
import { EcoLoader } from "@/components/common/eco-loader"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { AdminSidebar } from "@/components/features/admin/admin-sidebar"
import { STATS_ALLOWED_TAB_IDS } from "@/lib/admin-navigation"
import type { User } from "@/lib/types"

function AdminTabSkeleton() {
  return <EcoLoader title="Preparing your workspace" />
}

// Dynamically import all heavy administrative tabs to reduce initial bundle and defer data execution
const ClassroomManagement = dynamic(
  () => import("@/components/features/admin/classroom-management").then((m) => m.ClassroomManagement),
  { loading: () => <AdminTabSkeleton /> }
)
const UserManagement = dynamic(
  () => import("@/components/features/admin/user-management").then((m) => m.UserManagement),
  { loading: () => <AdminTabSkeleton /> }
)
const ChecklistManager = dynamic(
  () => import("@/components/features/admin/checklist-manager").then((m) => m.ChecklistManager),
  { loading: () => <AdminTabSkeleton /> }
)
const EvaluationsList = dynamic(
  () => import("@/components/features/evaluations/evaluations-list").then((m) => m.EvaluationsList),
  { loading: () => <AdminTabSkeleton /> }
)
const SubmissionTracking = dynamic(
  () => import("@/components/features/evaluations/submission-tracking").then((m) => m.SubmissionTracking),
  { loading: () => <AdminTabSkeleton /> }
)
const AdminStatisticsTab = dynamic(
  () => import("@/components/features/admin/admin-statistics-tab").then((m) => m.AdminStatisticsTab),
  { loading: () => <AdminTabSkeleton /> }
)
const ExportManagement = dynamic(
  () => import("@/components/features/admin/export-management").then((m) => m.ExportManagement),
  { loading: () => <AdminTabSkeleton /> }
)
const AcademicArchiveManager = dynamic(
  () => import("@/components/features/admin/academic-archive-manager").then((m) => m.AcademicArchiveManager),
  { loading: () => <AdminTabSkeleton /> }
)
const CalendarManager = dynamic(
  () => import("@/components/features/admin/calendar-manager").then((m) => m.CalendarManager),
  { loading: () => <AdminTabSkeleton /> }
)
const DataManagementPanel = dynamic(
  () => import("@/components/features/admin/data-management-panel").then((m) => m.DataManagementPanel),
  { loading: () => <AdminTabSkeleton /> }
)

const EditEvaluation = dynamic(() => import("./edit-evaluation").then((m) => m.EditEvaluation), {
  loading: () => <AdminTabSkeleton />
})

const VALID_TABS = [
  "edit-evaluation",
  "classrooms",
  "users",
  "checklist",
  "evaluations",
  "tracking",
  "calendar",
  "statistics",
  "exports",
  "academic-archives",
  "system"
] as const

type AdminTab = (typeof VALID_TABS)[number]

const normalizeTab = (raw?: string): AdminTab => {
  if (!raw) return "classrooms"
  const lower = raw.toLowerCase()
  if (lower === "settings") return "system"
  if (lower === "export") return "exports"
  if (lower === "archive" || lower === "archives") return "academic-archives"
  if (lower === "holidays" || lower === "schedule") return "calendar"
  if (VALID_TABS.includes(lower as AdminTab)) return lower as AdminTab
  return "classrooms"
}

interface AdminDashboardProps {
  tabParam?: string
}

interface AdminDashboardInnerProps {
  currentUser?: User
  tabParam?: string
}

function AdminDashboardInner({ currentUser, tabParam }: AdminDashboardInnerProps) {
  const isStats = currentUser?.role === "stats"
  const pathname = usePathname()
  const rawTab = normalizeTab(pathname?.split("/")[2] || tabParam)
  const initialTab = isStats && !STATS_ALLOWED_TAB_IDS.includes(rawTab) ? "tracking" : rawTab
  const activeTab = initialTab
  const [visitedTabIds, setVisitedTabs] = useState<Set<string>>(() => new Set([initialTab]))

  const visitedTabs = new Set([...visitedTabIds, activeTab])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab])

  const handleSelectTab = (tabId: string) => {
    const resolvedTab = isStats && !STATS_ALLOWED_TAB_IDS.includes(tabId) ? "tracking" : tabId
    setVisitedTabs((prev) => {
      if (prev.has(resolvedTab)) return prev
      const next = new Set(prev)
      next.add(resolvedTab)
      return next
    })
    // Client-side URL sync without triggering unneeded Next.js route reload
    window.history.pushState(null, "", `/admin/${resolvedTab}`)
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20 flex flex-col">
      <DashboardHeader user={currentUser} />

      <main id="main-content" className="container mx-auto flex-1 px-4 py-6 pb-24 sm:py-8 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Responsive Sidebar Navigation */}
          <AdminSidebar activeTab={activeTab} onSelectTab={handleSelectTab} userRole={currentUser.role} />

          {/* Dynamic Main Workspace with Visited Tab Caching */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === "edit-evaluation" && (
              <EditEvaluation onSaved={() => setVisitedTabs(new Set(["edit-evaluation"]))} />
            )}
            <CachedAdminTab id="classrooms" activeTab={activeTab} visitedTabs={visitedTabs}>
              <ClassroomManagement currentUser={currentUser} />
            </CachedAdminTab>

            <CachedAdminTab id="users" activeTab={activeTab} visitedTabs={visitedTabs}>
              <UserManagement currentUser={currentUser} />
            </CachedAdminTab>

            <CachedAdminTab id="checklist" activeTab={activeTab} visitedTabs={visitedTabs}>
              <ChecklistManager currentUser={currentUser} />
            </CachedAdminTab>

            <CachedAdminTab id="evaluations" activeTab={activeTab} visitedTabs={visitedTabs}>
              <EvaluationsList />
            </CachedAdminTab>

            <CachedAdminTab id="tracking" activeTab={activeTab} visitedTabs={visitedTabs}>
              <SubmissionTracking currentUser={currentUser} />
            </CachedAdminTab>

            <CachedAdminTab id="calendar" activeTab={activeTab} visitedTabs={visitedTabs}>
              <CalendarManager />
            </CachedAdminTab>

            <CachedAdminTab id="statistics" activeTab={activeTab} visitedTabs={visitedTabs}>
              <AdminStatisticsTab />
            </CachedAdminTab>

            <CachedAdminTab id="exports" activeTab={activeTab} visitedTabs={visitedTabs}>
              <ExportManagement />
            </CachedAdminTab>

            <CachedAdminTab id="academic-archives" activeTab={activeTab} visitedTabs={visitedTabs}>
              <AcademicArchiveManager />
            </CachedAdminTab>

            <CachedAdminTab id="system" activeTab={activeTab} visitedTabs={visitedTabs}>
              <DataManagementPanel />
            </CachedAdminTab>
          </div>
        </div>
      </main>
    </div>
  )
}

export function AdminDashboard({ tabParam }: AdminDashboardProps) {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "stats"]}>
      <AdminDashboardInner tabParam={tabParam} />
    </ProtectedRoute>
  )
}

function CachedAdminTab({
  id,
  activeTab,
  visitedTabs,
  children
}: {
  id: string
  activeTab: string
  visitedTabs: Set<string>
  children: React.ReactNode
}) {
  if (!visitedTabs.has(id)) return null
  return <div className={activeTab === id ? "block" : "hidden"}>{children}</div>
}
