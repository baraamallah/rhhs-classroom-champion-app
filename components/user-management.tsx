"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Trash2, Mail, Shield, Eye, KeyRound, MoreVertical, RefreshCw } from "lucide-react"
import { createUserAccount, getAllUsers, deleteUser, sendUserPasswordReset, updateUser, updateUserPassword, getSupervisorClassrooms, getAvailableClassrooms, assignSupervisorToClassrooms } from "@/app/actions/user-actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/types"

type ManagedRole = "admin" | "supervisor"

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
  const [availableClassrooms, setAvailableClassrooms] = useState<{id: string, name: string, grade: string}[]>([])
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([])

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
    setFormData({
      email: user.email,
      name: user.name || "",
      role: user.role as ManagedRole,
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-4 w-4 text-red-500" />
      case "admin":
        return <Shield className="h-4 w-4 text-primary" />
      case "supervisor":
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRoleAvatarBg = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500/10"
      case "admin":
        return "bg-primary/10"
      case "supervisor":
        return "bg-blue-500/10"
      default:
        return "bg-muted/10"
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "admin":
        return "bg-primary/10 text-primary border-primary/20"
      case "supervisor":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-6">
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
                    {currentUser.role === "super_admin" && <SelectItem value="admin">Admin</SelectItem>}
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage existing users in the system</CardDescription>
            </div>
            {currentUser.role === "super_admin" && !showCreateForm && !editingUser && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="space-y-6">
              {/* Supervisors Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Supervisors</h3>
                  <span className="text-sm text-muted-foreground">
                    ({users.filter(user => user.role === "supervisor").length})
                  </span>
                </div>
                <div className="space-y-3">
                  {users.filter(user => user.role === "supervisor").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRoleAvatarBg(user.role)}`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.name || "Unnamed User"}</p>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground">
                              Classrooms: {user.classrooms && user.classrooms.length > 0 
                                ? user.classrooms.map(c => c.name).join(", ")
                                : "No classrooms assigned"
                              }
                            </p>
                          </div>
                          {user.created_by_user && (
                            <p className="text-xs text-muted-foreground">
                              Created by: {user.created_by_user.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignClassrooms(user)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Assign to Classrooms
                          </Button>
                        )}
                        {currentUser.role === "super_admin" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id)}
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.filter(user => user.role === "supervisor").length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No supervisors found</p>
                  )}
                </div>
              </div>

              {/* Admins Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Administrators</h3>
                  <span className="text-sm text-muted-foreground">
                    ({users.filter(user => user.role === "admin" || user.role === "super_admin").length})
                  </span>
                </div>
                <div className="space-y-3">
                  {users.filter(user => user.role === "admin" || user.role === "super_admin").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRoleAvatarBg(user.role)}`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.name || "Unnamed User"}</p>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                              {user.role === "super_admin" ? "Super Admin" : user.role}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.created_by_user && (
                            <p className="text-xs text-muted-foreground">
                              Created by: {user.created_by_user.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUser.role === "super_admin" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              {user.id !== currentUser.id && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user.id)}
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.filter(user => user.role === "admin" || user.role === "super_admin").length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No administrators found</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classroom Assignment Dialog */}
      {showClassroomAssignment && selectedSupervisor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign Classrooms to {selectedSupervisor.name}
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableClassrooms.map((classroom) => (
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
                  <label htmlFor={`classroom-${classroom.id}`} className="text-sm">
                    {classroom.name} (Grade {classroom.grade})
                  </label>
                </div>
              ))}
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
