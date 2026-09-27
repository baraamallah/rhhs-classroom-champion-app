"use client"

import { useEffect, useState, useId } from "react"
import { m } from "framer-motion"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

export type ConfettiType = "celebration" | "eco" | "gold"

interface ConfettiPiece {
  id: string
  x: number
  y: number
  color: string
  size: number
  rotation: number
  delay: number
  drift: number
  duration: number
  shape: "square" | "circle" | "leaf" | "star" | "ribbon"
}

const CELEBRATION_COLORS = [
  "#10b981", // Emerald
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#fbbf24", // Gold
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
]

const ECO_COLORS = [
  "#10b981", // Emerald
  "#059669", // Dark Emerald
  "#22c55e", // Green
  "#16a34a", // Deep Green
  "#84cc16", // Lime
  "#eab308", // Sun Gold
  "#14b8a6", // Teal
  "#86efac", // Mint
]

const GOLD_COLORS = [
  "#fbbf24", // Bright Gold
  "#f59e0b", // Amber
  "#d97706", // Deep Gold
  "#fef08a", // Light Yellow
  "#ca8a04", // Dark Gold
  "#10b981", // Emerald accent
]

export function Confetti({
  active = true,
  duration = 4000,
  pieceCount = 90,
  type = "celebration",
}: {
  active?: boolean
  duration?: number
  pieceCount?: number
  type?: ConfettiType
}) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const baseId = useId()

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    const palette =
      type === "eco"
        ? ECO_COLORS
        : type === "gold"
        ? GOLD_COLORS
        : CELEBRATION_COLORS

    const shapes: ConfettiPiece["shape"][] =
      type === "eco"
        ? ["leaf", "circle", "square", "leaf"]
        : type === "gold"
        ? ["star", "ribbon", "circle", "square"]
        : ["square", "circle", "ribbon", "leaf", "star"]

    const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
      id: `${baseId}-${i}-${Date.now()}`,
      x: Math.random() * 100,
      y: -10 - Math.random() * 25,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: Math.floor(Math.random() * 8) + 6,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 220,
      duration: 2.2 + Math.random() * 1.8,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }))

    setPieces(newPieces)

    const timer = setTimeout(() => {
      setPieces([])
    }, duration)

    return () => clearTimeout(timer)
  }, [active, duration, pieceCount, type, baseId])

  if (!active || pieces.length === 0) return null

  return (
    <LazyMotionProvider>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
        {pieces.map((piece) => {
          if (piece.shape === "leaf") {
            return (
              <m.svg
                key={piece.id}
                viewBox="0 0 24 24"
                className="absolute drop-shadow-xs"
                style={{
                  width: piece.size * 1.5,
                  height: piece.size * 1.5,
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  fill: piece.color,
                }}
                initial={{ y: 0, rotate: piece.rotation, opacity: 1, scale: 0.5 }}
                animate={{
                  y: "115vh",
                  rotate: piece.rotation + 540,
                  opacity: [1, 1, 0.8, 0],
                  x: [0, piece.drift * 0.4, -piece.drift * 0.2, piece.drift],
                  scale: [0.8, 1, 0.9],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeInOut",
                }}
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              </m.svg>
            )
          }

          if (piece.shape === "star") {
            return (
              <m.div
                key={piece.id}
                className="absolute font-black select-none pointer-events-none"
                style={{
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  color: piece.color,
                  fontSize: `${piece.size * 1.4}px`,
                }}
                initial={{ y: 0, rotate: piece.rotation, opacity: 1 }}
                animate={{
                  y: "115vh",
                  rotate: piece.rotation + 720,
                  opacity: [1, 1, 0.8, 0],
                  x: [0, piece.drift, -piece.drift * 0.3, piece.drift * 1.1],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeOut",
                }}
              >
                ★
              </m.div>
            )
          }

          if (piece.shape === "ribbon") {
            return (
              <m.div
                key={piece.id}
                className="absolute rounded-full"
                style={{
                  backgroundColor: piece.color,
                  width: `${piece.size * 2}px`,
                  height: `${piece.size * 0.4}px`,
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                }}
                initial={{ y: 0, rotate: piece.rotation, opacity: 1 }}
                animate={{
                  y: "115vh",
                  rotate: piece.rotation + 900,
                  opacity: [1, 1, 0.7, 0],
                  x: [0, piece.drift * 0.7, piece.drift],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeOut",
                }}
              />
            )
          }

          // Circle or Square
          return (
            <m.div
              key={piece.id}
              className={`absolute ${piece.shape === "circle" ? "rounded-full" : "rounded-xs"}`}
              style={{
                backgroundColor: piece.color,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                left: `${piece.x}%`,
                top: `${piece.y}%`,
              }}
              initial={{ y: 0, rotate: piece.rotation, opacity: 1 }}
              animate={{
                y: "115vh",
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0.8, 0],
                x: [0, piece.drift * 0.5, piece.drift],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: "easeOut",
              }}
            />
          )
        })}
      </div>
    </LazyMotionProvider>
  )
}
