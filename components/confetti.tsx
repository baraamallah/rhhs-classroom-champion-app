"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ConfettiPiece {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  delay: number
}

const colors = [
  "#22c55e", // green
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#fbbf24", // yellow
]

export function Confetti({ active = true, duration = 3000 }: { active?: boolean; duration?: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    // Create confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.5,
    }))

    setPieces(newPieces)

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([])
    }, duration)

    return () => clearTimeout(timer)
  }, [active, duration])

  if (!active || pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: piece.color,
            left: `${piece.x}%`,
            top: `${piece.y}%`,
          }}
          initial={{
            y: 0,
            rotate: piece.rotation,
            opacity: 1,
          }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 100 : 1000,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
            x: piece.x + (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}
