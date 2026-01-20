"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrophyIcon, StarIcon, MedalIcon, CrownIcon } from "@/components/icons"
import { X, Award, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  if (!winner) return null

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
          icon: <CrownIcon className="h-20 w-20 text-yellow-500" />,
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
          icon: <MedalIcon className="h-20 w-20 text-gray-400" />,
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
          icon: <MedalIcon className="h-20 w-20 text-amber-600" />,
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
          icon: <Award className="h-20 w-20 text-blue-500" />,
          medalColor: "text-blue-500"
        }
    }
  }

  const rankInfo = getRankInfo(winner.rank)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Certificate Card */}
          <motion.div
            className={`relative w-full max-w-lg ${rankInfo.bgColor} border-4 ${rankInfo.borderColor} rounded-3xl p-8 shadow-2xl overflow-hidden`}
            initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Sparkle Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
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
                </motion.div>
              ))}
            </div>

            {/* Certificate Content */}
            <div className="relative text-center space-y-6">
              {/* Trophy/Medal Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <div className="relative">
                  {rankInfo.icon}
                  {winner.rank === 1 && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <StarIcon className="h-8 w-8 text-yellow-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                  Certificate of Excellence
                </p>
                <h1 className={`text-4xl font-extrabold bg-gradient-to-r ${rankInfo.color} bg-clip-text text-transparent`}>
                  {rankInfo.title}
                </h1>
                <p className={`text-lg font-semibold ${rankInfo.textColor}`}>
                  {rankInfo.subtitle}
                </p>
              </motion.div>

              {/* Division & Month */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-1"
              >
                <p className="text-sm text-muted-foreground">{winner.division} Division</p>
                <p className="text-lg font-semibold text-foreground">
                  {winner.month} {winner.year}
                </p>
              </motion.div>

              {/* Winner Name */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className={`py-4 px-6 rounded-xl border-2 ${rankInfo.borderColor} bg-card/50 backdrop-blur-sm`}
              >
                <p className="text-sm text-muted-foreground mb-1">Awarded To</p>
                <h2 className="text-2xl font-bold text-foreground">{winner.classroomName}</h2>
                <p className="text-muted-foreground">Grade {winner.grade}</p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-3 gap-4"
              >
                <div className="text-center p-3 rounded-lg bg-card/30 border border-border">
                  <p className="text-2xl font-bold text-foreground">{winner.totalScore}</p>
                  <p className="text-xs text-muted-foreground">Total Score</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card/30 border border-border">
                  <p className="text-2xl font-bold text-foreground">{winner.averageScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card/30 border border-border">
                  <p className="text-2xl font-bold text-foreground">{winner.evaluationCount}</p>
                  <p className="text-xs text-muted-foreground">Evaluations</p>
                </div>
              </motion.div>

              {/* Win Count Badge */}
              {winner.winCount && winner.winCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"
                >
                  <TrophyIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {winner.winCount} Total {winner.winCount === 1 ? 'Win' : 'Wins'} This Year
                  </span>
                </motion.div>
              )}

              {/* Decorative Stars */}
              <div className="flex justify-center gap-2 pt-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <StarIcon 
                      className={`h-6 w-6 ${i < Math.min(winner.rank <= 3 ? 4 - winner.rank + 3 : 2, 5) ? rankInfo.medalColor : 'text-muted-foreground/30'}`} 
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pulsing Border Effect */}
            <motion.div
              className={`absolute inset-0 rounded-3xl border-4 ${rankInfo.borderColor} pointer-events-none`}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
