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
import { BarChart3 } from "lucide-react"
import Link from "next/link"

interface AdminDashboardContentProps {
  currentUser?: User
}

function AdminDashboardContent({ currentUser }: AdminDashboardContentProps) {
  // This should always be provided by ProtectedRoute via cloneElement
  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
            <p className="text-muted-foreground">Manage checklist items and view all evaluations</p>
          </div>
          {currentUser?.role === "super_admin" && (
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-sm">
              <Link href="/admin/tracking">
                <BarChart3 className="mr-2 h-4 w-4" />
                Submission Tracking
              </Link>
            </Button>
          )}
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="checklist" className="space-y-6">
          <TabsList>
            <TabsTrigger value="checklist">Checklist Items</TabsTrigger>
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="data-management">Data Management</TabsTrigger>
          </TabsList>

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
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
