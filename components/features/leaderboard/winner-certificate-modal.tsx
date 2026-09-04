"use client"

import { useEffect } from "react"
import { m, AnimatePresence } from "framer-motion"
import { TrophyIcon, StarIcon, MedalIcon, CrownIcon } from "@/components/common/icons"
import { X, Award, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDivisionDisplayName } from "@/lib/division-display"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

const getRankInfo = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        title: "CHAMPION",
        subtitle: "1st Place",
        color: "from-yellow-400 via-yellow-500 to-amber-600",
        bgColor: "bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-600/20",
        borderColor: "border-yellow-500",
        textColor: "text-yellow-500",
        icon: <CrownIcon className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 text-yellow-500" />,
        medalColor: "text-yellow-500"
      }
    case 2:
      return {
        title: "RUNNER UP",
        subtitle: "2nd Place",
        color: "from-gray-300 via-gray-400 to-gray-500",
        bgColor: "bg-gradient-to-br from-gray-400/20 via-gray-300/10 to-gray-500/20",
        borderColor: "border-gray-400",
        textColor: "text-gray-400",
        icon: <MedalIcon className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 text-gray-400" />,
        medalColor: "text-gray-400"
      }
    case 3:
      return {
        title: "HONORABLE",
        subtitle: "3rd Place",
        color: "from-amber-600 via-amber-700 to-orange-700",
        bgColor: "bg-gradient-to-br from-amber-600/20 via-orange-500/10 to-amber-700/20",
        borderColor: "border-amber-600",
        textColor: "text-amber-600",
        icon: <MedalIcon className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 text-amber-600" />,
        medalColor: "text-amber-600"
      }
    default:
      return {
        title: "PARTICIPANT",
        subtitle: `${rank}th Place`,
        color: "from-blue-400 via-blue-500 to-blue-600",
        bgColor: "bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-blue-600/20",
        borderColor: "border-blue-500",
        textColor: "text-blue-500",
        icon: <Award className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 text-blue-500" />,
        medalColor: "text-blue-500"
      }
  }
}

interface WinnerCertificateModalProps {
  isOpen: boolean
  onClose: () => void
  winner: {
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
  } | null
}

export function WinnerCertificateModal({ isOpen, onClose, winner }: WinnerCertificateModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!winner) return null

  const rankInfo = getRankInfo(winner.rank)

  return (
    <LazyMotionProvider>
      <AnimatePresence>
        {isOpen && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <m.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Certificate Card */}
            <m.div
              className={`relative w-full max-w-lg ${rankInfo.bgColor} border-2 xs:border-4 ${rankInfo.borderColor} rounded-2xl xs:rounded-3xl p-4 xs:p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90dvh] sm:max-h-[calc(100dvh-2.5rem)]`}
              initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {/* Close Button with 44px tap target */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2.5 right-2.5 xs:top-4 xs:right-4 z-20 min-h-11 min-w-11 rounded-full hover:bg-white/20 bg-background/40 backdrop-blur-xs cursor-pointer flex items-center justify-center"
                onClick={onClose}
                aria-label="Close certificate"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Sparkle Effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 12 }, (_, i) => {
                  const top = (i * 37 + 8) % 100
                  const left = (i * 61 + 10) % 100
                  return (
                    <m.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                      }}
                      initial={{ scale: 0.01, opacity: 0 }}
                      animate={{
                        scale: [0.01, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        delay: i * 0.15,
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1,
                      }}
                    >
                      <Sparkles className={`h-4 w-4 ${rankInfo.textColor}`} />
                    </m.div>
                  )
                })}
              </div>

              {/* Certificate Content */}
              <div className="relative text-center space-y-4 xs:space-y-6">
                {/* Trophy/Medal Icon */}
                <m.div
                  initial={{ scale: 0.01, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    {rankInfo.icon}
                    {winner.rank === 1 && (
                      <m.div
                        className="absolute -top-2 -right-2"
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <StarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
                      </m.div>
                    )}
                  </div>
                </m.div>

                {/* Title */}
                <m.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                    Certificate of Excellence
                  </p>
                  <h1 className={`text-2xl xs:text-3xl sm:text-4xl font-extrabold bg-linear-to-r ${rankInfo.color} bg-clip-text text-transparent tracking-tight`}>
                    {rankInfo.title}
                  </h1>
                  <p className={`text-sm xs:text-base sm:text-lg font-semibold ${rankInfo.textColor}`}>
                    {rankInfo.subtitle}
                  </p>
                </m.div>

                {/* Division & Month */}
                <m.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-0.5 sm:space-y-1"
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">{getDivisionDisplayName(winner.division)} Division</p>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {winner.month} {winner.year}
                  </p>
                </m.div>

                {/* Winner Name */}
                <m.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`py-3 xs:py-4 px-3 xs:px-6 rounded-xl border-2 ${rankInfo.borderColor} bg-card/50 backdrop-blur-sm`}
                >
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Awarded To</p>
                  <h2 className="text-xl xs:text-2xl font-bold text-foreground truncate">{winner.classroomName}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Grade {winner.grade}</p>
                </m.div>

                {/* Stats */}
                <m.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4"
                >
                  <div className="text-center p-2 xs:p-3 rounded-lg bg-card/30 border border-border">
                    <p className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground">{winner.totalScore}</p>
                    <p className="text-[10px] xs:text-xs text-muted-foreground">Total Score</p>
                  </div>
                  <div className="text-center p-2 xs:p-3 rounded-lg bg-card/30 border border-border">
                    <p className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground">{winner.averageScore.toFixed(1)}</p>
                    <p className="text-[10px] xs:text-xs text-muted-foreground">Average</p>
                  </div>
                  <div className="text-center p-2 xs:p-3 rounded-lg bg-card/30 border border-border">
                    <p className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground">{winner.evaluationCount}</p>
                    <p className="text-[10px] xs:text-xs text-muted-foreground">Evaluations</p>
                  </div>
                </m.div>

                {/* Win Count Badge */}
                {winner.winCount && winner.winCount > 0 && (
                  <m.div
                    initial={{ scale: 0.01 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="inline-flex items-center gap-2 px-3.5 xs:px-4 py-1.5 xs:py-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"
                  >
                    <TrophyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      {winner.winCount} Total {winner.winCount === 1 ? 'Win' : 'Wins'} This Year
                    </span>
                  </m.div>
                )}

                {/* Decorative Stars */}
                <div className="flex justify-center gap-2 pt-1 sm:pt-2">
                  {[...Array(5)].map((_, i) => (
                    <m.div
                      key={i}
                      initial={{ scale: 0.01, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                    >
                      <StarIcon 
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${i < Math.min(winner.rank <= 3 ? 4 - winner.rank + 3 : 2, 5) ? rankInfo.medalColor : 'text-muted-foreground/30'}`} 
                      />
                    </m.div>
                  ))}
                </div>
              </div>

              {/* Pulsing Border Effect */}
              <m.div
                className={`absolute inset-0 rounded-2xl xs:rounded-3xl border-2 xs:border-4 ${rankInfo.borderColor} pointer-events-none`}
                initial={{ opacity: 0.5 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotionProvider>
  )
}
