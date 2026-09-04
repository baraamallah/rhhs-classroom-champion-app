import type React from "react"

/**
 * 1st Place Grand Eco Champion Emblem
 * Creative eco-badge featuring a radiant gold medallion, lush emerald laurel wreath,
 * sprouting three-leaf eco crown with dewdrop jewel, and emerald-gold ribbons.
 */
export function FirstPlaceLogo({ className = "w-12 h-12", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="1st Place Eco Champion"
      {...props}
    >
      <defs>
        {/* Eco-Emerald Ribbon Gradients */}
        <linearGradient id="eco1-ribbon-l" x1="16" y1="36" x2="26" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="eco1-ribbon-r" x1="48" y1="36" x2="38" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>

        {/* Outer Radiant Gold Sunburst */}
        <radialGradient id="eco1-outer-gold" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>

        {/* Inner Emerald-Gold Medallion Core */}
        <radialGradient id="eco1-inner-core" cx="42%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="25%" stopColor="#A7F3D0" />
          <stop offset="55%" stopColor="#10B981" />
          <stop offset="85%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>

        {/* Eco-Crown Botanical Gradient */}
        <linearGradient id="eco1-crown-grad" x1="20" y1="4" x2="44" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Leaf Green Highlight */}
        <linearGradient id="eco1-leaf-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Soft Drop Shadow */}
        <filter id="eco1-shadow" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#064E3B" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Emerald Ribbon Tails with Golden Trim */}
      <g filter="url(#eco1-shadow)">
        <path
          d="M24 38 L15 58 L23 54 L28 44 Z"
          fill="url(#eco1-ribbon-l)"
          stroke="#F59E0B"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Ribbon leaf vein */}
        <path d="M20 44 L20 53" stroke="#34D399" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />

        <path
          d="M40 38 L49 58 L41 54 L36 44 Z"
          fill="url(#eco1-ribbon-r)"
          stroke="#F59E0B"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Ribbon leaf vein */}
        <path d="M44 44 L44 53" stroke="#6EE7B7" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Outer Solar Gold Base */}
      <circle
        cx="32"
        cy="33"
        r="19"
        fill="url(#eco1-outer-gold)"
        filter="url(#eco1-shadow)"
        stroke="#FEF08A"
        strokeWidth="1.2"
      />

      {/* Living Eco-Laurel Wreath (Alternating Gold & Emerald Leaves) */}
      <g>
        {/* Left Laurel Leaves */}
        <ellipse cx="17.5" cy="27" rx="3.2" ry="1.5" fill="#34D399" stroke="#065F46" strokeWidth="0.5" transform="rotate(-30 17.5 27)" />
        <ellipse cx="15.8" cy="33" rx="3.4" ry="1.5" fill="url(#eco1-leaf-gold)" stroke="#78350F" strokeWidth="0.5" transform="rotate(-5 15.8 33)" />
        <ellipse cx="17.5" cy="39" rx="3.2" ry="1.5" fill="#10B981" stroke="#064E3B" strokeWidth="0.5" transform="rotate(25 17.5 39)" />
        <ellipse cx="21" cy="44.5" rx="3" ry="1.4" fill="url(#eco1-leaf-gold)" stroke="#78350F" strokeWidth="0.5" transform="rotate(50 21 44.5)" />

        {/* Right Laurel Leaves */}
        <ellipse cx="46.5" cy="27" rx="3.2" ry="1.5" fill="#34D399" stroke="#065F46" strokeWidth="0.5" transform="rotate(30 46.5 27)" />
        <ellipse cx="48.2" cy="33" rx="3.4" ry="1.5" fill="url(#eco1-leaf-gold)" stroke="#78350F" strokeWidth="0.5" transform="rotate(5 48.2 33)" />
        <ellipse cx="46.5" cy="39" rx="3.2" ry="1.5" fill="#10B981" stroke="#064E3B" strokeWidth="0.5" transform="rotate(-25 46.5 39)" />
        <ellipse cx="43" cy="44.5" rx="3" ry="1.4" fill="url(#eco1-leaf-gold)" stroke="#78350F" strokeWidth="0.5" transform="rotate(-50 43 44.5)" />
      </g>

      {/* Inner Emerald Core Medallion */}
      <circle cx="32" cy="33" r="14" fill="url(#eco1-inner-core)" stroke="#FDE047" strokeWidth="1" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#6EE7B7" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.9" />

      {/* Glass Specular Reflection */}
      <path
        d="M23 26 C25 21 39 21 41 26 C37 23.5 27 23.5 23 26 Z"
        fill="#FFFFFF"
        opacity="0.55"
      />

      {/* Center 3D Gold Numeral "1" */}
      <g>
        {/* Shadow */}
        <path
          d="M28.5 26 L34 22.5 L35 22.5 L35 41 L38.5 41 L38.5 43.5 L26.5 43.5 L26.5 41 L30 41 L30 26.5 L28.5 27.5 Z"
          fill="#064E3B"
          opacity="0.4"
        />
        {/* Face */}
        <path
          d="M28 25 L33.5 21.5 L34.5 21.5 L34.5 40.5 L38 40.5 L38 43 L26 43 L26 40.5 L29.5 40.5 L29.5 25.5 L28 26.5 Z"
          fill="#FFFBEB"
          stroke="#78350F"
          strokeWidth="0.6"
        />
        {/* Bevel highlight */}
        <path
          d="M29.5 25.5 L33.5 22.5 L33.5 40.5 L30.5 40.5 Z"
          fill="#FDE68A"
        />
      </g>

      {/* Sprouting Eco-Crown (3 Flourishing Leaves + Emerald Gem) */}
      <g filter="url(#eco1-shadow)">
        {/* Center Main Sprout Leaf */}
        <path
          d="M32 6 C30 11 31 16 32 16 C33 16 34 11 32 6 Z"
          fill="#10B981"
          stroke="#F59E0B"
          strokeWidth="0.7"
        />
        {/* Left Crown Sprout */}
        <path
          d="M24 12 C25 15 28 16 30 16 C28 14 26 11 24 12 Z"
          fill="url(#eco1-crown-grad)"
          stroke="#065F46"
          strokeWidth="0.6"
        />
        {/* Right Crown Sprout */}
        <path
          d="M40 12 C39 15 36 16 34 16 C36 14 38 11 40 12 Z"
          fill="url(#eco1-crown-grad)"
          stroke="#065F46"
          strokeWidth="0.6"
        />
        {/* Crown Base Band */}
        <rect x="23" y="15" width="18" height="2.5" rx="1" fill="#FEF08A" stroke="#78350F" strokeWidth="0.6" />
        {/* Dewdrop / Diamond Accents */}
        <circle cx="32" cy="7" r="1.3" fill="#34D399" stroke="#FFFFFF" strokeWidth="0.4" />
        <circle cx="23.5" cy="12" r="1.1" fill="#FBBF24" />
        <circle cx="40.5" cy="12" r="1.1" fill="#FBBF24" />
        <circle cx="32" cy="16.2" r="0.8" fill="#10B981" />
      </g>
    </svg>
  )
}

/**
 * 2nd Place Jade & Platinum Eco Vanguard Emblem
 * Creative eco-badge featuring a gleaming platinum-silver medallion, cool jade/mint foliage wreath,
 * sprouting twin silver-mint leaf crest, and seafoam teal ribbons.
 */
export function SecondPlaceLogo({ className = "w-12 h-12", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="2nd Place Eco Vanguard"
      {...props}
    >
      <defs>
        {/* Jade-Teal Ribbon Gradients */}
        <linearGradient id="eco2-ribbon-l" x1="16" y1="36" x2="26" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="50%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="eco2-ribbon-r" x1="48" y1="36" x2="38" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="50%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#134E4A" />
        </linearGradient>

        {/* Outer Lustrous Silver Gradient */}
        <radialGradient id="eco2-outer-silver" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E2E8F0" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>

        {/* Inner Platinum-Jade Medallion Core */}
        <radialGradient id="eco2-inner-core" cx="42%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#F0FDFA" />
          <stop offset="30%" stopColor="#CCFBF1" />
          <stop offset="65%" stopColor="#5EEAD4" />
          <stop offset="85%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#134E4A" />
        </radialGradient>

        {/* Silver Leaf Gradient */}
        <linearGradient id="eco2-silver-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Soft Drop Shadow */}
        <filter id="eco2-shadow" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#134E4A" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Jade/Teal Ribbons with Platinum Borders */}
      <g filter="url(#eco2-shadow)">
        <path
          d="M24 38 L15 58 L23 54 L28 44 Z"
          fill="url(#eco2-ribbon-l)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M20 44 L20 53" stroke="#99F6E4" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />

        <path
          d="M40 38 L49 58 L41 54 L36 44 Z"
          fill="url(#eco2-ribbon-r)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M44 44 L44 53" stroke="#CCFBF1" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Outer Platinum Base */}
      <circle
        cx="32"
        cy="33"
        r="19"
        fill="url(#eco2-outer-silver)"
        filter="url(#eco2-shadow)"
        stroke="#FFFFFF"
        strokeWidth="1.2"
      />

      {/* Living Silver & Mint Foliage Wreath */}
      <g>
        {/* Left Leaves */}
        <ellipse cx="17.5" cy="27" rx="3.2" ry="1.5" fill="#2DD4BF" stroke="#115E59" strokeWidth="0.5" transform="rotate(-30 17.5 27)" />
        <ellipse cx="15.8" cy="33" rx="3.4" ry="1.5" fill="url(#eco2-silver-leaf)" stroke="#475569" strokeWidth="0.5" transform="rotate(-5 15.8 33)" />
        <ellipse cx="17.5" cy="39" rx="3.2" ry="1.5" fill="#14B8A6" stroke="#0F766E" strokeWidth="0.5" transform="rotate(25 17.5 39)" />
        <ellipse cx="21" cy="44.5" rx="3" ry="1.4" fill="url(#eco2-silver-leaf)" stroke="#475569" strokeWidth="0.5" transform="rotate(50 21 44.5)" />

        {/* Right Leaves */}
        <ellipse cx="46.5" cy="27" rx="3.2" ry="1.5" fill="#2DD4BF" stroke="#115E59" strokeWidth="0.5" transform="rotate(30 46.5 27)" />
        <ellipse cx="48.2" cy="33" rx="3.4" ry="1.5" fill="url(#eco2-silver-leaf)" stroke="#475569" strokeWidth="0.5" transform="rotate(5 48.2 33)" />
        <ellipse cx="46.5" cy="39" rx="3.2" ry="1.5" fill="#14B8A6" stroke="#0F766E" strokeWidth="0.5" transform="rotate(-25 46.5 39)" />
        <ellipse cx="43" cy="44.5" rx="3" ry="1.4" fill="url(#eco2-silver-leaf)" stroke="#475569" strokeWidth="0.5" transform="rotate(-50 43 44.5)" />
      </g>

      {/* Inner Platinum-Jade Medallion */}
      <circle cx="32" cy="33" r="14" fill="url(#eco2-inner-core)" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#99F6E4" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.9" />

      {/* Shimmer Light Reflection */}
      <path
        d="M23 26 C25 21 39 21 41 26 C37 23.5 27 23.5 23 26 Z"
        fill="#FFFFFF"
        opacity="0.6"
      />

      {/* Vector 3D Bold Numeral "2" */}
      <g>
        {/* Shadow */}
        <path
          d="M26.5 27 C26.5 22.5 29 20.5 32.5 20.5 C36 20.5 38.5 22.5 38.5 25.5 C38.5 28.5 36 31.5 32.5 35 L29 38.5 L39 38.5 L39 42.5 L26 42.5 L26 39 L32.5 32.5 C35 30 35.5 28.5 35.5 26 C35.5 24 34.3 23 32.5 23 C30.7 23 29.5 24.3 29.5 26.5 Z"
          fill="#134E4A"
          opacity="0.35"
        />
        {/* Face */}
        <path
          d="M26 26.5 C26 22 28.5 20 32 20 C35.5 20 38 22 38 25 C38 28 35.5 31 32 34.5 L28.5 38 L38.5 38 L38.5 42 L25.5 42 L25.5 38.5 L32 32 C34.5 29.5 35 28 35 25.5 C35 23.5 33.8 22.5 32 22.5 C30.2 22.5 29 23.8 29 26 Z"
          fill="#FFFFFF"
          stroke="#334155"
          strokeWidth="0.6"
        />
        {/* Highlight */}
        <path
          d="M28.5 26 C28.5 23 30.5 21 32 21 C34.5 21 36.5 22.5 36.5 24.5 C36.5 26.5 34.5 29 32 31.5 L27.5 36 L27.5 38.5 L37 38.5 L37 40 L27 40 Z"
          fill="#CCFBF1"
          opacity="0.6"
        />
      </g>

      {/* Top Sprouting Leaf Crest */}
      <g filter="url(#eco2-shadow)">
        <path
          d="M32 7 C29 11 30 16 32 16 C34 16 35 11 32 7 Z"
          fill="#2DD4BF"
          stroke="#0F766E"
          strokeWidth="0.7"
        />
        <path
          d="M26 11 C27 14 29 15 31 15 C29 13 28 11 26 11 Z"
          fill="url(#eco2-silver-leaf)"
          stroke="#475569"
          strokeWidth="0.6"
        />
        <path
          d="M38 11 C37 14 35 15 33 15 C35 13 36 11 38 11 Z"
          fill="url(#eco2-silver-leaf)"
          stroke="#475569"
          strokeWidth="0.6"
        />
        <rect x="23" y="15" width="18" height="2.5" rx="1" fill="#E2E8F0" stroke="#475569" strokeWidth="0.6" />
        <circle cx="32" cy="8" r="1.3" fill="#FFFFFF" stroke="#0D9488" strokeWidth="0.4" />
        <circle cx="24" cy="11.5" r="1" fill="#5EEAD4" />
        <circle cx="40" cy="11.5" r="1" fill="#5EEAD4" />
      </g>
    </svg>
  )
}

/**
 * 3rd Place Earth & Oak Eco Pioneer Emblem
 * Creative eco-badge featuring warm burnished bronze medallion, earthy forest oak/laurel wreath,
 * golden acorn eco-sprout crest, and warm copper-forest ribbons.
 */
export function ThirdPlaceLogo({ className = "w-12 h-12", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="3rd Place Eco Pioneer"
      {...props}
    >
      <defs>
        {/* Earth & Forest Ribbon Gradients */}
        <linearGradient id="eco3-ribbon-l" x1="16" y1="36" x2="26" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="50%" stopColor="#166534" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>
        <linearGradient id="eco3-ribbon-r" x1="48" y1="36" x2="38" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="50%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>

        {/* Outer Warm Bronze Sunburst */}
        <radialGradient id="eco3-outer-bronze" cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="35%" stopColor="#F97316" />
          <stop offset="70%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#7C2D12" />
        </radialGradient>

        {/* Inner Amber-Earth Medallion Core */}
        <radialGradient id="eco3-inner-core" cx="42%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="30%" stopColor="#FDE68A" />
          <stop offset="65%" stopColor="#D97706" />
          <stop offset="85%" stopColor="#9A3412" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>

        {/* Earth Oak Leaf Gradient */}
        <linearGradient id="eco3-leaf-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>

        {/* Soft Drop Shadow */}
        <filter id="eco3-shadow" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#431407" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Earthy Forest & Copper Ribbons */}
      <g filter="url(#eco3-shadow)">
        <path
          d="M24 38 L15 58 L23 54 L28 44 Z"
          fill="url(#eco3-ribbon-l)"
          stroke="#FDBA74"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M20 44 L20 53" stroke="#4ADE80" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />

        <path
          d="M40 38 L49 58 L41 54 L36 44 Z"
          fill="url(#eco3-ribbon-r)"
          stroke="#FDBA74"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M44 44 L44 53" stroke="#FED7AA" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Outer Bronze Medallion Base */}
      <circle
        cx="32"
        cy="33"
        r="19"
        fill="url(#eco3-outer-bronze)"
        filter="url(#eco3-shadow)"
        stroke="#FED7AA"
        strokeWidth="1.2"
      />

      {/* Botanical Oak & Forest Laurel Wreath */}
      <g>
        {/* Left Leaves */}
        <ellipse cx="17.5" cy="27" rx="3.2" ry="1.5" fill="#16A34A" stroke="#14532D" strokeWidth="0.5" transform="rotate(-30 17.5 27)" />
        <ellipse cx="15.8" cy="33" rx="3.4" ry="1.5" fill="url(#eco3-leaf-bronze)" stroke="#7C2D12" strokeWidth="0.5" transform="rotate(-5 15.8 33)" />
        <ellipse cx="17.5" cy="39" rx="3.2" ry="1.5" fill="#22C55E" stroke="#166534" strokeWidth="0.5" transform="rotate(25 17.5 39)" />
        <ellipse cx="21" cy="44.5" rx="3" ry="1.4" fill="url(#eco3-leaf-bronze)" stroke="#7C2D12" strokeWidth="0.5" transform="rotate(50 21 44.5)" />

        {/* Right Leaves */}
        <ellipse cx="46.5" cy="27" rx="3.2" ry="1.5" fill="#16A34A" stroke="#14532D" strokeWidth="0.5" transform="rotate(30 46.5 27)" />
        <ellipse cx="48.2" cy="33" rx="3.4" ry="1.5" fill="url(#eco3-leaf-bronze)" stroke="#7C2D12" strokeWidth="0.5" transform="rotate(5 48.2 33)" />
        <ellipse cx="46.5" cy="39" rx="3.2" ry="1.5" fill="#22C55E" stroke="#166534" strokeWidth="0.5" transform="rotate(-25 46.5 39)" />
        <ellipse cx="43" cy="44.5" rx="3" ry="1.4" fill="url(#eco3-leaf-bronze)" stroke="#7C2D12" strokeWidth="0.5" transform="rotate(-50 43 44.5)" />
      </g>

      {/* Inner Amber-Earth Core */}
      <circle cx="32" cy="33" r="14" fill="url(#eco3-inner-core)" stroke="#FED7AA" strokeWidth="1" />
      <circle cx="32" cy="33" r="12.5" fill="none" stroke="#FDE68A" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.9" />

      {/* Shimmer Light Reflection */}
      <path
        d="M23 26 C25 21 39 21 41 26 C37 23.5 27 23.5 23 26 Z"
        fill="#FFFFFF"
        opacity="0.5"
      />

      {/* Vector 3D Bold Numeral "3" */}
      <g>
        {/* Shadow */}
        <path
          d="M26.5 21.5 L38 21.5 L38 24.5 L33 29.5 C36 30 38.5 32 38.5 35.5 C38.5 39.5 35.5 42.5 32 42.5 C28.5 42.5 26 40.3 26 37 L29 37 C29 38.7 30.3 40 32 40 C33.7 40 35.5 38.7 35.5 36 C35.5 33.3 33.7 32 31.5 32 L30 32 L30 29 L34 24.5 L26.5 24.5 Z"
          fill="#431407"
          opacity="0.4"
        />
        {/* Face */}
        <path
          d="M26 21 L37.5 21 L37.5 24 L32.5 29 C35.5 29.5 38 31.5 38 35 C38 39 35 42 31.5 42 C28 42 25.5 39.8 25.5 36.5 L28.5 36.5 C28.5 38.2 29.8 39.5 31.5 39.5 C33.2 39.5 35 38.2 35 35.5 C35 32.8 33.2 31.5 31 31.5 L29.5 31.5 L29.5 28.5 L33.5 24 L26 24 Z"
          fill="#FFFBEB"
          stroke="#7C2D12"
          strokeWidth="0.6"
        />
        {/* Highlight */}
        <path
          d="M27 22 L36.5 22 L32 27 L31 29 C34 29.5 36.5 31.5 36.5 35 C36.5 38 34.5 40.5 32 40.5 C30 40.5 28.5 39 28.5 37 L27 37 Z"
          fill="#FED7AA"
          opacity="0.6"
        />
      </g>

      {/* Top Sprouting Acorn/Leaf Crest */}
      <g filter="url(#eco3-shadow)">
        <path
          d="M32 7 C29 11 30 16 32 16 C34 16 35 11 32 7 Z"
          fill="#EA580C"
          stroke="#7C2D12"
          strokeWidth="0.7"
        />
        <path
          d="M26 11 C27 14 29 15 31 15 C29 13 28 11 26 11 Z"
          fill="#16A34A"
          stroke="#14532D"
          strokeWidth="0.6"
        />
        <path
          d="M38 11 C37 14 35 15 33 15 C35 13 36 11 38 11 Z"
          fill="#16A34A"
          stroke="#14532D"
          strokeWidth="0.6"
        />
        <rect x="23" y="15" width="18" height="2.5" rx="1" fill="#FED7AA" stroke="#7C2D12" strokeWidth="0.6" />
        <circle cx="32" cy="8" r="1.3" fill="#FED7AA" stroke="#9A3412" strokeWidth="0.4" />
        <circle cx="24" cy="11.5" r="1" fill="#4ADE80" />
        <circle cx="40" cy="11.5" r="1" fill="#4ADE80" />
      </g>
    </svg>
  )
}
