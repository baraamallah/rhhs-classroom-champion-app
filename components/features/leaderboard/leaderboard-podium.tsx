"use client"

import { m } from "framer-motion"
import type { ClassroomScore } from "@/lib/types"
import { FirstPlaceLogo, SecondPlaceLogo, ThirdPlaceLogo } from "@/components/common/podium-logos"
import { LeafIcon, TrophyIcon } from "@/components/common/icons"
import { AnimatedCounter } from "@/components/common/animated-counter"
import { Sparkles } from "lucide-react"

interface LeaderboardPodiumProps {
  topThree: ClassroomScore[]
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  if (!topThree || topThree.length === 0) return null

  const first = topThree[0]
  const second = topThree[1]
  const third = topThree[2]

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 px-2 sm:px-4">
      {/* Stage Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold tracking-wider uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
          <span>Division Champions Podium</span>
        </div>
      </div>

      {/* Podium Columns Container */}
      <div className="relative flex items-end justify-center gap-2 xs:gap-3 sm:gap-6 pt-10 pb-2">
        {/* ================= 2ND PLACE (SILVER) ================= */}
        {second && (
          <m.div
            className="flex-1 max-w-52.5 flex flex-col items-center group"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, type: "spring", stiffness: 140, damping: 18 }}
          >
            {/* 3D Badge + Floating Float */}
            <div className="relative mb-3 flex flex-col items-center">
              <m.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              >
                <SecondPlaceLogo className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20" />
              </m.div>
            </div>

            {/* Classroom Info Pill */}
            <div className="w-full text-center px-1 mb-2">
              <h4 className="text-xs xs:text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors" title={second.classroom.name}>
                {second.classroom.name}
              </h4>
              <p className="text-[10px] xs:text-xs text-muted-foreground truncate">
                Grade {second.classroom.grade}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs xs:text-sm sm:text-base shadow-2xs">
                <AnimatedCounter value={second.totalScore} />
                <span className="text-[9px] xs:text-[10px] font-semibold uppercase text-muted-foreground">pts</span>
              </div>
            </div>

            {/* Pedestal Block */}
            <div className="w-full h-24 xs:h-28 sm:h-36 rounded-t-2xl sm:rounded-t-3xl bg-linear-to-b from-slate-200 via-slate-300 to-slate-400 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border-t-2 border-x border-slate-300 dark:border-slate-600/80 shadow-md group-hover:shadow-lg group-hover:from-slate-100 dark:group-hover:from-slate-600 transition-all duration-300 flex flex-col items-center justify-between p-2 sm:p-3 relative overflow-hidden">
              {/* Highlight Top Bevel */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/40 dark:bg-white/10" />

              <span className="text-xl xs:text-2xl sm:text-4xl font-black text-slate-500/50 dark:text-slate-400/40">
                2
              </span>

              <div className="inline-flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                <LeafIcon className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-slate-600 dark:text-slate-400" />
                <span>{second.evaluationCount} eval{second.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </m.div>
        )}

        {/* ================= 1ST PLACE (GOLD GRAND CHAMPION) ================= */}
        {first && (
          <m.div
            className="flex-1 max-w-60 flex flex-col items-center group z-10"
            initial={{ opacity: 0, y: 50, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, type: "spring", stiffness: 150, damping: 16 }}
          >
            {/* Golden Radiant Crown & Badge */}
            <div className="relative mb-3 flex flex-col items-center">
              {/* Glowing Aura Behind Champion Badge */}
              <div className="absolute -inset-3 bg-amber-400/25 dark:bg-amber-400/20 rounded-full blur-xl animate-pulse" />

              {/* Floating Sparkle Crown */}
              <m.div
                animate={{ y: [0, -6, 0], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-xl"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-yellow-400 text-black text-[9px] xs:text-[10px] font-black uppercase tracking-wider shadow-md">
                    <TrophyIcon className="w-2.5 h-2.5 text-black" />
                    Champion
                  </span>
                </div>
                <FirstPlaceLogo className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 pt-2" />
              </m.div>
            </div>

            {/* Classroom Info Pill */}
            <div className="w-full text-center px-1 mb-2">
              <h4 className="text-sm xs:text-base sm:text-lg font-black text-foreground truncate group-hover:text-amber-500 transition-colors" title={first.classroom.name}>
                {first.classroom.name}
              </h4>
              <p className="text-[10px] xs:text-xs font-medium text-muted-foreground truncate">
                Grade {first.classroom.grade}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-black text-sm xs:text-base sm:text-lg shadow-sm">
                <AnimatedCounter value={first.totalScore} />
                <span className="text-[10px] xs:text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">pts</span>
              </div>
            </div>

            {/* Pedestal Block (Tallest, Radiant Gold) */}
            <div className="w-full h-32 xs:h-38 sm:h-48 rounded-t-2xl sm:rounded-t-3xl bg-linear-to-b from-amber-400/40 via-yellow-500/30 to-amber-600/30 dark:from-amber-500/30 dark:via-yellow-600/20 dark:to-amber-950/40 border-t-2 border-x-2 border-amber-400 dark:border-amber-400/80 shadow-xl shadow-amber-500/20 group-hover:shadow-2xl group-hover:shadow-amber-500/30 transition-all duration-300 flex flex-col items-center justify-between p-2 sm:p-4 relative overflow-hidden">
              {/* Highlight Top Bevel with Golden Shimmer */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-transparent via-white/70 to-transparent" />

              <span className="text-3xl xs:text-4xl sm:text-6xl font-black bg-linear-to-b from-amber-500 to-yellow-600 bg-clip-text text-transparent opacity-75">
                1
              </span>

              <div className="inline-flex items-center gap-1 text-[10px] xs:text-[11px] sm:text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/20 dark:bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <LeafIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{first.evaluationCount} eval{first.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </m.div>
        )}

        {/* ================= 3RD PLACE (BRONZE) ================= */}
        {third && (
          <m.div
            className="flex-1 max-w-50 flex flex-col items-center group"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.05, type: "spring", stiffness: 140, damping: 18 }}
          >
            {/* 3D Badge + Floating Float */}
            <div className="relative mb-3 flex flex-col items-center">
              <m.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              >
                <ThirdPlaceLogo className="w-13 h-13 xs:w-15 xs:h-15 sm:w-18 sm:h-18" />
              </m.div>
            </div>

            {/* Classroom Info Pill */}
            <div className="w-full text-center px-1 mb-2">
              <h4 className="text-xs xs:text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors" title={third.classroom.name}>
                {third.classroom.name}
              </h4>
              <p className="text-[10px] xs:text-xs text-muted-foreground truncate">
                Grade {third.classroom.grade}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-800/15 dark:bg-amber-950/40 border border-amber-700/30 text-amber-800 dark:text-amber-400 font-black text-xs xs:text-sm sm:text-base shadow-2xs">
                <AnimatedCounter value={third.totalScore} />
                <span className="text-[9px] xs:text-[10px] font-semibold uppercase text-muted-foreground">pts</span>
              </div>
            </div>

            {/* Pedestal Block */}
            <div className="w-full h-20 xs:h-24 sm:h-28 rounded-t-2xl sm:rounded-t-3xl bg-linear-to-b from-amber-700/30 via-amber-800/25 to-amber-900/40 dark:from-amber-900/30 dark:via-amber-950/40 dark:to-black/40 border-t-2 border-x border-amber-700/50 dark:border-amber-800/60 shadow-md group-hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-between p-2 sm:p-3 relative overflow-hidden">
              {/* Highlight Top Bevel */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/30 dark:bg-white/5" />

              <span className="text-xl xs:text-2xl sm:text-4xl font-black text-amber-700/50 dark:text-amber-600/40">
                3
              </span>

              <div className="inline-flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs font-semibold text-amber-800 dark:text-amber-400">
                <LeafIcon className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{third.evaluationCount} eval{third.evaluationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </m.div>
        )}
      </div>

      {/* Podium Stage Floor */}
      <div className="w-full h-3 rounded-full bg-linear-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
