"use client"

import { useState, useEffect } from "react"
import { AdminPageHeader } from "@/components/features/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, UserPlus, Trash2, Mail, Shield, Eye, KeyRound, MoreVertical, RefreshCw, Filter, Building2 } from "lucide-react"
import {
  createUserAccount,
  getAllUsers,
  deleteUser,
  sendUserPasswordReset,
  updateUser,
  updateUserPassword,
  getSupervisorClassrooms,
  getAvailableClassrooms,
} from "@/app/actions/user-actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/types"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"
import { DivisionAssignmentModal } from "./division-assignment-modal"

type ManagedRole = "admin" | "supervisor" | "stats"

const getRoleIcon = (role: string) => {
  switch (role) {
    case "super_admin":
    case "admin":
      return <Shield className="h-4 w-4" />
    case "stats":
      return <RefreshCw className="h-4 w-4" />
    case "supervisor":
      return <Eye className="h-4 w-4" />
    default:
      return <Mail className="h-4 w-4" />
  }
}

const getRoleStyles = (role: string) => {
  switch (role) {
    case "super_admin":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-900/50",
        label: "Super Admin",
        description: "Full system access & control",
      }
    case "admin":
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/20",
        label: "Administrator",
        description: "Manage users and settings",
      }
    case "stats":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-900/50",
        label: "Stats Analyst",
        description: "View submission tracking",
      }
    case "supervisor":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-900/50",
        label: "Supervisor",
        description: "Evaluate assigned classrooms",
      }
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
        label: role,
        description: "Read-only access",
      }
  }
}

export function UserManagement({ currentUser }: { currentUser?: User }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; tempPassword?: string } | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "supervisor" as ManagedRole,
    password: "",
  })

  // Password change state for edit mode
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordChangeData, setPasswordChangeData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  // Classroom assignment modal state
  const [showClassroomAssignment, setShowClassroomAssignment] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null)
  const [availableClassrooms, setAvailableClassrooms] = useState<any[]>([])
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const result = await getAllUsers()
    if (result.success) {
      setUsers(result.data)
    } else {
      setMessage({ type: "error", text: result.error || "Failed to load users" })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage(null)

    if (editingUser) {
      const result = await updateUser({
        userId: editingUser.id,
        email: formData.email,
        role: formData.role,
        name: formData.name,
      })

      if (result.success) {
        if (passwordChangeData.newPassword && passwordChangeData.confirmPassword) {
          if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" })
            setCreating(false)
            return
          }

          const passwordResult = await updateUserPassword({
            userId: editingUser.id,
            password: passwordChangeData.newPassword,
          })

          if (!passwordResult.success) {
            setMessage({ type: "error", text: passwordResult.error || "Failed to update password" })
            setCreating(false)
            return
          }
        }

        setMessage({
          type: "success",
          text: result.message || "User updated successfully",
        })
        setEditingUser(null)
        setFormData({ email: "", name: "", role: "supervisor", password: "" })
        setPasswordChangeData({ newPassword: "", confirmPassword: "" })
        setShowCreateForm(false)
        setShowChangePassword(false)
        await loadUsers()
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update user",
        })
      }
    } else {
      const result = await createUserAccount({
        email: formData.email,
        role: formData.role,
        name: formData.name,
        password: formData.password,
      })

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "User created successfully",
        })
        setFormData({ email: "", name: "", role: "supervisor", password: "" })
        setShowCreateForm(false)
        await loadUsers()
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to create user",
        })
      }
    }

    setCreating(false)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    const result = await deleteUser(userId)
    if (result.success) {
      setMessage({ type: "success", text: result.message || "User deactivated successfully" })
      await loadUsers()
    } else {
      setMessage({ type: "error", text: result.error || "Failed to deactivate user" })
    }
  }

  const handlePasswordReset = async (email: string) => {
    const result = await sendUserPasswordReset(email)
    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "Temporary password generated successfully",
        tempPassword: result.tempPassword,
      })
    } else {
      setMessage({ type: "error", text: result.error || "Failed to reset password" })
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    const editableRole: ManagedRole = user.role === "super_admin" ? "admin" : (user.role as ManagedRole)
    setFormData({
      email: user.email,
      name: user.name || "",
      role: editableRole,
      password: "",
    })
    setPasswordChangeData({ newPassword: "", confirmPassword: "" })
    setShowCreateForm(true)
  }

  const handleAssignClassrooms = async (supervisor: User) => {
    setSelectedSupervisor(supervisor)

    const classroomsResult = await getAvailableClassrooms()
    if (classroomsResult.success) {
      setAvailableClassrooms(classroomsResult.data)
    }

    const supervisorClassroomsResult = await getSupervisorClassrooms(supervisor.id)
    if (supervisorClassroomsResult.success) {
      setSelectedClassrooms(supervisorClassroomsResult.data.map((c: any) => c.id))
    }

    setShowClassroomAssignment(true)
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Alert Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="flex items-center justify-between">
            <span>{message.text}</span>
            {message.tempPassword && (
              <span className="font-mono bg-background px-2 py-1 rounded border font-bold">
                {message.tempPassword}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Banner */}
      <AdminPageHeader
        badge="Access & Roles"
        badgeLabel="User Directory & Permissions"
        title="Staff & User Directory"
        description="Manage school supervisors, admins, analysts, and their classroom division assignments."
        action={
          <Button
            onClick={() => {
              setEditingUser(null)
              setFormData({ email: "", name: "", role: "supervisor", password: "" })
              setShowCreateForm(!showCreateForm)
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {showCreateForm ? "Cancel" : "Add New User"}
          </Button>
        }
      />

      {/* Create / Edit Form */}
      {showCreateForm && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>{editingUser ? "Edit User Account" : "Create Staff Account"}</CardTitle>
            <CardDescription>
              {editingUser ? "Update profile details or permissions" : "Create a login account for school staff"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">School Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="s.jenkins@rhhs.edu.lb"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role">Role Permission</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val: ManagedRole) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supervisor">Supervisor (Can evaluate classrooms)</SelectItem>
                      <SelectItem value="stats">Stats Analyst (Can view tracking statistics)</SelectItem>
                      <SelectItem value="admin">Administrator (Full dashboard access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!editingUser && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Password update section if editing */}
              {editingUser && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Change User Password</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChangePassword(!showChangePassword)}
                    >
                      {showChangePassword ? "Cancel" : "Set New Password"}
                    </Button>
                  </div>

                  {showChangePassword && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="password"
                        placeholder="New Password"
                        value={passwordChangeData.newPassword}
                        onChange={(e) =>
                          setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordChangeData.confirmPassword}
                        onChange={(e) =>
                          setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Saving..." : editingUser ? "Update User" : "Create Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Search by staff name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl min-h-11"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="rounded-xl min-h-11">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admins</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="supervisor">Supervisors</SelectItem>
              <SelectItem value="stats">Stats Analysts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredUsers.map((user) => {
          const style = getRoleStyles(user.role)
          const assignedRooms = user.classrooms || []

          return (
            <Card
              key={user.id}
              className="rounded-2xl border-border/80 hover:border-border transition-all shadow-xs overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`h-11 w-11 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{user.name}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>

                    {/* Assigned Classrooms Badges for Supervisors */}
                    {user.role === "supervisor" && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-muted-foreground">Assigned Rooms:</span>
                        {assignedRooms.length === 0 ? (
                          <span className="text-[11px] text-amber-500 font-medium">None assigned</span>
                        ) : (
                          assignedRooms.slice(0, 4).map((room) => (
                            <span
                              key={room.id}
                              className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-md border border-border/60 text-foreground"
                            >
                              {room.name}
                            </span>
                          ))
                        )}
                        {assignedRooms.length > 4 && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            +{assignedRooms.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                  {user.role === "supervisor" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignClassrooms(user)}
                      className="rounded-xl text-xs min-h-11 px-3.5 hover:bg-primary/10 hover:text-primary hover:border-primary/40 cursor-pointer"
                    >
                      <Building2 className="mr-1.5 h-3.5 w-3.5" />
                      Assign Rooms ({assignedRooms.length})
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-xl flex items-center justify-center cursor-pointer">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        Edit Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePasswordReset(user.email)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      {user.role !== "super_admin" && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Smart Division & Classroom Assignment Modal */}
      <DivisionAssignmentModal
        isOpen={showClassroomAssignment}
        onClose={() => {
          setShowClassroomAssignment(false)
          setSelectedSupervisor(null)
          setSelectedClassrooms([])
        }}
        supervisor={selectedSupervisor}
        availableClassrooms={availableClassrooms}
        currentAssignedIds={selectedClassrooms}
        onSuccess={async () => {
          await loadUsers()
        }}
      />
    </div>
  )
}
