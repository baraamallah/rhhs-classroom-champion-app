"use client"

import Image from "next/image"

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background/95 to-primary/5 relative flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1s]" />

      <div className="relative flex items-center justify-center">
        {/* Soft radial background aura */}
        <div className="absolute w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

        {/* Outer orbital ring */}
        <div className="absolute w-36 h-36 rounded-full border border-emerald-500/20 border-t-emerald-500/80 animate-spin animation-duration-[4s] pointer-events-none" />

        {/* Middle counter-orbital ring */}
        <div className="absolute w-28 h-28 rounded-full border border-teal-500/25 border-b-teal-500/70 animate-spin animation-duration-[2.5s] direction-[reverse] pointer-events-none" />

        {/* Central Brand Glass Card */}
        <div className="relative z-10 w-22 h-22 sm:w-26 sm:h-26 rounded-3xl bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-border/80 shadow-2xl shadow-emerald-500/15 p-3.5 flex items-center justify-center ring-1 ring-emerald-500/20">
          <Image
            src="/Eco Champ.png"
            alt="RHHS Eco Champion"
            width={96}
            height={96}
            className="w-full h-full object-contain drop-shadow-md animate-pulse animation-duration-[2.5s]"
            priority
          />
        </div>
      </div>

      {/* Brand Identity & Title */}
      <div className="mt-8 text-center space-y-2 max-w-sm relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>RHHS Eco Platform</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          RHHS Classroom Champion
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Live Sustainability Leaderboard &amp; Environmental Competition
        </p>
      </div>

      {/* Sleek High-Precision Progress Bar */}
      <div className="mt-7 w-48 sm:w-56 h-1.5 bg-muted/70 dark:bg-muted/40 rounded-full overflow-hidden p-px border border-border/50 relative z-10 shadow-inner">
        <div className="h-full w-1/3 bg-linear-to-r from-emerald-500/10 via-emerald-500 to-emerald-500/10 rounded-full animate-indeterminate-slide" />
      </div>

      {/* Subtle status label */}
      <p className="mt-3.5 text-[11px] font-medium text-muted-foreground/80 tracking-wide flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
        Synchronizing campus sustainability data...
      </p>
    </div>
  )
}
