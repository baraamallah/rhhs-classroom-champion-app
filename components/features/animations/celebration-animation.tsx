"use client"

import { m } from "framer-motion"
import { TrophyIcon, StarIcon } from "@/components/common/icons"

import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
interface CelebrationAnimationProps {
  show: boolean
  title: string
  subtitle?: string
}

const STAR_POSITIONS = [
  { top: "24%", left: "30%" },
  { top: "34%", left: "68%" },
  { top: "52%", left: "24%" },
  { top: "64%", left: "72%" },
  { top: "42%", left: "48%" },
  { top: "76%", left: "42%" },
]

export function CelebrationAnimation({ show, title, subtitle }: CelebrationAnimationProps) {
  if (!show) return null

  return (
    <LazyMotionProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <m.div
        className="bg-card border-2 border-primary rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
        initial={{ scale: 0.01, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.01, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Trophy Icon */}
        <m.div
          initial={{ scale: 0.01, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-4"
        >
          <TrophyIcon className="h-24 w-24 text-yellow-500 mx-auto" />
        </m.div>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {STAR_POSITIONS.map((position, i) => (
            <m.div
              key={i}
              className="absolute"
              style={{
                top: position.top,
                left: position.left,
              }}
              initial={{ scale: 0.01, rotate: 0 }}
              animate={{
                scale: [0.01, 1.5, 0],
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
            </m.div>
          ))}
        </div>

        {/* Title */}
        <m.h2
          className="text-4xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-primary bg-clip-text text-transparent mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {title}
        </m.h2>

        {/* Subtitle */}
        {subtitle && (
          <m.p
            className="text-xl text-muted-foreground"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {subtitle}
          </m.p>
        )}

        {/* Pulsing ring */}
        <m.div
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
        </m.div>
      </div>
    </LazyMotionProvider>
  )
}
