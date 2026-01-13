"use client"

import type { ClassroomScore } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { TrophyIcon, StarIcon, LeafIcon, CrownIcon, MedalIcon } from "@/components/icons"
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
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        hover: { duration: 0.2 }
      }}
    >
      <Card className={cn(
        "group transition-all duration-300 hover:shadow-2xl border-2 cursor-pointer",
        "border-l-4 hover:border-l-primary",
        isChampion && "border-l-yellow-400 bg-gradient-to-r from-yellow-50/40 to-transparent dark:from-yellow-950/30 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-950/30",
        isRunnerUp && "border-l-gray-400 bg-gradient-to-r from-gray-50/40 to-transparent dark:from-gray-950/30 shadow-lg shadow-gray-200/50 dark:shadow-gray-950/30",
        isThirdPlace && "border-l-orange-400 bg-gradient-to-r from-orange-50/40 to-transparent dark:from-orange-950/30 shadow-lg shadow-orange-200/50 dark:shadow-orange-950/30",
        "hover:bg-muted/40 hover:border-primary/50"
      )}>
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Clean Rank Badge */}
            <div className="flex-shrink-0">
              <motion.div
                className={cn(
                  "w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-base sm:text-xl font-bold shadow-lg",
                  isChampion ? "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 dark:from-yellow-600 dark:via-yellow-700 dark:to-yellow-800 dark:text-yellow-100 ring-2 ring-yellow-300/50" :
                    isRunnerUp ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-900 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 dark:text-gray-100 ring-2 ring-gray-300/50" :
                      isThirdPlace ? "bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 text-orange-900 dark:from-orange-600 dark:via-orange-700 dark:to-orange-800 dark:text-orange-100 ring-2 ring-orange-300/50" :
                        "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
                )}
                animate={isTopThree ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: isTopThree ? Infinity : 0,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
              >
                {isTopThree && rank === 1 ? (
                  <CrownIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
                ) : isTopThree && rank === 2 ? (
                  <MedalIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-300" />
                ) : isTopThree && rank === 3 ? (
                  <MedalIcon className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 dark:text-orange-400" />
                ) : (
                  <span className="text-base sm:text-xl">{rank}</span>
                )}
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
                className="flex items-center gap-2 sm:gap-3"
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <motion.div
                  className={cn(
                    "w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl ring-2 ring-primary/20",
                    scoreColor.includes("yellow") ? "bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 dark:from-yellow-800/60 dark:via-yellow-700/60 dark:to-yellow-600/60" :
                      scoreColor.includes("green") ? "bg-gradient-to-br from-green-200 via-green-300 to-green-400 dark:from-green-800/60 dark:via-green-700/60 dark:to-green-600/60" :
                        scoreColor.includes("blue") ? "bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 dark:from-blue-800/60 dark:via-blue-700/60 dark:to-blue-600/60" :
                          "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700"
                  )}
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    repeatDelay: 0.5
                  }}
                >
                  <StarIcon className={cn("h-4 w-4 sm:h-6 sm:w-6", scoreColor)} />
                </motion.div>
                <div>
                  <motion.span
                    className={cn("text-xl sm:text-3xl font-extrabold", scoreColor)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: 1
                    }}
                    transition={{ 
                      duration: 0.6,
                      scale: { duration: 1.5, repeat: Infinity, repeatDelay: 1 }
                    }}
                  >
                    {classroom.totalScore}
                  </motion.span>
                  <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block font-medium">Total Points</div>
                </div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
