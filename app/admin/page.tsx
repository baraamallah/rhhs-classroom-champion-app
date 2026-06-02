"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardHeader } from "@/components/dashboard-header"
import { ChecklistManager } from "@/components/checklist-manager"
import { EvaluationsList } from "@/components/evaluations-list"
import { AdminStatisticsTab } from "@/components/admin-statistics-tab"
import type { User } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/user-management"
import { ClassroomManagement } from "@/components/classroom-management"
import { DataManagementPanel } from "@/components/data-management-panel"
import { Button } from "@/components/ui/button"
import { BarChart3, LayoutDashboard, ClipboardList, Building2, FileText, Users, Database, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AdminDashboardContentProps {
  currentUser?: User
}

function AdminDashboardContent({ currentUser }: AdminDashboardContentProps) {
  const router = useRouter()

  useEffect(() => {
    if (currentUser?.role === "stats") {
      router.push("/admin/tracking")
    }
  }, [currentUser, router])

  // This should always be provided by ProtectedRoute via cloneElement
  if (!currentUser || currentUser.role === "stats") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary mb-1">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Control Center</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Admin Dashboard</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Central management for school eco-evaluations, users, and classroom performance data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {currentUser?.role === "super_admin" && (
              <Button asChild variant="default" className="bg-primary hover:bg-primary/90 shadow-md transition-all hover:translate-y-[-1px]">
                <Link href="/admin/tracking">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Submission Tracking
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="shadow-sm">
              <Link href="/">
                View Live Site
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="checklist" className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-start sm:justify-center overflow-x-auto pb-1 no-scrollbar">
              <TabsList className="bg-background/50 backdrop-blur-sm border border-border h-auto p-1 inline-flex w-auto min-w-full sm:min-w-0">
                <TabsTrigger value="checklist" className="py-2.5 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Checklist
                </TabsTrigger>
                <TabsTrigger value="classrooms" className="py-2.5 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Building2 className="mr-2 h-4 w-4" />
                  Classrooms
                </TabsTrigger>
                <TabsTrigger value="evaluations" className="py-2.5 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="mr-2 h-4 w-4" />
                  Evaluations
                </TabsTrigger>
                <TabsTrigger value="statistics" className="py-2.5 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="users" className="py-2.5 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="data-management" className="py-2.5 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Database className="mr-2 h-4 w-4" />
                  System
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="checklist">
            <ChecklistManager currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="classrooms">
            <ClassroomManagement currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="evaluations">
            <EvaluationsList />
          </TabsContent>

          <TabsContent value="statistics">
            <AdminStatisticsTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="data-management">
            <DataManagementPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "stats"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
