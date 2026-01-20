"use client"

import { motion } from "framer-motion"
import { TrophyIcon, StarIcon } from "@/components/icons"

interface CelebrationAnimationProps {
  show: boolean
  title: string
  subtitle?: string
}

export function CelebrationAnimation({ show, title, subtitle }: CelebrationAnimationProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        className="bg-card border-2 border-primary rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-4"
        >
          <TrophyIcon className="h-24 w-24 text-yellow-500 mx-auto" />
        </motion.div>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                rotate: 360,
              }}
              transition={{
                delay: 0.5 + i * 0.1,
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <StarIcon className="h-8 w-8 text-yellow-400" />
            </motion.div>
          ))}
        </div>

        {/* Title */}
        <motion.h2
          className="text-4xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-primary bg-clip-text text-transparent mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {title}
        </motion.h2>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            className="text-xl text-muted-foreground"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-4 border-primary"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  )
}
