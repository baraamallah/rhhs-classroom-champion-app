"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireRoleAction } from "@/lib/auth/server"
import { hashPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/password"
import { generateSecurePassword } from "@/lib/auth/password-generator"

type ManagedRole = "admin" | "supervisor" | "stats"

const managedRoleSchema = z.enum(["admin", "supervisor", "stats"])
const emailSchema = z.string().trim().toLowerCase().email("A valid email address is required").max(254)
const nameSchema = z.string().trim().min(1, "Name is required").max(120)
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`)

async function requireAdmin() {
  return requireRoleAction(["super_admin", "admin"], {
    clearOnInvalid: true,
    deniedMessage: "Unauthorized: Admin access required",
  })
}

export async function createUserAccount(formData: {
  email: string
  role: ManagedRole
  name: string
  password: string
}) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const parsed = z
    .object({
      email: emailSchema,
      name: nameSchema,
      role: managedRoleSchema,
      password: passwordSchema,
    })
    .safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid user details" }
  }

  const { email, name, role, password } = parsed.data

  if (currentUser.role === "admin" && role === "admin") {
    return { success: false, error: "Unauthorized: Only super admins can create admin accounts" }
  }

  const supabase = await createAdminClient()

  try {
    const passwordHash = await hashPassword(password)
    const { error: insertError } = await supabase.from("users").insert({
      email,
      password_hash: passwordHash,
      role,
      name,
      is_active: true,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: false, error: "Email is already in use" }
      }
      console.error("[user-actions] createUserAccount error", insertError)
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
    const { data, error: queryError } = await supabase
      .from("users")
      .select("id, email, name, role, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (queryError) {
      console.error("[user-actions] getAllUsers error", queryError)
      return { success: false, error: "Failed to fetch users", data: [] }
    }

    const supervisorIds = data?.filter((r) => r.role === "supervisor").map((r) => r.id) || []
    const classroomsBySupervisor = new Map<string, { id: string; name: string; grade: string }[]>()

    if (supervisorIds.length > 0) {
      const { data: supervisorClassrooms, error: relError } = await supabase
        .from("classroom_supervisors")
        .select("supervisor_id, classroom_id, classrooms!inner(id, name, grade)")
        .in("supervisor_id", supervisorIds)
        .eq("classrooms.is_active", true)

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
      .from("users")
      .select("role")
      .eq("id", userId)
      .eq("is_active", true)
      .single()

    if (targetError || !targetData) {
      return { success: false, error: "User not found" }
    }

    if (targetData.role === "super_admin" && currentUser.role !== "super_admin") {
      return { success: false, error: "Unauthorized: Only super admins can manage super admin accounts" }
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", userId)

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

export async function updateUser(formData: {
  userId: string
  email: string
  name: string
  role: ManagedRole
}) {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const parsed = z
    .object({
      userId: z.string().min(1),
      email: emailSchema,
      name: nameSchema,
      role: managedRoleSchema,
    })
    .safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid user details" }
  }

  const { userId, email, name, role } = parsed.data
  const supabase = await createAdminClient()

  try {
    const { data: targetData, error: targetError } = await supabase
      .from("users")
      .select("role, id, name, email")
      .eq("id", userId)
      .single()

    if (targetError || !targetData) {
      return { success: false, error: "User not found" }
    }

    if (targetData.role === "super_admin" && currentUser.role !== "super_admin") {
      return { success: false, error: "Unauthorized: Only super admins can modify super admin accounts" }
    }

    if (role === "admin" && targetData.role !== "admin" && currentUser.role !== "super_admin") {
      return { success: false, error: "Unauthorized: Only super admins can promote accounts to admin" }
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ email, name, role })
      .eq("id", userId)

    if (updateError) {
      if (updateError.code === "23505") {
        return { success: false, error: "Email is already in use" }
      }
      console.error("[user-actions] updateUser error", updateError)
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

  const parsed = z
    .object({
      userId: z.string().min(1),
      password: passwordSchema,
    })
    .safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid password" }
  }

  const supabase = await createAdminClient()

  try {
    const { data: targetData, error: targetError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", parsed.data.userId)
      .eq("is_active", true)
      .single()

    if (targetError || !targetData) {
      return { success: false, error: "User not found" }
    }

    if (targetData.role === "super_admin" && currentUser.role !== "super_admin") {
      return { success: false, error: "Unauthorized: Only super admins can change a super admin password" }
    }

    const passwordHash = await hashPassword(parsed.data.password)

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", parsed.data.userId)

    if (updateError) {
      console.error("[user-actions] updateUserPassword error", updateError)
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

  const parsedEmail = emailSchema.safeParse(email)
  if (!parsedEmail.success) {
    return { success: false, error: "Invalid email address" }
  }

  const supabase = await createAdminClient()

  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", parsedEmail.data)
      .eq("is_active", true)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User not found or inactive" }
    }

    if (userData.role === "super_admin" && currentUser.role !== "super_admin") {
      return { success: false, error: "Unauthorized: Only super admins can reset a super admin password" }
    }

    const tempPassword = generateSecurePassword(14)
    const passwordHash = await hashPassword(tempPassword)

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", userData.id)

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
    const { data, error: queryError } = await supabase
      .from("classroom_supervisors")
      .select("classroom_id, classrooms!inner(id, name, grade)")
      .eq("supervisor_id", supervisorId)
      .eq("classrooms.is_active", true)

    if (queryError) {
      console.error("[user-actions] getSupervisorClassrooms error", queryError)
      return { success: false, error: "Failed to fetch classrooms", data: [] }
    }

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
      .from("classrooms")
      .select("id, name, grade, division")
      .eq("is_active", true)
      .order("name")

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
    const { error: removeError } = await supabase
      .from("classroom_supervisors")
      .delete()
      .eq("supervisor_id", supervisorId)

    if (removeError) {
      console.error("[user-actions] assignSupervisorToClassrooms remove error", removeError)
      return { success: false, error: "Failed to remove existing assignments" }
    }

    if (classroomIds.length > 0) {
      const uniqueClassroomIds = [...new Set(classroomIds)]
      const assignments = uniqueClassroomIds.map((classroomId) => ({
        classroom_id: classroomId,
        supervisor_id: supervisorId,
      }))

      const { error: assignError } = await supabase
        .from("classroom_supervisors")
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

export async function assignDivisionToSupervisor(
  supervisorId: string,
  division: string,
  replaceExisting = false
) {
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
      await supabase
        .from("classroom_supervisors")
        .upsert(assignments, { onConflict: "classroom_id, supervisor_id" })
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
