"use client"

import Image from "next/image"

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 flex flex-col items-center justify-center p-6 select-none">
      <div className="relative flex items-center justify-center">
        {/* Soft pulsing aura */}
        <div className="absolute w-36 h-36 rounded-full bg-primary/15 animate-ping opacity-40 pointer-events-none" />
        <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-card border border-border shadow-2xl p-4 flex items-center justify-center">
          <Image
            src="/Eco Champ.png"
            alt="RHHS Eco Champion"
            width={88}
            height={88}
            className="w-full h-full object-contain animate-pulse"
            priority
          />
        </div>
      </div>

      <div className="mt-8 text-center space-y-2 max-w-sm">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          RHHS Classroom Champion
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Live Sustainability Leaderboard & Environmental Competition
        </p>
      </div>

      {/* Shimmering Progress Bar */}
      <div className="mt-8 w-44 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full w-full bg-linear-to-r from-primary/30 via-primary to-primary/30 rounded-full animate-pulse" />
      </div>
    </div>
  )
}
