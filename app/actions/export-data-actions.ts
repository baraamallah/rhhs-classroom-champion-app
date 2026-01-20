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

interface ExcelSheet {
  name: string
  headers: string[]
  rows: (string | number)[][]
  stats?: { label: string; value: string | number }[]
}

// Export data as Excel-compatible CSV files with statistics
export async function exportDataAsExcel() {
  const { currentUser, error } = await requireAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createAdminClient()
  const sheets: ExcelSheet[] = []

  try {
    const DIVISIONS = ['Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute']
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    // 1. Fetch all data
    const { data: evaluations } = await supabase
      .from("evaluations")
      .select(`*, classrooms:classroom_id (name, grade, division), users:supervisor_id (name, email)`)
      .order("evaluation_date", { ascending: false })

    const { data: archivedEvals } = await supabase
      .from("archive_evaluations")
      .select("*")
      .order("archived_at", { ascending: false })

    const { data: classrooms } = await supabase
      .from("classrooms")
      .select("*")
      .order("name", { ascending: true })

    const { data: supervisors } = await supabase
      .from("users")
      .select("*")
      .eq("role", "supervisor")
      .eq("is_active", true)
      .order("name", { ascending: true })

    const { data: winners } = await supabase
      .from("monthly_winners")
      .select(`*, classrooms:classroom_id (name, grade, division), declared_by_user:declared_by (name, email)`)
      .order("year", { ascending: false })
      .order("month", { ascending: false })

    // 2. Summary Dashboard Sheet
    const totalEvaluations = (evaluations?.length || 0) + (archivedEvals?.length || 0)
    const avgScore = evaluations && evaluations.length > 0 
      ? Math.round(evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length)
      : 0
    const totalPoints = evaluations?.reduce((sum, e) => sum + e.total_score, 0) || 0
    
    // Calculate division stats
    const divisionStats = DIVISIONS.map(division => {
      const divEvals = evaluations?.filter(e => e.classrooms?.division === division) || []
      const divClassrooms = classrooms?.filter(c => c.division === division) || []
      const divWinners = winners?.filter(w => w.division === division) || []
      return {
        division,
        classrooms: divClassrooms.length,
        evaluations: divEvals.length,
        totalPoints: divEvals.reduce((sum, e) => sum + e.total_score, 0),
        avgScore: divEvals.length > 0 ? Math.round(divEvals.reduce((sum, e) => sum + e.total_score, 0) / divEvals.length) : 0,
        winners: divWinners.length
      }
    })

    sheets.push({
      name: "Summary Dashboard",
      headers: ["Metric", "Value", "Description"],
      rows: [
        ["Export Date", new Date().toLocaleDateString(), "Date this report was generated"],
        ["Export Time", new Date().toLocaleTimeString(), "Time this report was generated"],
        ["", "", ""],
        ["=== OVERVIEW ===", "", ""],
        ["Total Classrooms", classrooms?.length || 0, "Number of registered classrooms"],
        ["Active Supervisors", supervisors?.length || 0, "Number of active supervisors"],
        ["Total Evaluations", totalEvaluations, "Active + Archived evaluations"],
        ["Active Evaluations", evaluations?.length || 0, "Current active evaluations"],
        ["Archived Evaluations", archivedEvals?.length || 0, "Evaluations moved to archive"],
        ["Monthly Winners Declared", winners?.length || 0, "Total winners declared"],
        ["", "", ""],
        ["=== PERFORMANCE ===", "", ""],
        ["Average Score", avgScore, "Average score across all evaluations"],
        ["Total Points Awarded", totalPoints, "Sum of all evaluation scores"],
        ["Highest Single Score", evaluations && evaluations.length > 0 ? Math.max(...evaluations.map(e => e.total_score)) : 0, "Highest score in a single evaluation"],
        ["Lowest Single Score", evaluations && evaluations.length > 0 ? Math.min(...evaluations.map(e => e.total_score)) : 0, "Lowest score in a single evaluation"],
      ],
      stats: [
        { label: "Report Generated", value: new Date().toISOString() },
        { label: "Generated By", value: "Admin Export" }
      ]
    })

    // 3. Division Statistics Sheet
    sheets.push({
      name: "Division Statistics",
      headers: ["Division", "Classrooms", "Evaluations", "Total Points", "Avg Score", "Winners Declared", "Performance Rating"],
      rows: divisionStats.map(d => [
        d.division,
        d.classrooms,
        d.evaluations,
        d.totalPoints,
        d.avgScore,
        d.winners,
        d.avgScore >= 90 ? "Excellent" : d.avgScore >= 75 ? "Good" : d.avgScore >= 60 ? "Fair" : "Needs Improvement"
      ]),
      stats: [
        { label: "Total Divisions", value: DIVISIONS.length },
        { label: "Best Performing", value: divisionStats.sort((a, b) => b.avgScore - a.avgScore)[0]?.division || "N/A" }
      ]
    })

    // 4. Active Evaluations Sheet
    if (evaluations && evaluations.length > 0) {
      sheets.push({
        name: "Active Evaluations",
        headers: ["ID", "Date", "Classroom", "Grade", "Division", "Supervisor", "Score", "Max Score", "Percentage", "Notes"],
        rows: evaluations.map(e => [
          e.id,
          new Date(e.evaluation_date).toLocaleDateString(),
          e.classrooms?.name || "Unknown",
          e.classrooms?.grade || "N/A",
          e.classrooms?.division || "N/A",
          e.users?.name || "Unknown",
          e.total_score,
          e.max_score,
          `${Math.round((e.total_score / e.max_score) * 100)}%`,
          e.notes || ""
        ]),
        stats: [
          { label: "Total Evaluations", value: evaluations.length },
          { label: "Average Score", value: avgScore },
          { label: "Total Points", value: totalPoints }
        ]
      })
    }

    // 5. Monthly Breakdown Sheet
    const monthlyData: { [key: string]: { count: number; total: number; avg: number } } = {}
    evaluations?.forEach(e => {
      const date = new Date(e.evaluation_date)
      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
      if (!monthlyData[key]) monthlyData[key] = { count: 0, total: 0, avg: 0 }
      monthlyData[key].count++
      monthlyData[key].total += e.total_score
    })
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].avg = Math.round(monthlyData[key].total / monthlyData[key].count)
    })

    sheets.push({
      name: "Monthly Breakdown",
      headers: ["Month", "Evaluations Count", "Total Points", "Average Score", "Trend"],
      rows: Object.entries(monthlyData)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([month, data], index, arr) => {
          const prevAvg = index < arr.length - 1 ? arr[index + 1][1].avg : data.avg
          const trend = data.avg > prevAvg ? "↑ Up" : data.avg < prevAvg ? "↓ Down" : "→ Stable"
          return [month, data.count, data.total, data.avg, trend]
        }),
      stats: [
        { label: "Months with Data", value: Object.keys(monthlyData).length },
        { label: "Best Month", value: Object.entries(monthlyData).sort((a, b) => b[1].avg - a[1].avg)[0]?.[0] || "N/A" }
      ]
    })

    // 6. Classrooms Sheet with Rankings
    if (classrooms && classrooms.length > 0 && evaluations) {
      const classroomStats = classrooms.map(c => {
        const classEvals = evaluations.filter(e => e.classroom_id === c.id)
        const totalScore = classEvals.reduce((sum, e) => sum + e.total_score, 0)
        const avgScore = classEvals.length > 0 ? Math.round(totalScore / classEvals.length) : 0
        const winCount = winners?.filter(w => w.classroom_id === c.id).length || 0
        return {
          ...c,
          evalCount: classEvals.length,
          totalScore,
          avgScore,
          winCount
        }
      }).sort((a, b) => b.totalScore - a.totalScore)

      sheets.push({
        name: "Classroom Rankings",
        headers: ["Rank", "Classroom", "Grade", "Division", "Evaluations", "Total Score", "Avg Score", "Wins", "Status"],
        rows: classroomStats.map((c, index) => [
          index + 1,
          c.name,
          c.grade,
          c.division || "N/A",
          c.evalCount,
          c.totalScore,
          c.avgScore,
          c.winCount,
          c.is_active ? "Active" : "Inactive"
        ]),
        stats: [
          { label: "Total Classrooms", value: classrooms.length },
          { label: "Active Classrooms", value: classrooms.filter(c => c.is_active).length },
          { label: "Top Performer", value: classroomStats[0]?.name || "N/A" }
        ]
      })
    }

    // 7. Supervisors Performance Sheet
    if (supervisors && supervisors.length > 0 && evaluations) {
      const supervisorStats = supervisors.map(s => {
        const supEvals = evaluations.filter(e => e.supervisor_id === s.id)
        return {
          ...s,
          evalCount: supEvals.length,
          avgScore: supEvals.length > 0 ? Math.round(supEvals.reduce((sum, e) => sum + e.total_score, 0) / supEvals.length) : 0
        }
      }).sort((a, b) => b.evalCount - a.evalCount)

      sheets.push({
        name: "Supervisor Performance",
        headers: ["Name", "Email", "Evaluations Completed", "Avg Score Given", "Last Login", "Status"],
        rows: supervisorStats.map(s => [
          s.name,
          s.email,
          s.evalCount,
          s.avgScore,
          s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : "Never",
          "Active"
        ]),
        stats: [
          { label: "Total Supervisors", value: supervisors.length },
          { label: "Most Active", value: supervisorStats[0]?.name || "N/A" },
          { label: "Total Evaluations", value: supervisorStats.reduce((sum, s) => sum + s.evalCount, 0) }
        ]
      })
    }

    // 8. Monthly Winners Sheet
    if (winners && winners.length > 0) {
      sheets.push({
        name: "Monthly Winners",
        headers: ["Month", "Year", "Division", "Winner Classroom", "Grade", "Total Score", "Avg Score", "Evaluations", "Declared By", "Declared Date"],
        rows: winners.map(w => [
          MONTHS[w.month - 1],
          w.year,
          w.division,
          w.classrooms?.name || "Unknown",
          w.classrooms?.grade || "N/A",
          w.total_score,
          w.average_score.toFixed(2),
          w.evaluation_count,
          w.declared_by_user?.name || "Unknown",
          new Date(w.declared_at).toLocaleDateString()
        ]),
        stats: [
          { label: "Total Winners", value: winners.length },
          { label: "Divisions with Winners", value: new Set(winners.map(w => w.division)).size }
        ]
      })
    }

    // 9. Archived Evaluations Sheet
    if (archivedEvals && archivedEvals.length > 0) {
      sheets.push({
        name: "Archived Evaluations",
        headers: ["ID", "Original Date", "Archived Date", "Score", "Max Score", "Percentage"],
        rows: archivedEvals.map(e => [
          e.id,
          new Date(e.evaluation_date).toLocaleDateString(),
          e.archived_at ? new Date(e.archived_at).toLocaleDateString() : "N/A",
          e.total_score,
          e.max_score,
          `${Math.round((e.total_score / e.max_score) * 100)}%`
        ]),
        stats: [
          { label: "Total Archived", value: archivedEvals.length }
        ]
      })
    }

    return { success: true, sheets }
  } catch (dbError: any) {
    console.error("[exportDataAsExcel] Error:", dbError)
    return { success: false, error: `Failed to export data: ${dbError.message || "Unknown error"}` }
  }
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
