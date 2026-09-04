"use client"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useConsent } from "@/components/providers/consent-provider"

export function ConditionalTelemetry() {
  const { consent } = useConsent()

  // Strictly respect user choice: do NOT mount if consent is absent or analytics is false
  if (!consent || !consent.analytics) {
    return null
  }

  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  )
}
