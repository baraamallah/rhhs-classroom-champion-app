import type { ClassroomScore } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { TrophyIcon, StarIcon, LeafIcon } from "@/components/icons"
import { getRankBadge, getScoreColor, getScoreRange } from "@/lib/utils-leaderboard"
import { cn } from "@/lib/utils"

interface LeaderboardCardProps {
  score: ClassroomScore
  rank: number
}

export function LeaderboardCard({ score, rank }: LeaderboardCardProps) {
  const badge = getRankBadge(rank)
  const scoreColor = getScoreColor(score.averageScore)
  const scoreRange = getScoreRange(score.averageScore)
  const isTopThree = rank <= 3

  return (
    <Card className={cn(
      "transition-all hover:shadow-lg relative overflow-hidden",
      isTopThree && "border-primary/50 bg-primary/5",
      isTopThree && "shadow-lg shadow-primary/10"
    )}>
      {/* Visual Score Indicator */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        scoreColor.includes("yellow") ? "bg-yellow-500 dark:bg-yellow-400" :
          scoreColor.includes("green") ? "bg-green-500 dark:bg-green-400" :
            scoreColor.includes("blue") ? "bg-blue-500 dark:bg-blue-400" :
              "bg-gray-500 dark:bg-gray-400"
      )} />

      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          {/* Rank and Trophy */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              {rank === 1 && <TrophyIcon className="h-7 w-7 text-yellow-600 dark:text-yellow-500 mb-1" />}
              {rank === 2 && <TrophyIcon className="h-6 w-6 text-gray-500 dark:text-gray-300 mb-1" />}
              {rank === 3 && <TrophyIcon className="h-6 w-6 text-amber-600 dark:text-amber-500 mb-1" />}
              <span className={cn("text-3xl font-bold", badge.color)}>{rank}</span>
            </div>

            {/* Classroom Info */}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground mb-1">{score.classroom.name}</h3>
              <p className="text-sm text-muted-foreground">
                {score.classroom.teacher} • {score.classroom.grade}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <LeafIcon className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {score.evaluationCount} evaluation{score.evaluationCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Score Display */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 mb-1">
              <StarIcon className={cn("h-5 w-5", scoreColor)} />
              <span className={cn("text-2xl font-bold", scoreColor)}>{score.totalScore}</span>
            </div>
            <span className="text-xs text-muted-foreground mb-1">Total Points</span>

            {/* Score Range Badge */}
            <span className={cn(
              "text-xs px-2 py-1 rounded-full border",
              scoreRange.color
            )}>
              {scoreRange.label}
            </span>

            {isTopThree && (
              <span className={cn("text-xs font-medium mt-1", badge.color)}>
                {badge.label}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
