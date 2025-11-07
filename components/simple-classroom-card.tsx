import type { ClassroomScore } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { TrophyIcon, StarIcon, LeafIcon } from "@/components/icons"
import { getScoreColor, getScoreRange } from "@/lib/utils-leaderboard"
import { cn } from "@/lib/utils"

interface SimpleClassroomCardProps {
  classroom: ClassroomScore
  rank: number
}

export function SimpleClassroomCard({ classroom, rank }: SimpleClassroomCardProps) {
  const scoreColor = getScoreColor(classroom.averageScore)
  const scoreRange = getScoreRange(classroom.averageScore)
  const isChampion = rank === 1
  const isRunnerUp = rank === 2
  const isThirdPlace = rank === 3
  const isTopThree = rank <= 3

  return (
    <Card className={cn(
      "group transition-all duration-300 hover:shadow-md",
      "border-l-4 hover:border-l-primary/50",
      isChampion && "border-l-yellow-400 bg-gradient-to-r from-yellow-50/20 to-transparent dark:from-yellow-950/10",
      isRunnerUp && "border-l-gray-400 bg-gradient-to-r from-gray-50/20 to-transparent dark:from-gray-950/10", 
      isThirdPlace && "border-l-orange-400 bg-gradient-to-r from-orange-50/20 to-transparent dark:from-orange-950/10",
      "hover:bg-muted/20"
    )}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          {/* Clean Rank Badge */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold",
              isChampion ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              isRunnerUp ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
              isThirdPlace ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
              "bg-muted text-muted-foreground"
            )}>
              {rank}
            </div>
          </div>

          {/* Classroom Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {classroom.classroom.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Grade {classroom.classroom.grade}
            </p>

            {/* Bottom Info Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <LeafIcon className="h-3 w-3" />
                <span>{classroom.evaluationCount} evaluation{classroom.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                scoreRange.color
              )}>
                {scoreRange.label}
              </span>
            </div>
          </div>

          {/* Clean Score Display */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                scoreColor.includes("yellow") ? "bg-yellow-100 dark:bg-yellow-900/30" :
                scoreColor.includes("green") ? "bg-green-100 dark:bg-green-900/30" :
                scoreColor.includes("blue") ? "bg-blue-100 dark:bg-blue-900/30" :
                "bg-gray-100 dark:bg-gray-800"
              )}>
                <StarIcon className={cn("h-5 w-5", scoreColor)} />
              </div>
              <div>
                <span className={cn("text-2xl font-bold", scoreColor)}>
                  {classroom.averageScore}
                </span>
                <div className="text-xs text-muted-foreground">Eco-Score</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
