"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session"
import { generateSecurePassword } from "./password-actions"

type ManagedRole = "admin" | "supervisor" | "stats"
type UserRole = "super_admin" | "admin" | "supervisor" | "viewer" | "stats"

interface CurrentUser {
  id: string
  role: UserRole
}

async function requireAdmin(): Promise<{ currentUser?: CurrentUser; error?: string }> {
  const session = await getSessionFromCookies()

  if (!session) {
    return { error: "Not authenticated" }
  }

  const supabase = await createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, role, is_active')
    .eq('id', session.userId)
    .single()

  if (userError || !userData) {
    console.error("[user-actions] requireAdmin check failed:", userError?.message || "User not found")
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

  const supabase = await createAdminClient()

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

  const supabase = await createAdminClient()

  try {
    let query = supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at')
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

    // Batch fetch all supervisor-classroom relations in a single query (N+1 fix)
    const supervisorIds = data?.filter(r => r.role === 'supervisor').map(r => r.id) || []
    const classroomsBySupervisor = new Map<string, { id: string; name: string; grade: string }[]>()

    if (supervisorIds.length > 0) {
      const { data: supervisorClassrooms, error: relError } = await supabase
        .from('classroom_supervisors')
        .select('supervisor_id, classroom_id, classrooms!inner(id, name, grade)')
        .in('supervisor_id', supervisorIds)
        .eq('classrooms.is_active', true)

      if (!relError && supervisorClassrooms) {
        for (const item of supervisorClassrooms) {
          const existing = classroomsBySupervisor.get(item.supervisor_id) || []
          const relatedClassrooms = Array.isArray(item.classrooms)
            ? item.classrooms
            : [item.classrooms]
          for (const classroom of relatedClassrooms) {
            if (classroom?.id && classroom.name && classroom.grade) {
              existing.push({ id: classroom.id, name: classroom.name, grade: classroom.grade })
            }
          }
          classroomsBySupervisor.set(item.supervisor_id, existing)
        }
      }
    }

    const formattedData = (data || []).map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      password_hash: undefined,
      created_by: undefined,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: undefined,
      classrooms: classroomsBySupervisor.get(row.id) || [],
    }))

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

  const supabase = await createAdminClient()

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

    // Allow admins and super_admins to manage any user

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

  // Allow admins to edit admin accounts, but not create them (restriction remains in createUserAccount)

  const supabase = await createAdminClient()

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

    // Allow admins and super_admins to edit any user

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

  const supabase = await createAdminClient()

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

    // Allow admins and super_admins to edit any user's password

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
  const supabase = await createAdminClient()

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

  const supabase = await createAdminClient()
  
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

  const supabase = await createAdminClient()

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

  const supabase = await createAdminClient()
  
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

export async function assignDivisionToSupervisor(supervisorId: string, division: string, replaceExisting = false) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { data: divisionClassrooms, error: queryError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("division", division)
      .eq("is_active", true)

    if (queryError) {
      return { success: false, error: queryError.message }
    }

    if (!divisionClassrooms || divisionClassrooms.length === 0) {
      return { success: false, error: `No active classrooms found in ${division}` }
    }

    const divisionIds = divisionClassrooms.map((c) => c.id)

    if (replaceExisting) {
      await supabase.from("classroom_supervisors").delete().eq("supervisor_id", supervisorId)
      const assignments = divisionIds.map((id) => ({
        classroom_id: id,
        supervisor_id: supervisorId,
      }))
      await supabase.from("classroom_supervisors").insert(assignments)
    } else {
      const assignments = divisionIds.map((id) => ({
        classroom_id: id,
        supervisor_id: supervisorId,
      }))
      await supabase.from("classroom_supervisors").upsert(assignments, { onConflict: "classroom_id, supervisor_id" })
    }

    revalidatePath("/admin")
    return {
      success: true,
      message: `Assigned all ${divisionIds.length} classrooms in ${division} to supervisor.`,
    }
  } catch (dbError: any) {
    console.error("[user-actions] assignDivisionToSupervisor error", dbError)
    return { success: false, error: dbError.message || "Failed to assign division" }
  }
}
