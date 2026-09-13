"use client"

import { useEffect, useRef, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { TrophyIcon, StarIcon, CrownIcon } from "@/components/common/icons"
import { FirstPlaceLogo, SecondPlaceLogo, ThirdPlaceLogo } from "@/components/common/podium-logos"
import { X, Award, Sparkles, Printer, Share2, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDivisionDisplayName } from "@/lib/division-display"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { useToast } from "@/hooks/use-toast"

interface WinnerData {
  classroomName: string
  grade: string
  division: string
  rank: number
  totalScore: number
  averageScore: number
  evaluationCount: number
  month: string
  year: number
  winCount?: number
}

interface WinnerCertificateModalProps {
  isOpen: boolean
  onClose: () => void
  winner: WinnerData | null
}

const getRankTheme = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        title: "CHAMPION OF EXCELLENCE",
        subtitle: "1st Place Winner",
        accentColor: "text-amber-500",
        borderGold: "border-amber-400/90 dark:border-amber-400",
        badgeBg: "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300",
        ribbonColor: "from-amber-500 via-yellow-400 to-amber-600",
        icon: <FirstPlaceLogo className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />,
        sealColor: "#d97706",
      }
    case 2:
      return {
        title: "DISTINGUISHED RUNNER-UP",
        subtitle: "2nd Place Distinction",
        accentColor: "text-slate-400 dark:text-slate-300",
        borderGold: "border-slate-400/80 dark:border-slate-400",
        badgeBg: "bg-slate-400/15 border-slate-400/40 text-slate-700 dark:text-slate-200",
        ribbonColor: "from-slate-400 via-slate-300 to-slate-500",
        icon: <SecondPlaceLogo className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />,
        sealColor: "#64748b",
      }
    case 3:
      return {
        title: "HONORABLE ECO PIONEER",
        subtitle: "3rd Place Honor",
        accentColor: "text-amber-700 dark:text-amber-500",
        borderGold: "border-amber-700/80 dark:border-amber-600",
        badgeBg: "bg-amber-700/15 border-amber-700/40 text-amber-800 dark:text-amber-300",
        ribbonColor: "from-amber-700 via-amber-600 to-orange-700",
        icon: <ThirdPlaceLogo className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />,
        sealColor: "#b45309",
      }
    default:
      return {
        title: "OUTSTANDING PARTICIPANT",
        subtitle: `${rank}th Place Honor`,
        accentColor: "text-emerald-500",
        borderGold: "border-emerald-500/80",
        badgeBg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
        ribbonColor: "from-emerald-600 via-teal-500 to-emerald-700",
        icon: <Award className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-500" />,
        sealColor: "#059669",
      }
  }
}

export function WinnerCertificateModal({ isOpen, onClose, winner }: WinnerCertificateModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!winner) return null

  const theme = getRankTheme(winner.rank)

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast({
          title: "Certificate Link Copied",
          description: `Share the link to celebrate ${winner.classroomName}'s victory!`,
        })
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      toast({
        title: "Could not copy link",
        description: "Please copy the URL directly from your browser bar.",
        variant: "destructive",
      })
    }
  }

  return (
    <LazyMotionProvider>
      <AnimatePresence>
        {isOpen && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto no-scrollbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Darkened backdrop with blur */}
            <m.div
              className="fixed inset-0 bg-black/80 backdrop-blur-md no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Modal Container */}
            <m.div
              className="relative z-10 w-full max-w-4xl my-auto flex flex-col items-center"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              {/* Top Floating Control Bar */}
              <div className="w-full flex items-center justify-between mb-3 px-1 text-white no-print">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Official Certificate
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="min-h-10 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold backdrop-blur-md cursor-pointer transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
                    <span>{copied ? "Copied" : "Share"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="min-h-10 px-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 border-none text-xs font-bold shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    <span>Print / PDF</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="min-h-10 min-w-10 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer ml-1"
                    aria-label="Close certificate"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* The Diploma Document (No scrollbar cutting, responsive scaling) */}
              <div
                id="printable-certificate"
                ref={certificateRef}
                className="relative w-full rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden select-none bg-linear-to-b from-[#fdfbf7] via-[#fffdf9] to-[#f9f5ec] dark:from-[#171614] dark:via-[#1a1917] dark:to-[#141311] border-2 sm:border-4 border-amber-500/70 dark:border-amber-400/80 text-slate-900 dark:text-slate-100"
              >
                {/* Ornate Gold Foil Outer & Inner Borders */}
                <div className="absolute inset-1 sm:inset-2 border border-amber-500/40 dark:border-amber-400/40 rounded-xl sm:rounded-2xl pointer-events-none" />
                <div className="absolute inset-2.5 sm:inset-4 border border-dashed border-amber-500/30 dark:border-amber-400/30 rounded-lg sm:rounded-xl pointer-events-none" />

                {/* Classical SVG Corner Flourishes */}
                <CornerFlourish position="top-left" />
                <CornerFlourish position="top-right" />
                <CornerFlourish position="bottom-left" />
                <CornerFlourish position="bottom-right" />

                {/* Subtle Background Watermark Seal */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] dark:opacity-[0.045] pointer-events-none select-none">
                  <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-12 border-amber-600 flex items-center justify-center">
                    <TrophyIcon className="w-48 h-48 sm:w-64 sm:h-64 text-amber-600" />
                  </div>
                </div>

                {/* Certificate Core Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Top Header & School Identity */}
                  <div className="mb-2 sm:mb-3">
                    <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.25em] sm:tracking-[0.35em] font-black text-amber-700 dark:text-amber-400">
                      Rafic Hariri High School
                    </p>
                    <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground/80 mt-0.5">
                      Green Classroom Champions Initiative
                    </p>
                  </div>

                  {/* Emblem / Trophy Medallion */}
                  <div className="relative my-1 sm:my-2">
                    <div className="p-1 sm:p-2 rounded-full bg-linear-to-b from-amber-500/20 via-yellow-400/10 to-transparent">
                      {theme.icon}
                    </div>
                    {winner.rank === 1 && (
                      <m.div
                        className="absolute -top-1 -right-1"
                        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <CrownIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 drop-shadow-md" />
                      </m.div>
                    )}
                  </div>

                  {/* Certificate Title */}
                  <div className="space-y-1 mb-3 sm:mb-5">
                    <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight bg-linear-to-r from-amber-700 via-amber-500 to-yellow-600 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                      CERTIFICATE OF EXCELLENCE
                    </h1>
                    <p className="text-xs xs:text-sm sm:text-base font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {theme.title} • {theme.subtitle}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-muted-foreground">
                      <span>{getDivisionDisplayName(winner.division)} Division</span>
                      <span>•</span>
                      <span className="font-bold text-foreground">{winner.month} {winner.year}</span>
                    </div>
                  </div>

                  {/* Presentation Citation */}
                  <div className="w-full max-w-xl my-1 sm:my-3 px-2 sm:px-4">
                    <p className="text-xs sm:text-sm font-serif italic text-muted-foreground mb-1 sm:mb-2">
                      This official honor is proudly conferred upon
                    </p>

                    {/* Classroom Name Banner */}
                    <div className="py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl bg-linear-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-y-2 border-amber-500/60 dark:border-amber-400/60 shadow-xs my-1 sm:my-2">
                      <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground font-serif uppercase">
                        {winner.classroomName}
                      </h2>
                      <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                        Grade {winner.grade}
                      </p>
                    </div>

                    <p className="text-[11px] sm:text-xs text-muted-foreground/90 max-w-md mx-auto leading-relaxed mt-2 font-medium">
                      In recognition of supreme dedication to environmental cleanliness, peer teamwork, and exemplary hygiene standards.
                    </p>
                  </div>

                  {/* Honor Performance Stats Bar */}
                  <div className="w-full max-w-lg grid grid-cols-3 gap-2 sm:gap-3 my-3 sm:my-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-card/60 dark:bg-card/40 border border-amber-500/20 backdrop-blur-xs">
                      <p className="text-base xs:text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                        {winner.totalScore}
                      </p>
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">
                        Total Score
                      </p>
                    </div>

                    <div className="p-2 sm:p-3 rounded-lg bg-card/60 dark:bg-card/40 border border-amber-500/20 backdrop-blur-xs">
                      <p className="text-base xs:text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                        {winner.averageScore.toFixed(1)}
                      </p>
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">
                        Average Score
                      </p>
                    </div>

                    <div className="p-2 sm:p-3 rounded-lg bg-card/60 dark:bg-card/40 border border-amber-500/20 backdrop-blur-xs">
                      <p className="text-base xs:text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                        {winner.evaluationCount}
                      </p>
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">
                        Evaluations
                      </p>
                    </div>
                  </div>

                  {/* Win Count Distinction Badge (if > 0) */}
                  {winner.winCount && winner.winCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
                      <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>{winner.winCount} Total Champion Title{winner.winCount > 1 ? "s" : ""} This Academic Year</span>
                    </div>
                  )}

                  {/* Decorative Stars */}
                  <div className="flex justify-center gap-1.5 pt-2 sm:pt-4">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-xs" />
                    ))}
                  </div>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotionProvider>
  )
}

/**
 * Ornate Classical SVG Corner Flourish
 */
function CornerFlourish({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const rotationClass = {
    "top-left": "",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  }[position]

  const positionClass = {
    "top-left": "top-2 left-2 sm:top-3 sm:left-3",
    "top-right": "top-2 right-2 sm:top-3 sm:right-3",
    "bottom-left": "bottom-2 left-2 sm:bottom-3 sm:left-3",
    "bottom-right": "bottom-2 right-2 sm:bottom-3 sm:right-3",
  }[position]

  return (
    <div className={`absolute ${positionClass} ${rotationClass} pointer-events-none text-amber-500/70 dark:text-amber-400/80`}>
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" className="w-6 h-6 sm:w-8 sm:h-8">
        <path
          d="M2 2H18C20 2 22 4 22 6C22 8 20 10 18 10H8V20C8 22 6 24 4 24C2 24 2 22 2 20V2Z"
          fill="currentColor"
          fillOpacity="0.8"
        />
        <path
          d="M6 6L28 6C30 6 32 8 32 10C32 12 30 14 28 14L14 14L14 28C14 30 12 32 10 32C8 32 6 30 6 28L6 6Z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <circle cx="5" cy="5" r="2.5" fill="currentColor" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    </div>
  )
}

