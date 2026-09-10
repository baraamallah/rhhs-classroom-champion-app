import type React from "react"
import { cn } from "@/lib/utils"

export type PodiumLogoProps = React.ComponentPropsWithoutRef<"img"> & {
  viewBox?: string
  fill?: string
}

export const PODIUM_BADGE_ASSETS = {
  1: {
    png: "/badges/badge-1st.png",
    webp: "/badges/badge-1st.webp",
    title: "1st Place Grand Champion",
    alt: "1st Place Grand Eco Champion Gold & Emerald Badge",
  },
  2: {
    png: "/badges/badge-2nd.png",
    webp: "/badges/badge-2nd.webp",
    title: "2nd Place Jade Vanguard",
    alt: "2nd Place Jade & Platinum Eco Vanguard Silver Badge",
  },
  3: {
    png: "/badges/badge-3rd.png",
    webp: "/badges/badge-3rd.webp",
    title: "3rd Place Earth Pioneer",
    alt: "3rd Place Earth & Oak Eco Pioneer Bronze Shield Badge",
  },
} as const

/**
 * 1st Place Grand Eco Champion Emblem
 * 3D rendered award emblem featuring a golden monstera leaf wreath with emerald green enamel,
 * radiant sunburst compass star with a faceted emerald gemstone centerpiece,
 * 3-leaf emerald botanical crown, and polished 3D gold ribbon banner embossed with "1st".
 */
export function FirstPlaceLogo({
  className,
  alt = PODIUM_BADGE_ASSETS[1].alt,
  viewBox: _viewBox,
  fill: _fill,
  ...props
}: PodiumLogoProps) {
  return (
    <picture className="contents">
      <source srcSet={PODIUM_BADGE_ASSETS[1].webp} type="image/webp" />
      <img
        src={PODIUM_BADGE_ASSETS[1].png}
        alt={alt}
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        className={cn(
          "w-12 h-12 object-contain select-none pointer-events-none drop-shadow-md inline-block",
          className
        )}
        {...props}
      />
    </picture>
  )
}

/**
 * 2nd Place Jade & Platinum Eco Vanguard Emblem
 * 3D rendered award emblem featuring an ornate circular baroque rococo swirling silver/platinum frame,
 * lush pale jade/mint green monstera leaves, recessed silver medallion with 3D embossed "2nd",
 * and floating pearl accents.
 */
export function SecondPlaceLogo({
  className,
  alt = PODIUM_BADGE_ASSETS[2].alt,
  viewBox: _viewBox,
  fill: _fill,
  ...props
}: PodiumLogoProps) {
  return (
    <picture className="contents">
      <source srcSet={PODIUM_BADGE_ASSETS[2].webp} type="image/webp" />
      <img
        src={PODIUM_BADGE_ASSETS[2].png}
        alt={alt}
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        className={cn(
          "w-12 h-12 object-contain select-none pointer-events-none drop-shadow-md inline-block",
          className
        )}
        {...props}
      />
    </picture>
  )
}

/**
 * 3rd Place Earth & Oak Eco Pioneer Emblem
 * 3D rendered award emblem featuring a solid burnished bronze hexagonal shield plaque with beveled rim,
 * entwined natural green oak leaves, acorns with textured caps, river stones,
 * and a curved aged bronze banner ribbon embossed with "3rd".
 */
export function ThirdPlaceLogo({
  className,
  alt = PODIUM_BADGE_ASSETS[3].alt,
  viewBox: _viewBox,
  fill: _fill,
  ...props
}: PodiumLogoProps) {
  return (
    <picture className="contents">
      <source srcSet={PODIUM_BADGE_ASSETS[3].webp} type="image/webp" />
      <img
        src={PODIUM_BADGE_ASSETS[3].png}
        alt={alt}
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        className={cn(
          "w-12 h-12 object-contain select-none pointer-events-none drop-shadow-md inline-block",
          className
        )}
        {...props}
      />
    </picture>
  )
}

/**
 * Helper component to render rank-appropriate podium emblem
 */
export function PodiumRankBadge({
  rank,
  className = "w-12 h-12",
  alt,
  ...props
}: PodiumLogoProps & { rank: number }) {
  if (rank === 1) return <FirstPlaceLogo className={className} alt={alt} {...props} />
  if (rank === 2) return <SecondPlaceLogo className={className} alt={alt} {...props} />
  if (rank === 3) return <ThirdPlaceLogo className={className} alt={alt} {...props} />
  return null
}
