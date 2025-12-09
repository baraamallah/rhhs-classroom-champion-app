import type { ClassroomScore, Evaluation, Classroom } from "./types"

export function calculateLeaderboard(
  evaluations: Evaluation[],
  allClassrooms?: Classroom[]
): ClassroomScore[] {
  const scoreMap = new Map<
    string,
    {
      classroom: { id: string; name: string; grade: string; division?: string }
      total: number
      count: number
      lastDate: string
    }
  >()

  // If allClassrooms is provided, initialize all classrooms with 0 evaluations
  if (allClassrooms) {
    allClassrooms.forEach((classroom) => {
      scoreMap.set(classroom.id, {
        classroom: {
          id: classroom.id,
          name: classroom.name,
          grade: classroom.grade,
          division: classroom.division,
        },
        total: 0,
        count: 0,
        lastDate: "Never",
      })
    })
  }

  // Calculate totals for each classroom
  evaluations.forEach((evaluation) => {
    if (!evaluation.classroom) return

    const existing = scoreMap.get(evaluation.classroom_id) || {
      classroom: {
        id: evaluation.classroom_id,
        name: evaluation.classroom.name,
        grade: evaluation.classroom.grade,
        division: evaluation.classroom.division,
      },
      total: 0,
      count: 0,
      lastDate: evaluation.evaluation_date,
    }

    scoreMap.set(evaluation.classroom_id, {
      classroom: {
        id: evaluation.classroom_id,
        name: evaluation.classroom.name,
        grade: evaluation.classroom.grade,
        division: evaluation.classroom.division,
      },
      total: existing.total + evaluation.total_score,
      count: existing.count + 1,
      lastDate:
        existing.lastDate === "Never" || new Date(evaluation.evaluation_date) > new Date(existing.lastDate)
          ? evaluation.evaluation_date
          : existing.lastDate,
    })
  })

  // Create classroom scores
  const scores: ClassroomScore[] = Array.from(scoreMap.values()).map((stats) => ({
    classroom: stats.classroom,
    totalScore: stats.total,
    evaluationCount: stats.count,
    averageScore: stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
    lastEvaluated: stats.lastDate,
  }))

  // Sort by total score (descending), then by average score
  return scores.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    return b.averageScore - a.averageScore
  })
}

export function getRankBadge(rank: number): { label: string; color: string } {
  if (rank === 1) return { label: "Champion", color: "text-yellow-600" }
  if (rank === 2) return { label: "Runner-up", color: "text-gray-400" }
  if (rank === 3) return { label: "Third Place", color: "text-amber-700" }
  return { label: `#${rank}`, color: "text-muted-foreground" }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-yellow-600 dark:text-yellow-400"
  if (score >= 75) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-blue-600 dark:text-blue-400"
  return "text-gray-600 dark:text-gray-400"
}

export function getScoreRange(score: number): { label: string; color: string } {
  if (score >= 90) return {
    label: "Excellent",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20"
  }
  if (score >= 75) return {
    label: "Good",
    color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20"
  }
  if (score >= 60) return {
    label: "Fair",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20"
  }
  return {
    label: "Needs Improvement",
    color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-400/10 dark:text-gray-400 dark:border-gray-400/20"
  }
}

// Statistics calculation functions for homepage insights
export function calculateProgramStats(evaluations: Evaluation[]): {
  totalClassrooms: number
  totalEvaluations: number
  averageScore: number
  mostImprovedClassroom: ClassroomScore | null
  topGradeLevel: string | null
  recentActivityCount: number
} {
  const leaderboard = calculateLeaderboard(evaluations)

  // Calculate total classrooms
  const totalClassrooms = leaderboard.length

  // Calculate total evaluations
  const totalEvaluations = evaluations.length

  // Calculate average score across all evaluations
  const averageScore = totalEvaluations > 0
    ? Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.total_score, 0) / totalEvaluations)
    : 0

  // Find most improved classroom (simplified - could be enhanced with historical data)
  const mostImprovedClassroom = leaderboard.length > 0 ? leaderboard[0] : null

  // Find top performing grade level
  const gradeStats = new Map<string, { total: number; count: number }>()
  leaderboard.forEach(score => {
    const grade = score.classroom.grade
    const existing = gradeStats.get(grade) || { total: 0, count: 0 }
    gradeStats.set(grade, {
      total: existing.total + score.averageScore,
      count: existing.count + 1
    })
  })

  let topGradeLevel: string | null = null
  let highestGradeAverage = 0
  gradeStats.forEach((stats, grade) => {
    const average = stats.total / stats.count
    if (average > highestGradeAverage) {
      highestGradeAverage = average
      topGradeLevel = grade
    }
  })

  // Count recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentActivityCount = evaluations.filter(evaluation =>
    new Date(evaluation.evaluation_date) >= sevenDaysAgo
  ).length

  return {
    totalClassrooms,
    totalEvaluations,
    averageScore,
    mostImprovedClassroom,
    topGradeLevel,
    recentActivityCount
  }
}

export function getRecentEvaluations(evaluations: Evaluation[], limit: number = 5): Evaluation[] {
  return evaluations
    .sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())
    .slice(0, limit)
}

export function getGradeLevelStats(leaderboard: ClassroomScore[]): Array<{
  grade: string
  averageScore: number
  classroomCount: number
}> {
  const gradeMap = new Map<string, { total: number; count: number }>()

  leaderboard.forEach(score => {
    const grade = score.classroom.grade
    const existing = gradeMap.get(grade) || { total: 0, count: 0 }
    gradeMap.set(grade, {
      total: existing.total + score.averageScore,
      count: existing.count + 1
    })
  })

  return Array.from(gradeMap.entries())
    .map(([grade, stats]) => ({
      grade,
      averageScore: Math.round(stats.total / stats.count),
      classroomCount: stats.count
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
}
