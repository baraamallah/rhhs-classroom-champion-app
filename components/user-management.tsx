"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, UserPlus, Trash2, Mail, Shield, Eye, KeyRound, MoreVertical, RefreshCw, Filter } from "lucide-react"
import { createUserAccount, getAllUsers, deleteUser, sendUserPasswordReset, updateUser, updateUserPassword, getSupervisorClassrooms, getAvailableClassrooms, assignSupervisorToClassrooms } from "@/app/actions/user-actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/types"
import { DIVISION_OPTIONS, getDivisionDisplayName } from "@/lib/division-display"

const getRoleIcon = (role: string) => {
  switch (role) {
    case "super_admin":
      return <Shield className="h-4 w-4" />
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
        description: "Full system access & control"
      }
    case "admin":
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/20",
        label: "Administrator",
        description: "Manage users and settings"
      }
    case "stats":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-900/50",
        label: "Stats Analyst",
        description: "View submission tracking"
      }
    case "supervisor":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-900/50",
        label: "Supervisor",
        description: "Conduct classroom evaluations"
      }
    default:
      return {
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        border: "border-border",
        label: "Unknown Role",
        description: "No specific permissions"
      }
  }
}

type ManagedRole = "admin" | "supervisor" | "stats"

interface UserManagementProps {
  currentUser: User
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; tempPassword?: string } | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordChangeData, setPasswordChangeData] = useState({ newPassword: "", confirmPassword: "" })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showClassroomAssignment, setShowClassroomAssignment] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null)
  const [availableClassrooms, setAvailableClassrooms] = useState<{ id: string, name: string, grade: string, division?: string }[]>([])
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([])
  const [classroomDivisionFilter, setClassroomDivisionFilter] = useState<string>("all")

  const [formData, setFormData] = useState<{ email: string; name: string; role: ManagedRole; password: string }>({
    email: "",
    name: "",
    role: "supervisor",
    password: "",
  })

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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  const generatePasswordForChange = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPasswordChangeData({ newPassword: password, confirmPassword: password })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage(null)

    if (editingUser) {
      // Update existing user
      const result = await updateUser({
        userId: editingUser.id,
        email: formData.email,
        role: formData.role,
        name: formData.name,
      })

      if (result.success) {
        // If password change data exists, update password too
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
      // Create new user
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
    // Handle super_admin role - default to admin since it's not in ManagedRole
    const editableRole: ManagedRole = user.role === "super_admin" ? "admin" : (user.role as ManagedRole)
    setFormData({
      email: user.email,
      name: user.name || "",
      role: editableRole,
      password: "",
    })
    setPasswordChangeData({ newPassword: "", confirmPassword: "" })
    setCurrentPassword(user.password_hash || "••••••••") // Use actual password from database
    setShowPassword(false) // Reset password visibility
    setShowChangePassword(false) // Reset change password section to hidden
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setFormData({ email: "", name: "", role: "supervisor", password: "" })
    setPasswordChangeData({ newPassword: "", confirmPassword: "" })
    setShowCreateForm(false)
    setShowChangePassword(false)
  }

  const handleAssignClassrooms = async (supervisor: User) => {
    setSelectedSupervisor(supervisor)

    // Load available classrooms
    const classroomsResult = await getAvailableClassrooms()
    if (classroomsResult.success) {
      setAvailableClassrooms(classroomsResult.data)
    }

    // Load supervisor's current classrooms
    const supervisorClassroomsResult = await getSupervisorClassrooms(supervisor.id)
    if (supervisorClassroomsResult.success) {
      setSelectedClassrooms(supervisorClassroomsResult.data.map(c => c.id))
    }

    setShowClassroomAssignment(true)
  }

  const handleSaveClassroomAssignment = async () => {
    if (!selectedSupervisor) return

    const result = await assignSupervisorToClassrooms(selectedSupervisor.id, selectedClassrooms)

    if (result.success) {
      setMessage({ type: "success", text: result.message || "Classroom assignments updated successfully" })
      setShowClassroomAssignment(false)
      setSelectedSupervisor(null)
      setSelectedClassrooms([])
      await loadUsers()
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update classroom assignments" })
    }
  }

  const handleCancelClassroomAssignment = () => {
    setShowClassroomAssignment(false)
    setSelectedSupervisor(null)
    setSelectedClassrooms([])
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Create/Edit User Form */}
      {(showCreateForm || editingUser) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingUser ? "Edit User" : "Create New User"}
            </CardTitle>
            <CardDescription>
              {editingUser ? "Update user information" : "Add supervisors or viewers to the system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={editingUser ? currentPassword : formData.password}
                      onChange={(e) => !editingUser && setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? "Current password (hidden)" : "Enter password (min 8 characters)"}
                      autoComplete={editingUser ? "current-password" : "new-password"}
                      required={!editingUser}
                      minLength={8}
                      className="flex-1"
                      disabled={editingUser}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (editingUser) {
                          const newPassword = showPassword ? "••••••••" : (editingUser.password_hash || "••••••••")
                          setCurrentPassword(newPassword)
                        }
                        setShowPassword(!showPassword)
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!editingUser && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generatePassword}
                        title="Generate password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    {editingUser && !showChangePassword && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChangePassword(true)}
                      >
                        Change Password
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: ManagedRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger id="role" name="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(currentUser.role === "super_admin" || currentUser.role === "admin") && (
                        <>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="stats">Stats (Tracking Only)</SelectItem>
                        </>
                      )}
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingUser && showChangePassword && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Change Password</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowChangePassword(false)
                        setPasswordChangeData({ newPassword: "", confirmPassword: "" })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordChangeData.newPassword}
                          onChange={(e) => setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          autoComplete="new-password"
                          minLength={8}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          title={showNewPassword ? "Hide password" : "Show password"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generatePasswordForChange}
                          title="Generate password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordChangeData.confirmPassword}
                          onChange={(e) => setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                          minLength={8}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                  <AlertDescription>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="submit" disabled={creating} size="sm">
                  {creating ? (editingUser ? "Updating..." : "Creating...") : (editingUser ? "Update User" : "Create User")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingUser(null)
                    setFormData({ email: "", name: "", role: "supervisor", password: "" })
                    setPasswordChangeData({ newPassword: "", confirmPassword: "" })
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Users className="h-5 w-5 text-primary" />
                Staff Directory
              </CardTitle>
              <CardDescription className="text-sm">
                Manage accounts, roles, and classroom assignments for all school staff.
              </CardDescription>
            </div>
            {(currentUser.role === "admin" || currentUser.role === "super_admin") && !showCreateForm && !editingUser && (
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                className="w-full sm:w-auto shadow-md"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Staff Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mb-4 opacity-20" />
              <p className="text-sm font-medium tracking-wide uppercase">Syncing User Data...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">No users found in the system</p>
            </div>
          ) : (
            <div className="space-y-10 py-6 sm:py-0">
              {/* Role Categories */}
              {[
                {
                  title: "Administrators",
                  roles: ["super_admin", "admin"],
                  icon: <Shield className="h-5 w-5" />,
                  color: "text-primary"
                },
                {
                  title: "Supervisors",
                  roles: ["supervisor"],
                  icon: <Eye className="h-5 w-5" />,
                  color: "text-blue-500"
                },
                {
                  title: "Data Analysts",
                  roles: ["stats"],
                  icon: <RefreshCw className="h-5 w-5" />,
                  color: "text-purple-500"
                }
              ].map((section) => {
                const sectionUsers = users.filter(user => section.roles.includes(user.role))
                if (sectionUsers.length === 0) return null

                return (
                  <div key={section.title} className="px-4 sm:px-0">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg bg-muted border border-border/50 ${section.color}`}>
                        {section.icon}
                      </div>
                      <h3 className="text-lg font-extrabold tracking-tight uppercase text-foreground/80 flex items-center gap-2">
                        {section.title}
                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-bold text-muted-foreground">
                          {sectionUsers.length}
                        </span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {sectionUsers.map((user) => {
                        const style = getRoleStyles(user.role)
                        return (
                          <div
                            key={user.id}
                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border border-border/60 rounded-2xl bg-card hover:bg-muted/5 transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] border-l-4"
                            style={{ borderLeftColor: user.role === 'super_admin' ? '#ef4444' : user.role === 'admin' ? 'var(--primary)' : user.role === 'supervisor' ? '#3b82f6' : '#a855f7' }}
                          >
                            <div className="flex items-start sm:items-center gap-4 flex-1 mb-4 sm:mb-0">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${style.bg} ${style.border} ${style.text} shadow-inner`}>
                                {getRoleIcon(user.role)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <p className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">
                                    {user.name || "Unnamed User"}
                                  </p>
                                  <div className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${style.bg} ${style.border} ${style.text}`}>
                                    {style.label}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-2">
                                  <Mail className="h-3 w-3 opacity-60" />
                                  <span className="truncate">{user.email}</span>
                                </div>

                                {user.role === "supervisor" && (
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">
                                      Assignments:
                                    </span>
                                    {user.classrooms && user.classrooms.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {user.classrooms.slice(0, 4).map(c => (
                                          <span key={c.id} className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground shadow-sm">
                                            {c.name}
                                          </span>
                                        ))}
                                        {user.classrooms.length > 4 && (
                                          <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                                            +{user.classrooms.length - 4} more
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-600/70 uppercase italic tracking-tighter">
                                        None Assigned
                                      </span>
                                    )}
                                  </div>
                                )}

                                {user.created_by_user && (
                                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-3 tracking-widest">
                                    Onboarded by {user.created_by_user.name}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
                                <>
                                  {user.role === "supervisor" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAssignClassrooms(user)}
                                      className="h-9 px-3 text-xs font-bold shadow-sm"
                                    >
                                      <Shield className="h-3.5 w-3.5 mr-2 opacity-60" />
                                      Assign Rooms
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full hover:bg-muted group-hover:shadow-sm"
                                      >
                                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-1.5">
                                      <DropdownMenuItem onClick={() => handleEditUser(user)} className="py-2.5">
                                        <UserPlus className="h-4 w-4 mr-3 text-primary" />
                                        <span className="font-semibold">Edit Account</span>
                                      </DropdownMenuItem>
                                      {user.role === "supervisor" && (
                                        <DropdownMenuItem onClick={() => handleAssignClassrooms(user)} className="py-2.5">
                                          <Shield className="h-4 w-4 mr-3 text-blue-500" />
                                          <span className="font-semibold">Room Assignments</span>
                                        </DropdownMenuItem>
                                      )}
                                      {currentUser.role === "super_admin" && user.id !== currentUser.id && (
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(user.id)}
                                          variant="destructive"
                                          className="py-2.5 mt-1 border-t"
                                        >
                                          <Trash2 className="h-4 w-4 mr-3" />
                                          <span className="font-semibold">Deactivate User</span>
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classroom Assignment Dialog */}
      {showClassroomAssignment && selectedSupervisor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background border-2 border-border/80 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold mb-4">
              Assign Classrooms to {selectedSupervisor.name}
            </h3>

            {/* Division Filter */}
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Filter by Division:</Label>
              <Select value={classroomDivisionFilter} onValueChange={setClassroomDivisionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {DIVISION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select All / Deselect All */}
            <div className="mb-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const filteredIds = availableClassrooms
                    .filter(classroom => classroomDivisionFilter === "all" || classroom.division === classroomDivisionFilter)
                    .map(c => c.id)
                  setSelectedClassrooms([...new Set([...selectedClassrooms, ...filteredIds])])
                }}
                className="flex-1"
              >
                Select All {classroomDivisionFilter !== "all" && `(${classroomDivisionFilter})`}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const filteredIds = availableClassrooms
                    .filter(classroom => classroomDivisionFilter === "all" || classroom.division === classroomDivisionFilter)
                    .map(c => c.id)
                  setSelectedClassrooms(selectedClassrooms.filter(id => !filteredIds.includes(id)))
                }}
                className="flex-1"
              >
                Deselect All {classroomDivisionFilter !== "all" && `(${classroomDivisionFilter})`}
              </Button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
              {availableClassrooms
                .filter(classroom => classroomDivisionFilter === "all" || classroom.division === classroomDivisionFilter)
                .map((classroom) => (
                  <div key={classroom.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`classroom-${classroom.id}`}
                      checked={selectedClassrooms.includes(classroom.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClassrooms([...selectedClassrooms, classroom.id])
                        } else {
                          setSelectedClassrooms(selectedClassrooms.filter(id => id !== classroom.id))
                        }
                      }}
                      className="rounded border-border"
                    />
                    <label htmlFor={`classroom-${classroom.id}`} className="text-sm cursor-pointer">
                      {classroom.name} (Grade {classroom.grade})
                      {classroom.division && <span className="text-xs text-muted-foreground ml-2">• {getDivisionDisplayName(classroom.division)}</span>}
                    </label>
                  </div>
                ))}
              {availableClassrooms.filter(classroom => classroomDivisionFilter === "all" || classroom.division === classroomDivisionFilter).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {classroomDivisionFilter === "all" ? "No classrooms available" : `No classrooms in ${classroomDivisionFilter}`}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCancelClassroomAssignment}>
                Cancel
              </Button>
              <Button onClick={handleSaveClassroomAssignment}>
                Save Assignments
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
