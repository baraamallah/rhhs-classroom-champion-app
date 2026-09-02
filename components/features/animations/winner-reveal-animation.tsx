"use client"

import { useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { Trophy, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Confetti } from "@/components/features/animations/confetti"

import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
const FloatingDecoration = ({ delay = 0, x = 0, color = "primary" }: { delay?: number, x?: number, color?: string }) => (
  <m.div
    className={`absolute text-${color}/20`}
    initial={{ y: -20, x, opacity: 0 }}
    animate={{
      y: [null, 100, 0],
      x: [null, x + 20, x - 10, x],
      opacity: [0, 0.6, 0.3, 0]
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      repeatDelay: 2
    }}
  >
    <PartyPopper className="h-8 w-8" />
  </m.div>
)

export function WinnerRevealAnimation() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleReveal = () => {
    setIsRevealed(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
  }

  return (
    <LazyMotionProvider>
      <div className="relative w-full max-w-4xl mx-auto py-20 px-4 flex flex-col items-center overflow-hidden min-h-[500px]">
        <Confetti active={showConfetti} />

      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingDecoration delay={0} x={100} color="yellow-500" />
        <FloatingDecoration delay={2} x={300} color="primary" />
        <FloatingDecoration delay={4} x={500} color="yellow-500" />
        <FloatingDecoration delay={1} x={700} color="primary" />
        <FloatingDecoration delay={3} x={900} color="yellow-500" />
      </div>

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <m.div
            key="reveal-button"
            className="text-center relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <m.div
              className="mb-8 p-6 bg-primary/10 rounded-full border-2 border-primary/20"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Trophy className="h-20 w-20 text-yellow-500" />
            </m.div>

            <h2 className="text-4xl font-bold mb-6 text-foreground">The Winners are Ready!</h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto mb-10">
              The eco-experts have finished their calculations. Click below to reveal the champions!
            </p>

            <Button
              size="lg"
              onClick={handleReveal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl rounded-full px-12 py-8 text-2xl font-black group transition-[background-color,border-color,color,box-shadow,opacity,transform] hover:scale-105 active:scale-95"
            >
              <PartyPopper className="mr-3 h-8 w-8 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              Check Winner
            </Button>
          </m.div>
        ) : (
          <m.div
            key="winner-revealed"
            className="text-center relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
              className="mb-8"
            >
              <div className="relative">
                <m.div
                  className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Trophy className="h-32 w-32 text-yellow-500 relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              </div>
            </m.div>

            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-yellow-500 via-primary to-yellow-500 bg-clip-text text-transparent">
              Congratulations!
            </h2>
            <p className="text-2xl font-bold text-foreground mb-10">
              The champions have been crowned for this month.
            </p>

            <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black shadow-xl rounded-full px-10 py-6 text-xl font-bold group">
              <Link href="/winners">
                <Trophy className="mr-2 h-6 w-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                View Full Winners List
              </Link>
            </Button>
          </m.div>
        )}
      </AnimatePresence>
      </div>
    </LazyMotionProvider>
  )
}
