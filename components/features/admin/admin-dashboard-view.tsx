"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ProtectedRoute } from "@/components/providers/protected-route"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { AdminSidebar, STATS_ALLOWED_TAB_IDS } from "@/components/features/admin/admin-sidebar"
import type { User } from "@/lib/types"

function AdminTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-card/60 border border-border/60 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-16 bg-muted/80 rounded" />
            <div className="h-6 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="h-72 bg-card/60 border border-border/60 rounded-2xl" />
    </div>
  )
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

const VALID_TABS = [
  "classrooms",
  "users",
  "checklist",
  "evaluations",
  "tracking",
  "calendar",
  "statistics",
  "exports",
  "academic-archives",
  "system",
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
  const router = useRouter()
  const isStats = currentUser?.role === "stats"
  const rawTab = normalizeTab(tabParam)
  const initialTab = isStats && !STATS_ALLOWED_TAB_IDS.includes(rawTab) ? "tracking" : rawTab
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([initialTab]))

  // Sync state if URL param changes
  useEffect(() => {
    if (tabParam) {
      const normalized = normalizeTab(tabParam)
      const tab = isStats && !STATS_ALLOWED_TAB_IDS.includes(normalized) ? "tracking" : normalized
      setActiveTab(tab)
      setVisitedTabs((prev) => {
        if (prev.has(tab)) return prev
        const next = new Set(prev)
        next.add(tab)
        return next
      })
    }
  }, [tabParam, isStats])

  // Support browser back / forward navigation seamlessly
  useEffect(() => {
    const handlePopState = () => {
      const parts = window.location.pathname.split("/").filter(Boolean)
      if (parts[0] === "admin" && parts[1]) {
        const tab = normalizeTab(parts[1])
        const resolvedTab = isStats && !STATS_ALLOWED_TAB_IDS.includes(tab) ? "tracking" : tab
        setActiveTab(resolvedTab)
        setVisitedTabs((prev) => {
          if (prev.has(resolvedTab)) return prev
          const next = new Set(prev)
          next.add(resolvedTab)
          return next
        })
      } else if (parts[0] === "admin") {
        setActiveTab(isStats ? "tracking" : "classrooms")
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [isStats])

  useEffect(() => {
    if (isStats && !STATS_ALLOWED_TAB_IDS.includes(activeTab)) {
      router.replace("/admin/tracking")
    }
  }, [isStats, activeTab, router])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })
    })
  }, [activeTab])

  const handleSelectTab = (tabId: string) => {
    const resolvedTab = isStats && !STATS_ALLOWED_TAB_IDS.includes(tabId) ? "tracking" : tabId
    setActiveTab(resolvedTab)
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
          <AdminSidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            userRole={currentUser.role}
          />

          {/* Dynamic Main Workspace with Visited Tab Caching */}
          <div className="flex-1 w-full min-w-0">
            {visitedTabs.has("classrooms") && (
              <div className={activeTab === "classrooms" ? "block" : "hidden"}>
                <ClassroomManagement currentUser={currentUser} />
              </div>
            )}

            {visitedTabs.has("users") && (
              <div className={activeTab === "users" ? "block" : "hidden"}>
                <UserManagement currentUser={currentUser} />
              </div>
            )}

            {visitedTabs.has("checklist") && (
              <div className={activeTab === "checklist" ? "block" : "hidden"}>
                <ChecklistManager currentUser={currentUser} />
              </div>
            )}

            {visitedTabs.has("evaluations") && (
              <div className={activeTab === "evaluations" ? "block" : "hidden"}>
                <EvaluationsList />
              </div>
            )}

            {visitedTabs.has("tracking") && (
              <div className={activeTab === "tracking" ? "block" : "hidden"}>
                <SubmissionTracking currentUser={currentUser} />
              </div>
            )}

            {visitedTabs.has("calendar") && (
              <div className={activeTab === "calendar" ? "block" : "hidden"}>
                <CalendarManager />
              </div>
            )}

            {visitedTabs.has("statistics") && (
              <div className={activeTab === "statistics" ? "block" : "hidden"}>
                <AdminStatisticsTab />
              </div>
            )}

            {visitedTabs.has("exports") && (
              <div className={activeTab === "exports" ? "block" : "hidden"}>
                <ExportManagement />
              </div>
            )}

            {visitedTabs.has("academic-archives") && (
              <div className={activeTab === "academic-archives" ? "block" : "hidden"}>
                <AcademicArchiveManager />
              </div>
            )}

            {visitedTabs.has("system") && (
              <div className={activeTab === "system" ? "block" : "hidden"}>
                <DataManagementPanel />
              </div>
            )}
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
