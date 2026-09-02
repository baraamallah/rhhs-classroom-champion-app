"use client"

import { m } from "framer-motion"
import { LeafIcon } from "@/components/common/icons"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy } from "lucide-react"

import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
const Tree = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <m.div
    className={`relative ${className}`}
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 1, delay }}
  >
    {/* Trunk */}
    <div className="w-4 h-24 bg-amber-900 mx-auto rounded-t-sm" />
    {/* Leaves/Canopy */}
    <m.div
      className="absolute -top-16 -left-8 w-20 h-20 bg-green-600 rounded-full"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    />
    <m.div
      className="absolute -top-12 -left-12 w-16 h-16 bg-green-500 rounded-full"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }}
    />
    <m.div
      className="absolute -top-20 -right-4 w-18 h-18 bg-green-700 rounded-full"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.2 }}
    />
    <m.div
      className="absolute -top-14 -right-10 w-14 h-14 bg-green-400 rounded-full"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 }}
    />
  </m.div>
)

const FloatingLeaf = ({ delay = 0, x = 0 }: { delay?: number, x?: number }) => (
  <m.div
    className="absolute text-primary/40"
    initial={{ y: -50, x, opacity: 0, rotate: 0 }}
    animate={{
      y: [null, 600],
      x: [x, x + 50, x - 50, x + 20],
      opacity: [0, 1, 1, 0],
      rotate: [0, 45, -45, 90, -90, 180]
    }}
    transition={{
      duration: 10,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
  >
    <LeafIcon className="h-6 w-6" />
  </m.div>
)

export function CalculationAnimation() {
  return (
    <LazyMotionProvider>
      <div className="relative w-full max-w-4xl mx-auto py-20 px-4 flex flex-col items-center overflow-hidden min-h-[600px]">
      {/* Background Leaves */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingLeaf delay={0} x={100} />
        <FloatingLeaf delay={2} x={300} />
        <FloatingLeaf delay={4} x={500} />
        <FloatingLeaf delay={1} x={700} />
        <FloatingLeaf delay={3} x={200} />
        <FloatingLeaf delay={5} x={600} />
        <FloatingLeaf delay={1.5} x={450} />
      </div>

      <m.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl font-bold mb-4 text-foreground">Calculating Results...</h2>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Our eco-experts are finalizing this month's scores. We're growing something special!
        </p>
      </m.div>

      {/* Forest Floor */}
      <div className="relative flex items-end justify-center gap-12 md:gap-24 mb-16 h-40">
        <Tree className="scale-75 md:scale-90" delay={0.2} />
        <Tree className="scale-110" delay={0} />
        <Tree className="scale-75 md:scale-90" delay={0.4} />
      </div>

      {/* Grass/Floor */}
      <div className="w-full h-4 bg-green-900/20 rounded-full mb-12 blur-sm" />

      {/* Progress Indicator */}
      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden relative mb-12">
        <m.div
          className="absolute inset-y-0 left-0 w-full origin-left bg-primary"
          animate={{
            scaleX: [0, 1, 0],
            x: ["-50%", "0%", "50%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Call to Action */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="relative z-10"
      >
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl rounded-full px-8 py-6 text-lg font-bold group">
          <Link href="/winners">
            <Trophy className="mr-2 h-6 w-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
            Go to Winners Page
          </Link>
        </Button>
      </m.div>
      </div>
    </LazyMotionProvider>
  )
}
