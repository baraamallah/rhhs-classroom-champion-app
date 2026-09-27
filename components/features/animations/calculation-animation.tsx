"use client"

import { useEffect, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { LeafIcon, TrophyIcon, StarIcon } from "@/components/common/icons"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Activity, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

const CALCULATION_STEPS = [
  {
    title: "Auditing Daily Eco-Habits",
    description: "Verifying classroom cleanliness and waste-sorting metrics...",
    icon: LeafIcon,
    accent: "text-emerald-500",
  },
  {
    title: "Measuring Conservation Points",
    description: "Tallying smart energy usage, power conservation & green space care...",
    icon: Sparkles,
    accent: "text-amber-500",
  },
  {
    title: "Validating Supervisor Records",
    description: "Cross-referencing inspection criteria across all 5 school wings...",
    icon: ShieldCheck,
    accent: "text-blue-500",
  },
  {
    title: "Balancing Division Standings",
    description: "Applying academic weighting and normalization equations...",
    icon: Activity,
    accent: "text-teal-500",
  },
  {
    title: "Finalizing Champion Laurels",
    description: "Preparing official honor roll certificates and podium rankings...",
    icon: TrophyIcon,
    accent: "text-yellow-500",
  },
]

const FLOATING_LEAVES = [
  { id: 1, left: "10%", delay: 0, duration: 8, scale: 0.8 },
  { id: 2, left: "25%", delay: 2, duration: 10, scale: 1.1 },
  { id: 3, left: "45%", delay: 1, duration: 9, scale: 0.9 },
  { id: 4, left: "70%", delay: 3, duration: 11, scale: 1 },
  { id: 5, left: "85%", delay: 1.5, duration: 8.5, scale: 0.7 },
  { id: 6, left: "92%", delay: 4, duration: 9.5, scale: 1.2 },
]

export function CalculationAnimation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [computedPercentage, setComputedPercentage] = useState(68)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % CALCULATION_STEPS.length)
    }, 2800)

    const percentInterval = setInterval(() => {
      setComputedPercentage((prev) => {
        if (prev >= 98) return 62
        return prev + 1
      })
    }, 180)

    return () => {
      clearInterval(stepInterval)
      clearInterval(percentInterval)
    }
  }, [])

  const currentStep = CALCULATION_STEPS[currentStepIndex]
  const CurrentIcon = currentStep.icon

  return (
    <LazyMotionProvider>
      <div className="relative w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center overflow-hidden min-h-140">
        {/* Ambient Floating Botanical Leaves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {FLOATING_LEAVES.map((leaf) => (
            <m.div
              key={leaf.id}
              className="absolute text-emerald-500/25 dark:text-emerald-400/20"
              style={{ left: leaf.left }}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{
                y: ["0vh", "85vh"],
                opacity: [0, 0.8, 0.8, 0],
                rotate: [0, 90, -45, 180],
                x: [0, 25, -25, 15],
              }}
              transition={{
                duration: leaf.duration,
                delay: leaf.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <LeafIcon className="w-6 h-6" style={{ transform: `scale(${leaf.scale})` }} />
            </m.div>
          ))}

          {/* Ambient Radial Energy Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-linear-to-tr from-emerald-500/15 via-primary/20 to-amber-500/15 rounded-full blur-3xl" />
        </div>

        {/* Central Master Card */}
        <m.div
          className="relative z-10 w-full max-w-2xl bg-card/85 dark:bg-card/75 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-500/10 text-center flex flex-col items-center"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Eco-Auditing Engine Active</span>
          </div>

          {/* Central Living Tree / Growing Totem Visualization */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Spinning Radiant Halo */}
            <m.div
              className="absolute w-36 h-36 rounded-full border border-dashed border-emerald-500/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute w-44 h-44 rounded-full border border-dotted border-amber-500/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            />

            {/* Glowing Core Orb with Growing Tree Motif */}
            <div className="relative w-28 h-28 rounded-full bg-linear-to-tr from-emerald-600 via-primary to-green-400 p-0.5 shadow-xl shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center relative overflow-hidden">
                <m.div
                  className="absolute inset-0 bg-linear-to-t from-emerald-500/20 via-transparent to-transparent"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />

                {/* Animated Growing Tree SVG */}
                <m.svg
                  viewBox="0 0 48 48"
                  className="w-16 h-16 text-emerald-600 dark:text-emerald-400 drop-shadow-md"
                  initial={{ scale: 0.85 }}
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Tree Trunk */}
                  <path
                    d="M24 40V24M24 24L18 16M24 24L30 16M24 30L17 25M24 30L31 25"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Tree Foliage Clusters */}
                  <circle cx="24" cy="11" r="7" className="fill-emerald-500/30 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
                  <circle cx="15" cy="16" r="5.5" className="fill-green-500/30 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
                  <circle cx="33" cy="16" r="5.5" className="fill-teal-500/30 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
                </m.svg>
              </div>
            </div>

            {/* Orbiting Satellite Star Icons */}
            <m.div
              className="absolute -top-1 right-2 text-amber-500 drop-shadow-sm"
              animate={{ y: [0, -5, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <StarIcon className="w-6 h-6" />
            </m.div>
            <m.div
              className="absolute -bottom-1 left-2 text-emerald-500 drop-shadow-sm"
              animate={{ y: [0, 4, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <LeafIcon className="w-5 h-5" />
            </m.div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
            Compiling Official Standings...
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
            The school sustainability council is finalizing monthly inspection scores. Standings will be posted immediately once verified!
          </p>

          {/* Dynamic Animated Status Step Ticker */}
          <div className="w-full bg-muted/60 dark:bg-muted/30 border border-border/80 rounded-2xl p-4 mb-6 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <m.div
                key={currentStepIndex}
                className="flex items-center gap-3 text-left"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`p-2.5 rounded-xl bg-card shadow-xs shrink-0 ${currentStep.accent}`}>
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {currentStep.title}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                      Step {currentStepIndex + 1} of {CALCULATION_STEPS.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {currentStep.description}
                  </p>
                </div>
              </m.div>
            </AnimatePresence>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full space-y-2 mb-8">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Calculations in progress
              </span>
              <span className="text-foreground font-mono">{computedPercentage}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative p-0.5 border border-border/50">
              <m.div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 via-primary to-green-400"
                style={{ width: `${computedPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* Shimmer light sweep */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent animate-indeterminate-slide" />
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-full px-7 py-5 font-bold group"
            >
              <Link href="/winners">
                <TrophyIcon className="mr-2 h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
                <span>View Previous Champions</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        </m.div>
      </div>
    </LazyMotionProvider>
  )
}
