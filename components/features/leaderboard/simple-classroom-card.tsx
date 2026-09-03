"use client"

import type { ClassroomScore } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { LeafIcon, TrophyIcon } from "@/components/common/icons"
import { FirstPlaceLogo, SecondPlaceLogo, ThirdPlaceLogo } from "@/components/common/podium-logos"
import { getScoreColor, getScoreRange } from "@/lib/utils-leaderboard"
import { cn } from "@/lib/utils"
import { m } from "framer-motion"

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

  return (
    <m.div
      whileHover={{ y: -3, scale: 1.008 }}
      whileTap={{ scale: 0.99 }}
      transition={{ 
        type: "spring", 
        stiffness: 350, 
        damping: 24
      }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300 border rounded-2xl cursor-pointer",
          isChampion
            ? "border-amber-400/80 dark:border-amber-500/70 bg-linear-to-r from-amber-500/10 via-yellow-500/5 to-card shadow-md shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20"
            : isRunnerUp
            ? "border-slate-300 dark:border-slate-600/80 bg-linear-to-r from-slate-200/40 via-transparent to-card dark:from-slate-800/30 shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-slate-500"
            : isThirdPlace
            ? "border-amber-600/40 dark:border-amber-700/60 bg-linear-to-r from-amber-700/10 via-transparent to-card dark:from-amber-950/30 shadow-xs hover:shadow-md hover:border-amber-600/60"
            : "border-border/70 bg-card/90 hover:border-primary/40 hover:bg-muted/30 shadow-2xs hover:shadow-sm"
        )}
      >
        {/* Subtle decorative glow for champion */}
        {isChampion && (
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        )}

        <CardContent className="p-3.5 sm:p-4.5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Rank Badge / New Custom Podium Logos for 1st, 2nd, 3rd */}
            <div className="shrink-0 flex items-center justify-center">
              {isChampion ? (
                <div className="relative group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                  <FirstPlaceLogo className="w-12 h-12 sm:w-15 sm:h-15" />
                </div>
              ) : isRunnerUp ? (
                <div className="relative group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                  <SecondPlaceLogo className="w-12 h-12 sm:w-15 sm:h-15" />
                </div>
              ) : isThirdPlace ? (
                <div className="relative group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                  <ThirdPlaceLogo className="w-12 h-12 sm:w-15 sm:h-15" />
                </div>
              ) : (
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black shadow-inner bg-muted/80 text-muted-foreground border border-border/60">
                  <span className="text-sm sm:text-base font-bold">#{rank}</span>
                </div>
              )}
            </div>

            {/* Classroom Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-base sm:text-lg font-bold text-foreground truncate tracking-tight">
                  {classroom.classroom.name}
                </h3>
                {isChampion && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                    <TrophyIcon className="h-3 w-3" />
                    Champion
                  </span>
                )}
                {isRunnerUp && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/20 shrink-0">
                    2nd Place
                  </span>
                )}
                {isThirdPlace && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-700/15 text-amber-700 dark:text-amber-400 border border-amber-700/20 shrink-0">
                    3rd Place
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">
                Grade {classroom.classroom.grade}
              </p>

              {/* Bottom Info Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
                <div className="inline-flex items-center gap-1 text-muted-foreground bg-muted/60 dark:bg-muted/30 px-2 py-0.5 rounded-md">
                  <LeafIcon className="h-3 w-3 text-primary" />
                  <span>{classroom.evaluationCount} eval{classroom.evaluationCount !== 1 ? "s" : ""}</span>
                </div>

                <span className={cn(
                  "px-2 py-0.5 rounded-md font-semibold text-[10px] sm:text-[11px]",
                  scoreRange.color
                )}>
                  {scoreRange.label}
                </span>

                <span className="text-muted-foreground/70 hidden md:inline">
                  Avg: <strong className="text-foreground">{Number(classroom.averageScore).toFixed(1)}</strong>
                </span>
              </div>
            </div>

            {/* Score Display */}
            <div className="shrink-0 text-right">
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "text-2xl sm:text-3xl font-black tracking-tight",
                    isChampion ? "text-amber-600 dark:text-amber-400" : scoreColor
                  )}>
                    {classroom.totalScore}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">pts</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                  Total Score
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
}

