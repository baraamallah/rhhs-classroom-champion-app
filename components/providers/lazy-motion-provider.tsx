"use client"

import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

export function LazyMotionProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  )
}
