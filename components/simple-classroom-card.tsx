"use client"

import type { ClassroomScore } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { TrophyIcon, StarIcon, LeafIcon } from "@/components/icons"
import { getScoreColor, getScoreRange } from "@/lib/utils-leaderboard"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "group transition-all duration-300 hover:shadow-xl border-2",
        "border-l-4 hover:border-l-primary",
        isChampion && "border-l-yellow-400 bg-gradient-to-r from-yellow-50/30 to-transparent dark:from-yellow-950/20 shadow-yellow-100 dark:shadow-yellow-950/20",
        isRunnerUp && "border-l-gray-400 bg-gradient-to-r from-gray-50/30 to-transparent dark:from-gray-950/20",
        isThirdPlace && "border-l-orange-400 bg-gradient-to-r from-orange-50/30 to-transparent dark:from-orange-950/20",
        "hover:bg-muted/30"
      )}>
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Clean Rank Badge */}
            <div className="flex-shrink-0">
              <motion.div
                className={cn(
                  "w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold shadow-md",
                  isChampion ? "bg-gradient-to-br from-yellow-200 to-yellow-400 text-yellow-900 dark:from-yellow-600 dark:to-yellow-800 dark:text-yellow-100" :
                    isRunnerUp ? "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 dark:from-gray-600 dark:to-gray-800 dark:text-gray-100" :
                      isThirdPlace ? "bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900 dark:from-orange-600 dark:to-orange-800 dark:text-orange-100" :
                        "bg-muted text-muted-foreground"
                )}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {isTopThree && rank === 1 ? "👑" : isTopThree && rank === 2 ? "🥈" : isTopThree && rank === 3 ? "🥉" : rank}
              </motion.div>
            </div>

            {/* Classroom Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1 truncate">
                {classroom.classroom.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                Grade {classroom.classroom.grade}
              </p>

              {/* Bottom Info Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <LeafIcon className="h-3 w-3" />
                  <span>{classroom.evaluationCount} eval{classroom.evaluationCount !== 1 ? "s" : ""}</span>
                </div>
                <span className={cn(
                  "px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium",
                  scoreRange.color
                )}>
                  {scoreRange.label}
                </span>
              </div>
            </div>

            {/* Clean Score Display */}
            <div className="flex-shrink-0 text-right">
              <motion.div
                className="flex items-center gap-1.5 sm:gap-2"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg",
                    scoreColor.includes("yellow") ? "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40" :
                      scoreColor.includes("green") ? "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40" :
                        scoreColor.includes("blue") ? "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40" :
                          "bg-gray-100 dark:bg-gray-800"
                  )}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <StarIcon className={cn("h-3 w-3 sm:h-5 sm:w-5", scoreColor)} />
                </motion.div>
                <div>
                  <motion.span
                    className={cn("text-lg sm:text-2xl font-bold", scoreColor)}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    {classroom.totalScore}
                  </motion.span>
                  <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Total Points</div>
                </div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
