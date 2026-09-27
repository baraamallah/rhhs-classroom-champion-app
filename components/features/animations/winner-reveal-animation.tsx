"use client"

import { useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { TrophyIcon, StarIcon } from "@/components/common/icons"
import { FirstPlaceLogo } from "@/components/common/podium-logos"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Confetti } from "@/components/features/animations/confetti"
import { Sparkles, ArrowRight, RotateCcw, Award, Flame } from "lucide-react"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

const FLOATING_SPARKLES = [
  { id: 1, left: "15%", delay: 0, color: "text-amber-400" },
  { id: 2, left: "30%", delay: 1.5, color: "text-yellow-400" },
  { id: 3, left: "50%", delay: 0.8, color: "text-emerald-400" },
  { id: 4, left: "70%", delay: 2.2, color: "text-amber-300" },
  { id: 5, left: "85%", delay: 1.2, color: "text-yellow-500" },
]

export function WinnerRevealAnimation() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleReveal = () => {
    setIsRevealed(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5500)
  }

  const handleReset = () => {
    setIsRevealed(false)
    setShowConfetti(false)
  }

  return (
    <LazyMotionProvider>
      <div className="relative w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center overflow-hidden min-h-145">
        {/* Dynamic Confetti Celebration */}
        <Confetti active={showConfetti} duration={5500} pieceCount={120} type="gold" />

        {/* Ambient Floating Sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {FLOATING_SPARKLES.map((sparkle) => (
            <m.div
              key={sparkle.id}
              className={`absolute ${sparkle.color} opacity-60`}
              style={{ left: sparkle.left }}
              initial={{ y: -30, opacity: 0 }}
              animate={{
                y: ["5vh", "80vh"],
                opacity: [0, 0.9, 0.9, 0],
                scale: [0.6, 1.2, 0.8],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 7,
                delay: sparkle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <StarIcon className="w-5 h-5" />
            </m.div>
          ))}

          {/* Ambient Warm Golden Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-linear-to-tr from-amber-500/20 via-yellow-500/20 to-emerald-500/15 rounded-full blur-3xl" />
        </div>

        {/* State Container */}
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            /* ================= STATE 1: MYSTERY UNVEIL ================= */
            <m.div
              key="mystery-pedestal"
              className="relative z-10 w-full max-w-xl bg-card/85 dark:bg-card/75 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-amber-500/10 text-center flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Mystery Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-8 shadow-xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Championship Results Sealed</span>
              </div>

              {/* Glowing Mystery Trophy Centerpiece */}
              <div className="relative mb-8 flex items-center justify-center">
                {/* Pulsing Aura Rings */}
                <m.div
                  className="absolute w-36 h-36 rounded-full border-2 border-amber-500/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                />
                <m.div
                  className="absolute w-48 h-48 rounded-full border border-yellow-500/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                />

                {/* Mystery Trophy Box */}
                <m.div
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-linear-to-br from-amber-400/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-400/60 p-5 shadow-xl shadow-amber-500/20 flex items-center justify-center cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReveal}
                >
                  <TrophyIcon className="w-16 h-16 sm:w-20 sm:h-20 text-amber-500 dark:text-amber-400 drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)] group-hover:rotate-6 transition-transform duration-300" />
                  <m.div
                    className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1.5 rounded-full shadow-md"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </m.div>
                </m.div>
              </div>

              {/* Mystery Text */}
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
                The Champions Are Ready!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                Evaluations have been sealed. Click below to initiate the grand reveal ceremony and announce this month&apos;s champions.
              </p>

              {/* Big Interactive Reveal Button */}
              <Button
                size="lg"
                onClick={handleReveal}
                className="w-full sm:w-auto relative group overflow-hidden bg-linear-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-black font-black text-base sm:text-lg px-8 sm:px-12 py-6 rounded-full shadow-xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {/* Button Shimmer */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                <span>Unveil The Champions</span>
              </Button>
            </m.div>
          ) : (
            /* ================= STATE 2: REVEALED TRIUMPH ================= */
            <m.div
              key="celebration-triumph"
              className="relative z-10 w-full max-w-2xl bg-card/90 dark:bg-card/85 backdrop-blur-xl border border-amber-500/50 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-amber-500/25 text-center flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
            >
              {/* Spinning Sunburst Rays Behind Trophy */}
              <div className="relative mb-6 flex items-center justify-center">
                <m.div
                  className="absolute w-64 h-64 -inset-8 opacity-40 pointer-events-none"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-400">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <line
                        key={i}
                        x1="50"
                        y1="50"
                        x2={50 + 45 * Math.cos((i * 30 * Math.PI) / 180)}
                        y2={50 + 45 * Math.sin((i * 30 * Math.PI) / 180)}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    ))}
                  </svg>
                </m.div>

                {/* Grand Champion 3D Badge with Triumphant Bounce */}
                <m.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 16 }}
                  className="relative z-10 drop-shadow-[0_10px_25px_rgba(245,158,11,0.5)]"
                >
                  <FirstPlaceLogo className="w-28 h-28 sm:w-36 sm:h-36" />
                </m.div>
              </div>

              {/* Triumphant Laurels */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Award className="w-3.5 h-3.5" />
                <span>Monthly Champions Crowned</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight bg-linear-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent mb-3">
                Hail Our Green Champions!
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-8 font-medium">
                The competition results are finalized. The top classrooms across each division have earned the prestigious Green Classroom Champion honors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-base px-8 py-6 rounded-full shadow-xl shadow-amber-500/25 group"
                >
                  <Link href="/winners">
                    <TrophyIcon className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>View Winners & Certificates</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="w-full sm:w-auto rounded-full px-6 py-6 border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Replay Reveal</span>
                </Button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotionProvider>
  )
}
