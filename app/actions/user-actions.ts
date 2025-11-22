"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session"
import { generateSecurePassword } from "./password-actions"

type ManagedRole = "admin" | "supervisor"
type UserRole = "super_admin" | "admin" | "supervisor" | "viewer"

interface CurrentUser {
  id: string
  role: UserRole
}

async function requireAdmin(): Promise<{ currentUser?: CurrentUser; error?: string }> {
  const session = await getSessionFromCookies()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, role, is_active')
    .eq('id', session.userId)
    .single()

  if (userError || !userData) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (!userData.is_active) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (!["super_admin", "admin"].includes(userData.role)) {
    return { error: "Unauthorized: Admin access required" }
  }

  return { currentUser: { id: userData.id, role: userData.role } }
}

export async function createUserAccount(formData: { email: string; role: ManagedRole; name: string; password: string }) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (currentUser.role === "admin" && formData.role === "admin") {
    return { success: false, error: "Unauthorized: Only super admins can create admin accounts" }
  }

  const email = formData.email.trim().toLowerCase()
  const name = formData.name.trim()
  if (!email || !name) {
    return { success: false, error: "Name and email are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: formData.password,
        role: formData.role,
        name,
        is_active: true
      })

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Email is already in use" }
      }
      console.error("[user-actions] createUserAccount error", error)
      return { success: false, error: "Failed to create user" }
    }
  } catch (dbError: any) {
    console.error("[user-actions] createUserAccount error", dbError)
    return { success: false, error: "Failed to create user" }
  }

  revalidatePath("/admin")
  return {
    success: true,
    message: "User created successfully.",
  }
}

export async function getAllUsers() {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] as any[] }
  }

  const supabase = await createClient()

  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // For admin users, show all users (they can see everyone but can only assign classrooms)
    // Super admins see all users and can edit/delete
    // No additional filtering needed

    const { data, error: queryError } = await query

    if (queryError) {
      console.error("[user-actions] getAllUsers error", queryError)
      return { success: false, error: "Failed to fetch users", data: [] }
    }

    // Fetch classroom assignments for supervisors
    const formattedData = await Promise.all(
      data?.map(async (row) => {
        let classrooms: { id: string; name: string; grade: string }[] = []

        // If user is a supervisor, fetch their classroom assignments using the junction table
        if (row.role === 'supervisor') {
          const { data: classroomData, error: classroomError } = await supabase
            .from('classroom_supervisors')
            .select('classroom_id, classrooms!inner(id, name, grade)')
            .eq('supervisor_id', row.id)
            .eq('classrooms.is_active', true)

          if (!classroomError && classroomData) {
            classrooms = classroomData.map((item: any) => item.classrooms)
          }
        }

        return {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          password_hash: row.password_hash,
          created_by: undefined, // TODO: Add created_by column to users table
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: undefined, // TODO: Add updated_at column to users table
          classrooms: classrooms,
        }
      }) || []
    )

    return { success: true, data: formattedData }
  } catch (dbError) {
    console.error("[user-actions] getAllUsers error", dbError)
    return { success: false, error: "Failed to fetch users", data: [] }
  }
}

export async function deleteUser(userId: string) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (userId === currentUser.id) {
    return { success: false, error: "Cannot deactivate your own account" }
  }

  const supabase = await createClient()

  try {
    const { data: targetData, error: targetError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (targetError || !targetData) {
      return { success: false, error: "User not found" }
    }

    // For now, allow all super_admins to manage any user
    // TODO: Add created_by column to users table if needed for permission control

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (updateError) {
      console.error("[user-actions] deleteUser error", updateError)
      return { success: false, error: "Failed to deactivate user" }
    }

    revalidatePath("/admin")
    return { success: true, message: "User deactivated successfully" }
  } catch (dbError) {
    console.error("[user-actions] deleteUser error", dbError)
    return { success: false, error: "Failed to deactivate user" }
  }
}

export async function updateUser(formData: { userId: string; email: string; name: string; role: ManagedRole }) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const email = formData.email.trim().toLowerCase()
  const name = formData.name.trim()
  if (!email || !name) {
    return { success: false, error: "Name and email are required" }
  }

  if (currentUser.role === "admin" && formData.role === "admin") {
    return { success: false, error: "Unauthorized: Only super admins can create admin accounts" }
  }

  const supabase = await createClient()

  try {
    // Check if user exists and current user has permission to edit
    const { data: targetData, error: targetError } = await supabase
      .from('users')
      .select('role, id, name, email')
      .eq('id', formData.userId)
      .single()

    if (targetError || !targetData) {
      return { success: false, error: "User not found" }
    }

    // For now, allow all super_admins to edit any user
    // TODO: Add created_by column to users table if needed for permission control

    const { error } = await supabase
      .from('users')
      .update({
        email,
        name,
        role: formData.role
      })
      .eq('id', formData.userId)

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Email is already in use" }
      }
      console.error("[user-actions] updateUser error", error)
      return { success: false, error: "Failed to update user" }
    }
  } catch (dbError: any) {
    console.error("[user-actions] updateUser error", dbError)
    return { success: false, error: "Failed to update user" }
  }

  revalidatePath("/admin")
  return {
    success: true,
    message: "User updated successfully.",
  }
}

export async function updateUserPassword(formData: { userId: string; password: string }) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!formData.password || formData.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }

  const supabase = await createClient()

  try {
    // Check if user exists and current user has permission to edit
    const { data: targetData, error: targetError } = await supabase
      .from('users')
      .select('id')
      .eq('id', formData.userId)
      .eq('is_active', true)
      .single()

    if (targetError || !targetData) {
      return { success: false, error: "User not found" }
    }

    // For now, allow all super_admins to edit any user
    // TODO: Add created_by column to users table if needed for permission control

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: formData.password
      })
      .eq('id', formData.userId)

    if (error) {
      console.error("[user-actions] updateUserPassword error", error)
      return { success: false, error: "Failed to update password" }
    }
  } catch (dbError: any) {
    console.error("[user-actions] updateUserPassword error", dbError)
    return { success: false, error: "Failed to update password" }
  }

  revalidatePath("/admin")
  return {
    success: true,
    message: "Password updated successfully.",
  }
}

export async function sendUserPasswordReset(email: string) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const supabase = await createClient()

  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User not found or inactive" }
    }

    const tempPassword = await generateSecurePassword(12)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: tempPassword
      })
      .eq('id', userData.id)

    if (updateError) {
      console.error("[user-actions] sendUserPasswordReset error", updateError)
      return { success: false, error: "Failed to reset password" }
    }

    return {
      success: true,
      tempPassword,
      message: "Temporary password generated. Share it securely with the user.",
    }
  } catch (dbError) {
    console.error("[user-actions] sendUserPasswordReset error", dbError)
    return { success: false, error: "Failed to reset password" }
  }
}

export async function getSupervisorClassrooms(supervisorId: string) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createClient()
  
  try {
    // Query using the classroom_supervisors junction table
    const { data, error: queryError } = await supabase
      .from('classroom_supervisors')
      .select('classroom_id, classrooms!inner(id, name, grade)')
      .eq('supervisor_id', supervisorId)
      .eq('classrooms.is_active', true)

    if (queryError) {
      console.error("[user-actions] getSupervisorClassrooms error", queryError)
      return { success: false, error: "Failed to fetch classrooms", data: [] }
    }

    // Transform the data to return classroom objects
    const classrooms = data?.map((item: any) => item.classrooms) || []
    return { success: true, data: classrooms }
  } catch (dbError) {
    console.error("[user-actions] getSupervisorClassrooms error", dbError)
    return { success: false, error: "Failed to fetch classrooms", data: [] }
  }
}

export async function getAvailableClassrooms() {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createClient()

  try {
    const { data, error: queryError } = await supabase
      .from('classrooms')
      .select('id, name, grade, division')
      .eq('is_active', true)
      .order('name')

    if (queryError) {
      console.error("[user-actions] getAvailableClassrooms error", queryError)
      return { success: false, error: "Failed to fetch classrooms", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (dbError) {
    console.error("[user-actions] getAvailableClassrooms error", dbError)
    return { success: false, error: "Failed to fetch classrooms", data: [] }
  }
}

export async function assignSupervisorToClassrooms(supervisorId: string, classroomIds: string[]) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createClient()
  
  try {
    // First, remove all existing assignments for this supervisor from the junction table
    const { error: removeError } = await supabase
      .from('classroom_supervisors')
      .delete()
      .eq('supervisor_id', supervisorId)

    if (removeError) {
      console.error("[user-actions] assignSupervisorToClassrooms remove error", removeError)
      return { success: false, error: "Failed to remove existing assignments" }
    }

    // Then assign to new classrooms using the junction table
    if (classroomIds.length > 0) {
      const assignments = classroomIds.map(classroomId => ({
        classroom_id: classroomId,
        supervisor_id: supervisorId
      }))

      const { error: assignError } = await supabase
        .from('classroom_supervisors')
        .insert(assignments)

      if (assignError) {
        console.error("[user-actions] assignSupervisorToClassrooms assign error", assignError)
        return { success: false, error: "Failed to assign classrooms" }
      }
    }

    revalidatePath("/admin")
    return { success: true, message: "Classroom assignments updated successfully" }
  } catch (dbError) {
    console.error("[user-actions] assignSupervisorToClassrooms error", dbError)
    return { success: false, error: "Failed to update classroom assignments" }
  }
}
