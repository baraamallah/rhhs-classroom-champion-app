"use client"

import Image from "next/image"

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      <div className="relative flex items-center justify-center">
        {/* Soft pulsing halo */}
        <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20 border-t-emerald-500/80 animate-spin animation-duration-[4s] pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-teal-500/25 border-b-teal-500/70 animate-spin animation-duration-[2.5s] direction-[reverse] pointer-events-none" />

        {/* Brand Icon Card */}
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-border/80 shadow-xl shadow-emerald-500/10 p-3 flex items-center justify-center ring-1 ring-emerald-500/20">
          <Image
            src="/Eco Champ.png"
            alt="Eco Champ"
            width={64}
            height={64}
            className="w-full h-full object-contain animate-pulse animation-duration-[2s]"
            priority
          />
        </div>
      </div>

      <div className="mt-6 text-center space-y-1.5 relative z-10">
        <h3 className="text-base font-bold text-foreground">
          Loading Classroom Inspection...
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Preparing daily rubrics and verification checklist
        </p>
      </div>

      {/* Shimmering Indeterminate Progress Indicator */}
      <div className="mt-6 w-44 h-1.5 bg-muted/70 dark:bg-muted/40 rounded-full overflow-hidden p-px border border-border/50 relative shadow-inner">
        <div className="h-full w-1/3 bg-linear-to-r from-emerald-500/10 via-emerald-500 to-emerald-500/10 rounded-full animate-indeterminate-slide" />
      </div>
    </div>
  )
}
