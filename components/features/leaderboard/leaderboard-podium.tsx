"use client"

import { m } from "framer-motion"
import type { ClassroomScore } from "@/lib/types"
import { FirstPlaceLogo, SecondPlaceLogo, ThirdPlaceLogo } from "@/components/common/podium-logos"
import { LeafIcon, TrophyIcon } from "@/components/common/icons"
import { AnimatedCounter } from "@/components/common/animated-counter"

interface LeaderboardPodiumProps {
  topThree: ClassroomScore[]
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  if (!topThree || topThree.length === 0) return null

  const first = topThree[0]
  const second = topThree[1]
  const third = topThree[2]

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 sm:mb-12 px-1 xs:px-2 sm:px-4">
      {/* Podium Columns Container with adequate top clearance so 1st place crown doesn't clip */}
      <div className="relative flex items-end justify-center gap-1.5 xs:gap-3 sm:gap-6 pt-8 sm:pt-12 pb-2 w-full">
        {/* ================= 2ND PLACE (SILVER / PLATINUM) ================= */}
        {second && (
          <m.div
            className="flex-1 min-w-0 max-w-[31%] xs:max-w-[32%] sm:max-w-44 md:max-w-52 flex flex-col items-center group"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12, type: "spring", stiffness: 140, damping: 18 }}
          >
            {/* 3D Silver Medallion */}
            <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
              <m.div
                animate={{ y: [0, -3.5, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              >
                <SecondPlaceLogo className="w-11 h-11 xs:w-14 xs:h-14 sm:w-18 sm:h-18 md:w-20 md:h-20" />
              </m.div>
            </div>

            {/* Classroom Info */}
            <div className="w-full text-center px-0.5 mb-1.5 sm:mb-2 min-w-0 flex flex-col items-center">
              <h4
                className="text-[11px] xs:text-xs sm:text-sm md:text-base font-bold text-foreground line-clamp-1 max-w-full group-hover:text-primary transition-colors leading-tight"
                title={second.classroom.name}
              >
                {second.classroom.name}
              </h4>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground font-medium truncate mt-0.5">
                Grade {second.classroom.grade}
              </p>
              <div className="mt-1 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 xs:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black text-[10px] xs:text-xs sm:text-sm shadow-2xs">
                <AnimatedCounter value={second.totalScore} />
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">pts</span>
              </div>
            </div>

            {/* Pedestal Block - Architectural Silver Finish */}
            <div className="w-full h-22 xs:h-26 sm:h-36 rounded-t-xl sm:rounded-t-2xl bg-linear-to-b from-slate-100 via-slate-50 to-card dark:from-slate-800 dark:via-slate-850 dark:to-card border-t-2 border-x border-slate-300 dark:border-slate-600 shadow-md group-hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-between p-1.5 sm:p-3 relative overflow-hidden">
              {/* Highlight Top Bevel */}
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-white dark:via-slate-400/40 to-transparent" />

              <span className="text-xl xs:text-2xl sm:text-4xl font-black text-slate-400 dark:text-slate-500 select-none">
                2
              </span>

              <div className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] xs:text-[9px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-700/80 px-1.5 xs:px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600">
                <LeafIcon className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{second.evaluationCount} eval{second.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </m.div>
        )}

        {/* ================= 1ST PLACE (GOLD GRAND CHAMPION) ================= */}
        {first && (
          <m.div
            className="flex-1 min-w-0 max-w-[37%] xs:max-w-[36%] sm:max-w-48 md:max-w-56 flex flex-col items-center group z-10"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.2, type: "spring", stiffness: 150, damping: 16 }}
          >
            {/* Golden Radiant Crown & Emblem */}
            <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
              {/* Glowing Aura Behind Champion Emblem */}
              <div className="absolute -inset-3 bg-amber-400/20 dark:bg-amber-400/15 rounded-full blur-xl animate-pulse pointer-events-none" />

              {/* Floating Sparkle Crown */}
              <m.div
                animate={{ y: [0, -4.5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-xl flex flex-col items-center"
              >
                {/* Floating Champion Crown Pill */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap border border-amber-300/80">
                    <TrophyIcon className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-slate-950 shrink-0" />
                    Champion
                  </span>
                </div>
                <FirstPlaceLogo className="w-13 h-13 xs:w-16 xs:h-16 sm:w-22 sm:h-22 md:w-24 md:h-24 pt-1 sm:pt-2" />
              </m.div>
            </div>

            {/* Classroom Info */}
            <div className="w-full text-center px-0.5 mb-1.5 sm:mb-2 min-w-0 flex flex-col items-center">
              <h4
                className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-foreground line-clamp-1 max-w-full group-hover:text-amber-500 transition-colors leading-tight"
                title={first.classroom.name}
              >
                {first.classroom.name}
              </h4>
              <p className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-muted-foreground truncate mt-0.5">
                Grade {first.classroom.grade}
              </p>
              <div className="mt-1 inline-flex items-center gap-0.5 sm:gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/70 border border-amber-400/80 dark:border-amber-500/60 text-amber-900 dark:text-amber-200 font-black text-xs xs:text-sm sm:text-base shadow-xs">
                <AnimatedCounter value={first.totalScore} />
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400">pts</span>
              </div>
            </div>

            {/* Pedestal Block (Tallest, Luminous Gold Finish) */}
            <div className="w-full h-28 xs:h-34 sm:h-48 rounded-t-xl sm:rounded-t-3xl bg-linear-to-b from-amber-100/90 via-amber-50/70 to-card dark:from-amber-950/60 dark:via-amber-900/40 dark:to-card border-t-2 border-x-2 border-amber-400 dark:border-amber-400/90 shadow-xl shadow-amber-500/15 group-hover:shadow-2xl group-hover:shadow-amber-500/25 transition-all duration-300 flex flex-col items-center justify-between p-1.5 sm:p-4 relative overflow-hidden">
              {/* Highlight Top Bevel with Golden Shimmer */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-transparent via-amber-300 dark:via-amber-400 to-transparent" />

              <span className="text-2xl xs:text-4xl sm:text-6xl font-black text-amber-500 dark:text-amber-400 select-none">
                1
              </span>

              <div className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] xs:text-[10px] sm:text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-400/70 dark:border-amber-500/50">
                <LeafIcon className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{first.evaluationCount} eval{first.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </m.div>
        )}

        {/* ================= 3RD PLACE (BRONZE) ================= */}
        {third && (
          <m.div
            className="flex-1 min-w-0 max-w-[31%] xs:max-w-[32%] sm:max-w-40 md:max-w-48 flex flex-col items-center group"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, type: "spring", stiffness: 140, damping: 18 }}
          >
            {/* 3D Bronze Shield */}
            <div className="relative mb-2 sm:mb-3 flex flex-col items-center">
              <m.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              >
                <ThirdPlaceLogo className="w-10 h-10 xs:w-13 xs:h-13 sm:w-16 sm:h-16 md:w-18 md:h-18" />
              </m.div>
            </div>

            {/* Classroom Info */}
            <div className="w-full text-center px-0.5 mb-1.5 sm:mb-2 min-w-0 flex flex-col items-center">
              <h4
                className="text-[11px] xs:text-xs sm:text-sm md:text-base font-bold text-foreground line-clamp-1 max-w-full group-hover:text-primary transition-colors leading-tight"
                title={third.classroom.name}
              >
                {third.classroom.name}
              </h4>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground font-medium truncate mt-0.5">
                Grade {third.classroom.grade}
              </p>
              <div className="mt-1 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 xs:px-2 py-0.5 rounded-full bg-orange-50/90 dark:bg-amber-950/70 border border-amber-600/40 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 font-black text-[10px] xs:text-xs sm:text-sm shadow-2xs">
                <AnimatedCounter value={third.totalScore} />
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">pts</span>
              </div>
            </div>

            {/* Pedestal Block - Architectural Bronze Finish */}
            <div className="w-full h-18 xs:h-22 sm:h-28 rounded-t-xl sm:rounded-t-2xl bg-linear-to-b from-amber-100/70 via-orange-50/60 to-card dark:from-stone-900/80 dark:via-amber-950/50 dark:to-card border-t-2 border-x border-amber-600/50 dark:border-amber-700/70 shadow-md group-hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-between p-1.5 sm:p-3 relative overflow-hidden">
              {/* Highlight Top Bevel */}
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-amber-300/40 dark:via-amber-500/30 to-transparent" />

              <span className="text-xl xs:text-2xl sm:text-4xl font-black text-amber-600/70 dark:text-amber-600/60 select-none">
                3
              </span>

              <div className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] xs:text-[9px] sm:text-xs font-semibold text-amber-950 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-1.5 xs:px-2 py-0.5 rounded-full border border-amber-600/40 dark:border-amber-700/50">
                <LeafIcon className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{third.evaluationCount} eval{third.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </m.div>
        )}
      </div>

      {/* Podium Stage Floor */}
      <div className="w-full h-2 sm:h-2.5 rounded-full bg-linear-to-r from-transparent via-border to-transparent -mt-px relative z-10" />
    </div>
  )
}
