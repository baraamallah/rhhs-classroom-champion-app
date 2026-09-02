"use client"

import { useReducedMotion, MotionConfig } from "framer-motion"
import type { ReactNode } from "react"

export function MotionProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  )
}
