import type React from "react"

/**
 * 1st Place Champion Emblem
 * Premium gold medallion with 3-pointed crown, laurel wreath, ribbons, and bold vector "1"
 */
export function FirstPlaceLogo({ className = "w-12 h-12", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="1st Place Champion"
      {...props}
    >
      <defs>
        {/* Ribbon Gradient */}
        <linearGradient id="gold-ribbon-l" x1="16" y1="36" x2="26" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="gold-ribbon-r" x1="48" y1="36" x2="38" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>

        {/* Outer Medal Gold Gradient */}
        <radialGradient id="gold-outer" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="75%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>

        {/* Inner Coin Gold Gradient */}
        <radialGradient id="gold-inner" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FDE68A" />
          <stop offset="65%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>

        {/* Crown Gold Gradient */}
        <linearGradient id="crown-gold" x1="20" y1="4" x2="44" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Shadow */}
        <filter id="gold-shadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#78350F" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Ribbon Tails */}
      <path
        d="M24 38 L16 57 L23 53 L28 43 Z"
        fill="url(#gold-ribbon-l)"
        stroke="#7F1D1D"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d="M40 38 L48 57 L41 53 L36 43 Z"
        fill="url(#gold-ribbon-r)"
        stroke="#7F1D1D"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Outer Medal Base with Shadow */}
      <circle cx="32" cy="33" r="19" fill="url(#gold-outer)" filter="url(#gold-shadow)" stroke="#FDE68A" strokeWidth="1.2" />

      {/* Laurel Wreath */}
      <g stroke="#FDE68A" strokeWidth="0.6" fill="#FBBF24">
        {/* Left Leaves */}
        <ellipse cx="17.5" cy="27" rx="3" ry="1.4" transform="rotate(-30 17.5 27)" />
        <ellipse cx="16" cy="33" rx="3" ry="1.4" transform="rotate(-5 16 33)" />
        <ellipse cx="17.5" cy="39" rx="3" ry="1.4" transform="rotate(25 17.5 39)" />
        <ellipse cx="21" cy="44" rx="2.8" ry="1.3" transform="rotate(50 21 44)" />

        {/* Right Leaves */}
        <ellipse cx="46.5" cy="27" rx="3" ry="1.4" transform="rotate(30 46.5 27)" />
        <ellipse cx="48" cy="33" rx="3" ry="1.4" transform="rotate(5 48 33)" />
        <ellipse cx="46.5" cy="39" rx="3" ry="1.4" transform="rotate(-25 46.5 39)" />
        <ellipse cx="43" cy="44" rx="2.8" ry="1.3" transform="rotate(-50 43 44)" />
      </g>

      {/* Inner Medallion */}
      <circle cx="32" cy="33" r="14" fill="url(#gold-inner)" stroke="#B45309" strokeWidth="1" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#FDE68A" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.8" />

      {/* Shimmer Light Reflection */}
      <path
        d="M23 26 C25 22 39 22 41 26 C37 24 27 24 23 26 Z"
        fill="#FFFFFF"
        opacity="0.45"
      />

      {/* Vector Bold Numeral "1" */}
      <path
        d="M28 25 L33.5 21.5 L34.5 21.5 L34.5 40.5 L38 40.5 L38 43 L26 43 L26 40.5 L29.5 40.5 L29.5 25.5 L28 26.5 Z"
        fill="#451A03"
      />
      {/* 1 Highlight */}
      <path
        d="M29.5 25.5 L33.5 22.5 L33.5 40.5 L30.5 40.5 Z"
        fill="#78350F"
        opacity="0.2"
      />

      {/* Royal Crown on Top */}
      <g filter="url(#gold-shadow)">
        <path
          d="M24 16 L22 9 L28 12.5 L32 7 L36 12.5 L42 9 L40 16 Z"
          fill="url(#crown-gold)"
          stroke="#78350F"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Crown base rim */}
        <rect x="23" y="15" width="18" height="2.5" rx="1" fill="#FEF08A" stroke="#78350F" strokeWidth="0.6" />
        {/* Crown Jewels */}
        <circle cx="22" cy="9" r="1.2" fill="#EF4444" />
        <circle cx="32" cy="7" r="1.4" fill="#10B981" />
        <circle cx="42" cy="9" r="1.2" fill="#EF4444" />
        <circle cx="32" cy="16.2" r="0.9" fill="#EF4444" />
        <circle cx="28" cy="16.2" r="0.7" fill="#3B82F6" />
        <circle cx="36" cy="16.2" r="0.7" fill="#3B82F6" />
      </g>
    </svg>
  )
}

/**
 * 2nd Place Silver Emblem
 * Gleaming silver medallion with silver laurel wreath, royal blue ribbon, and bold vector "2"
 */
export function SecondPlaceLogo({ className = "w-12 h-12", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="2nd Place Silver"
      {...props}
    >
      <defs>
        {/* Ribbon Gradient (Royal Blue/Silver) */}
        <linearGradient id="silver-ribbon-l" x1="16" y1="36" x2="26" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="silver-ribbon-r" x1="48" y1="36" x2="38" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Outer Silver Gradient */}
        <radialGradient id="silver-outer" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E2E8F0" />
          <stop offset="75%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>

        {/* Inner Silver Gradient */}
        <radialGradient id="silver-inner" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#F1F5F9" />
          <stop offset="70%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </radialGradient>

        {/* Star Gradient */}
        <linearGradient id="silver-star" x1="26" y1="7" x2="38" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Shadow */}
        <filter id="silver-shadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1E293B" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Ribbon Tails */}
      <path
        d="M24 38 L16 57 L23 53 L28 43 Z"
        fill="url(#silver-ribbon-l)"
        stroke="#1E3A8A"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d="M40 38 L48 57 L41 53 L36 43 Z"
        fill="url(#silver-ribbon-r)"
        stroke="#1E3A8A"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Outer Medal Base with Shadow */}
      <circle cx="32" cy="33" r="19" fill="url(#silver-outer)" filter="url(#silver-shadow)" stroke="#FFFFFF" strokeWidth="1.2" />

      {/* Laurel Wreath */}
      <g stroke="#FFFFFF" strokeWidth="0.6" fill="#CBD5E1">
        {/* Left Leaves */}
        <ellipse cx="17.5" cy="27" rx="3" ry="1.4" transform="rotate(-30 17.5 27)" />
        <ellipse cx="16" cy="33" rx="3" ry="1.4" transform="rotate(-5 16 33)" />
        <ellipse cx="17.5" cy="39" rx="3" ry="1.4" transform="rotate(25 17.5 39)" />
        <ellipse cx="21" cy="44" rx="2.8" ry="1.3" transform="rotate(50 21 44)" />

        {/* Right Leaves */}
        <ellipse cx="46.5" cy="27" rx="3" ry="1.4" transform="rotate(30 46.5 27)" />
        <ellipse cx="48" cy="33" rx="3" ry="1.4" transform="rotate(5 48 33)" />
        <ellipse cx="46.5" cy="39" rx="3" ry="1.4" transform="rotate(-25 46.5 39)" />
        <ellipse cx="43" cy="44" rx="2.8" ry="1.3" transform="rotate(-50 43 44)" />
      </g>

      {/* Inner Medallion */}
      <circle cx="32" cy="33" r="14" fill="url(#silver-inner)" stroke="#64748B" strokeWidth="1" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#FFFFFF" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.85" />

      {/* Shimmer Light Reflection */}
      <path
        d="M23 26 C25 22 39 22 41 26 C37 24 27 24 23 26 Z"
        fill="#FFFFFF"
        opacity="0.6"
      />

      {/* Vector Bold Numeral "2" */}
      <path
        d="M26 26.5 C26 22 28.5 20 32 20 C35.5 20 38 22 38 25 C38 28 35.5 31 32 34.5 L28.5 38 L38.5 38 L38.5 42 L25.5 42 L25.5 38.5 L32 32 C34.5 29.5 35 28 35 25.5 C35 23.5 33.8 22.5 32 22.5 C30.2 22.5 29 23.8 29 26 Z"
        fill="#1E293B"
      />

      {/* Top Star Accent */}
      <g filter="url(#silver-shadow)">
        <polygon
          points="32,6 34.5,12 41,12.5 36,17 37.5,23.5 32,20 26.5,23.5 28,17 23,12.5 29.5,12"
          fill="url(#silver-star)"
          stroke="#475569"
          strokeWidth="0.75"
        />
        <circle cx="32" cy="15" r="1" fill="#FFFFFF" />
      </g>
    </svg>
  )
}

/**
 * 3rd Place Bronze Emblem
 * Warm metallic bronze medallion with bronze laurel wreath, amber-orange ribbon, and bold vector "3"
 */
export function ThirdPlaceLogo({ className = "w-12 h-12", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="3rd Place Bronze"
      {...props}
    >
      <defs>
        {/* Ribbon Gradient (Amber Bronze) */}
        <linearGradient id="bronze-ribbon-l" x1="16" y1="36" x2="26" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>
        <linearGradient id="bronze-ribbon-r" x1="48" y1="36" x2="38" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>

        {/* Outer Bronze Gradient */}
        <radialGradient id="bronze-outer" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="35%" stopColor="#F97316" />
          <stop offset="75%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#7C2D12" />
        </radialGradient>

        {/* Inner Bronze Gradient */}
        <radialGradient id="bronze-inner" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFEDD5" />
          <stop offset="30%" stopColor="#FED7AA" />
          <stop offset="70%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>

        {/* Star Gradient */}
        <linearGradient id="bronze-star" x1="26" y1="7" x2="38" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>

        {/* Shadow */}
        <filter id="bronze-shadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#431407" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Ribbon Tails */}
      <path
        d="M24 38 L16 57 L23 53 L28 43 Z"
        fill="url(#bronze-ribbon-l)"
        stroke="#7C2D12"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d="M40 38 L48 57 L41 53 L36 43 Z"
        fill="url(#bronze-ribbon-r)"
        stroke="#7C2D12"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Outer Medal Base with Shadow */}
      <circle cx="32" cy="33" r="19" fill="url(#bronze-outer)" filter="url(#bronze-shadow)" stroke="#FED7AA" strokeWidth="1.2" />

      {/* Laurel Wreath */}
      <g stroke="#FED7AA" strokeWidth="0.6" fill="#FB923C">
        {/* Left Leaves */}
        <ellipse cx="17.5" cy="27" rx="3" ry="1.4" transform="rotate(-30 17.5 27)" />
        <ellipse cx="16" cy="33" rx="3" ry="1.4" transform="rotate(-5 16 33)" />
        <ellipse cx="17.5" cy="39" rx="3" ry="1.4" transform="rotate(25 17.5 39)" />
        <ellipse cx="21" cy="44" rx="2.8" ry="1.3" transform="rotate(50 21 44)" />

        {/* Right Leaves */}
        <ellipse cx="46.5" cy="27" rx="3" ry="1.4" transform="rotate(30 46.5 27)" />
        <ellipse cx="48" cy="33" rx="3" ry="1.4" transform="rotate(5 48 33)" />
        <ellipse cx="46.5" cy="39" rx="3" ry="1.4" transform="rotate(-25 46.5 39)" />
        <ellipse cx="43" cy="44" rx="2.8" ry="1.3" transform="rotate(-50 43 44)" />
      </g>

      {/* Inner Medallion */}
      <circle cx="32" cy="33" r="14" fill="url(#bronze-inner)" stroke="#7C2D12" strokeWidth="1" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#FED7AA" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.8" />

      {/* Shimmer Light Reflection */}
      <path
        d="M23 26 C25 22 39 22 41 26 C37 24 27 24 23 26 Z"
        fill="#FFFFFF"
        opacity="0.45"
      />

      {/* Vector Bold Numeral "3" */}
      <path
        d="M26 21 L37.5 21 L37.5 24 L32.5 29 C35.5 29.5 38 31.5 38 35 C38 39 35 42 31.5 42 C28 42 25.5 39.8 25.5 36.5 L28.5 36.5 C28.5 38.2 29.8 39.5 31.5 39.5 C33.2 39.5 35 38.2 35 35.5 C35 32.8 33.2 31.5 31 31.5 L29.5 31.5 L29.5 28.5 L33.5 24 L26 24 Z"
        fill="#431407"
      />

      {/* Top Star Accent */}
      <g filter="url(#bronze-shadow)">
        <polygon
          points="32,6 34.5,12 41,12.5 36,17 37.5,23.5 32,20 26.5,23.5 28,17 23,12.5 29.5,12"
          fill="url(#bronze-star)"
          stroke="#7C2D12"
          strokeWidth="0.75"
        />
        <circle cx="32" cy="15" r="1" fill="#FFFFFF" />
      </g>
    </svg>
  )
}
