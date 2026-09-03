"use client"

import Image from "next/image"

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 select-none">
      <div className="relative flex items-center justify-center">
        {/* Soft pulsing halo */}
        <div className="absolute w-28 h-28 rounded-full bg-primary/20 animate-ping opacity-60 pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full bg-emerald-500/15 blur-xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-card border border-border shadow-xl p-3 flex items-center justify-center">
          <Image
            src="/Eco Champ.png"
            alt="Eco Champ"
            width={64}
            height={64}
            className="w-full h-full object-contain animate-pulse"
            priority
          />
        </div>
      </div>

      <div className="mt-6 text-center space-y-1.5">
        <h3 className="text-base font-bold text-foreground">
          Loading Classroom Inspection...
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Preparing daily rubrics and verification checklist
        </p>
      </div>

      {/* Shimmering Progress Indicator */}
      <div className="mt-6 w-36 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full w-full bg-linear-to-r from-primary/30 via-primary to-primary/30 rounded-full animate-pulse" />
      </div>
    </div>
  )
}
