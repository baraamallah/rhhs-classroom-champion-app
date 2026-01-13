"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies, clearSessionCookie } from "@/lib/auth/session"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"

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

  const supabase = await createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError || !userData) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (!userData.is_active) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (userData.role !== "super_admin" && userData.role !== "admin") {
    return { error: "Unauthorized: Admin access required" }
  }

  return { currentUser: { id: userData.id, role: userData.role } }
}

interface ExportData {
  filename: string
  content: string
}

export async function exportAllDataAsZip() {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()
  const exportFiles: ExportData[] = []

  try {
    // 1. Export Active Evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from("evaluations")
      .select(`
        *,
        classrooms:classroom_id (name, grade, division),
        users:supervisor_id (name, email)
      `)
      .order("evaluation_date", { ascending: false })

    if (!evalError && evaluations) {
      let evalContent = "ACTIVE EVALUATIONS\n"
      evalContent += "=".repeat(80) + "\n\n"
      evalContent += `Total Evaluations: ${evaluations.length}\n`
      evalContent += `Export Date: ${new Date().toISOString()}\n\n`

      evaluations.forEach((evaluation, index) => {
        evalContent += `\n[Evaluation ${index + 1}]\n`
        evalContent += `- ID: ${evaluation.id}\n`
        evalContent += `- Date: ${new Date(evaluation.evaluation_date).toLocaleString()}\n`
        evalContent += `- Classroom: ${evaluation.classrooms?.name || "Unknown"} (Grade ${evaluation.classrooms?.grade || "N/A"})\n`
        evalContent += `- Division: ${evaluation.classrooms?.division || "N/A"}\n`
        evalContent += `- Supervisor: ${evaluation.users?.name || "Unknown"} (${evaluation.users?.email || "N/A"})\n`
        evalContent += `- Score: ${evaluation.total_score}/${evaluation.max_score}\n`
        evalContent += `- Items Checked: ${Object.keys(evaluation.items || {}).filter(k => evaluation.items[k]).length}\n`
        if (evaluation.notes) {
          evalContent += `- Notes: ${evaluation.notes}\n`
        }
        evalContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "01_active_evaluations.txt", content: evalContent })
    }

    // 2. Export Archived Evaluations
    const { data: archivedEvals, error: archEvalError } = await supabase
      .from("archive_evaluations")
      .select("*")
      .order("archived_at", { ascending: false })

    if (!archEvalError && archivedEvals) {
      let archContent = "ARCHIVED EVALUATIONS\n"
      archContent += "=".repeat(80) + "\n\n"
      archContent += `Total Archived: ${archivedEvals.length}\n`
      archContent += `Export Date: ${new Date().toISOString()}\n\n`

      archivedEvals.forEach((evaluation, index) => {
        archContent += `\n[Archived Evaluation ${index + 1}]\n`
        archContent += `- ID: ${evaluation.id}\n`
        archContent += `- Original Date: ${new Date(evaluation.evaluation_date).toLocaleString()}\n`
        archContent += `- Archived Date: ${evaluation.archived_at ? new Date(evaluation.archived_at).toLocaleString() : "N/A"}\n`
        archContent += `- Score: ${evaluation.total_score}/${evaluation.max_score}\n`
        archContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "02_archived_evaluations.txt", content: archContent })
    }

    // 3. Export Classrooms
    const { data: classrooms, error: classError } = await supabase
      .from("classrooms")
      .select("*")
      .order("name", { ascending: true })

    // Get supervisor assignments separately
    const { data: assignments } = await supabase
      .from("classroom_supervisors")
      .select(`
        classroom_id,
        users:supervisor_id (name, email)
      `)

    if (!classError && classrooms) {
      let classContent = "CLASSROOMS\n"
      classContent += "=".repeat(80) + "\n\n"
      classContent += `Total Classrooms: ${classrooms.length}\n`
      classContent += `Export Date: ${new Date().toISOString()}\n\n`

      classrooms.forEach((classroom, index) => {
        classContent += `\n[Classroom ${index + 1}]\n`
        classContent += `- ID: ${classroom.id}\n`
        classContent += `- Name: ${classroom.name}\n`
        classContent += `- Grade: ${classroom.grade}\n`
        classContent += `- Division: ${classroom.division || "N/A"}\n`
        if (classroom.description) {
          classContent += `- Description: ${classroom.description}\n`
        }
        const supervisors = (assignments || [])
          .filter((a: any) => a.classroom_id === classroom.id)
          .map((a: any) => a.users?.name)
          .filter(Boolean)
        classContent += `- Supervisors: ${supervisors.length > 0 ? supervisors.join(", ") : "None assigned"}\n`
        classContent += `- Active: ${classroom.is_active ? "Yes" : "No"}\n`
        classContent += `- Created: ${new Date(classroom.created_at).toLocaleString()}\n`
        classContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "03_classrooms.txt", content: classContent })
    }

    // 4. Export Supervisors
    const { data: supervisors, error: supError } = await supabase
      .from("users")
      .select("*")
      .eq("role", "supervisor")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (!supError && supervisors) {
      let supContent = "SUPERVISORS\n"
      supContent += "=".repeat(80) + "\n\n"
      supContent += `Total Supervisors: ${supervisors.length}\n`
      supContent += `Export Date: ${new Date().toISOString()}\n\n`

      supervisors.forEach((supervisor, index) => {
        supContent += `\n[Supervisor ${index + 1}]\n`
        supContent += `- ID: ${supervisor.id}\n`
        supContent += `- Name: ${supervisor.name}\n`
        supContent += `- Email: ${supervisor.email}\n`
        supContent += `- Role: ${supervisor.role}\n`
        supContent += `- Created: ${new Date(supervisor.created_at).toLocaleString()}\n`
        if (supervisor.last_login_at) {
          supContent += `- Last Login: ${new Date(supervisor.last_login_at).toLocaleString()}\n`
        }
        supContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "04_supervisors.txt", content: supContent })
    }

    // 5. Export Leaderboard
    if (evaluations && classrooms) {
      // Transform evaluations to match Evaluation type
      const transformedEvaluations = evaluations.map((e: any) => ({
        id: e.id,
        classroom_id: e.classroom_id,
        supervisor_id: e.supervisor_id,
        evaluation_date: e.evaluation_date,
        items: e.items,
        total_score: e.total_score,
        max_score: e.max_score,
        notes: e.notes,
        created_at: e.created_at,
        classroom: e.classrooms ? {
          id: e.classroom_id,
          name: e.classrooms.name,
          grade: e.classrooms.grade,
          division: e.classrooms.division,
        } : undefined,
      }))

      const leaderboard = calculateLeaderboard(transformedEvaluations as any, classrooms as any)
      
      let leaderContent = "LEADERBOARD\n"
      leaderContent += "=".repeat(80) + "\n\n"
      leaderContent += `Total Classrooms: ${leaderboard.length}\n`
      leaderContent += `Export Date: ${new Date().toISOString()}\n\n`
      leaderContent += "Rank | Classroom | Grade | Division | Total Score | Avg Score | Evaluations\n"
      leaderContent += "-".repeat(80) + "\n"

      leaderboard.forEach((entry, index) => {
        const rank = index + 1
        leaderContent += `${rank.toString().padStart(4)} | ${entry.classroom.name.padEnd(20)} | ${entry.classroom.grade.padEnd(5)} | ${(entry.classroom.division || "N/A").padEnd(15)} | ${entry.totalScore.toString().padStart(11)} | ${entry.averageScore.toString().padStart(9)} | ${entry.evaluationCount.toString().padStart(12)}\n`
      })

      // Group by division
      const divisions = ['Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute']
      divisions.forEach(division => {
        const divLeaderboard = leaderboard.filter(l => l.classroom.division === division)
        if (divLeaderboard.length > 0) {
          leaderContent += `\n\n${division.toUpperCase()} DIVISION LEADERBOARD\n`
          leaderContent += "=".repeat(80) + "\n"
          divLeaderboard.forEach((entry, index) => {
            const rank = index + 1
            leaderContent += `${rank.toString().padStart(4)} | ${entry.classroom.name.padEnd(20)} | ${entry.classroom.grade.padEnd(5)} | ${entry.totalScore.toString().padStart(11)} | ${entry.averageScore.toString().padStart(9)} | ${entry.evaluationCount.toString().padStart(12)}\n`
          })
        }
      })

      exportFiles.push({ filename: "05_leaderboard.txt", content: leaderContent })
    }

    // 6. Export Monthly Winners
    const { data: winners, error: winnersError } = await supabase
      .from("monthly_winners")
      .select(`
        *,
        classrooms:classroom_id (name, grade, division),
        declared_by_user:declared_by (name, email)
      `)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("division", { ascending: true })

    if (!winnersError && winners) {
      let winnersContent = "MONTHLY WINNERS\n"
      winnersContent += "=".repeat(80) + "\n\n"
      winnersContent += `Total Winners Declared: ${winners.length}\n`
      winnersContent += `Export Date: ${new Date().toISOString()}\n\n`

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      
      winners.forEach((winner, index) => {
        winnersContent += `\n[Winner ${index + 1}]\n`
        winnersContent += `- Month: ${months[winner.month - 1]} ${winner.year}\n`
        winnersContent += `- Division: ${winner.division}\n`
        winnersContent += `- Classroom: ${winner.classrooms?.name || "Unknown"} (Grade ${winner.classrooms?.grade || "N/A"})\n`
        winnersContent += `- Total Score: ${winner.total_score}\n`
        winnersContent += `- Average Score: ${winner.average_score.toFixed(2)}\n`
        winnersContent += `- Evaluation Count: ${winner.evaluation_count}\n`
        winnersContent += `- Declared By: ${winner.declared_by_user?.name || "Unknown"} (${winner.declared_by_user?.email || "N/A"})\n`
        winnersContent += `- Declared At: ${new Date(winner.declared_at).toLocaleString()}\n`
        if (winner.notes) {
          winnersContent += `- Notes: ${winner.notes}\n`
        }
        winnersContent += "-".repeat(80) + "\n"
      })

      exportFiles.push({ filename: "06_monthly_winners.txt", content: winnersContent })
    }

    // 7. Export Summary Statistics
    let summaryContent = "DATA EXPORT SUMMARY\n"
    summaryContent += "=".repeat(80) + "\n\n"
    summaryContent += `Export Date: ${new Date().toISOString()}\n`
    summaryContent += `Exported By: Admin\n\n`
    summaryContent += "STATISTICS:\n"
    summaryContent += `- Active Evaluations: ${evaluations?.length || 0}\n`
    summaryContent += `- Archived Evaluations: ${archivedEvals?.length || 0}\n`
    summaryContent += `- Total Classrooms: ${classrooms?.length || 0}\n`
    summaryContent += `- Active Supervisors: ${supervisors?.length || 0}\n`
    summaryContent += `- Monthly Winners: ${winners?.length || 0}\n\n`
    
    if (evaluations && evaluations.length > 0) {
      const totalScore = evaluations.reduce((sum, e) => sum + e.total_score, 0)
      const avgScore = Math.round(totalScore / evaluations.length)
      summaryContent += `- Average Evaluation Score: ${avgScore}\n`
      summaryContent += `- Total Points Awarded: ${totalScore}\n`
    }

    exportFiles.push({ filename: "00_summary.txt", content: summaryContent })

    // Create ZIP file content
    // Note: We'll return the files and let the client-side create the ZIP
    return { success: true, files: exportFiles }
  } catch (dbError: any) {
    console.error("[exportAllDataAsZip] Error:", dbError)
    return { success: false, error: `Failed to export data: ${dbError.message || "Unknown error"}` }
  }
}

