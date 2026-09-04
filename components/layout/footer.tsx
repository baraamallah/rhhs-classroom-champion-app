"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowUp, Code2 } from "lucide-react"
import { useConsent } from "@/components/providers/consent-provider"
import { InstagramIcon } from "@/components/common/icons"

export function Footer() {
  const pathname = usePathname()
  const year = new Date().getFullYear()
  const { openModal } = useConsent()

  const isDashboard = pathname?.startsWith("/admin") || pathname?.startsWith("/supervisor")

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer
      aria-label="Site Footer"
      className="border-t border-border/40 bg-background/80 dark:bg-card/50 backdrop-blur-md mt-auto transition-colors"
    >
      <div
        className={`container mx-auto px-4 max-w-5xl pt-8 ${isDashboard
          ? "pb-[calc(var(--mobile-bottom-nav-height,3.75rem)+1rem)] lg:pb-8"
          : "pb-8"
          }`}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* Partner Logos: Center Aligned */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14 flex-wrap">
            <a
              href="https://rhhs.edu.lb"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-105 min-h-11 flex items-center"
              aria-label="Rafic Hariri High School Official Website"
            >
              <Image
                src="/rhhs-logo.png"
                alt="Rafic Hariri High School Logo"
                width={120}
                height={54}
                className="h-8 xs:h-9 sm:h-11 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-2xs"
              />
            </a>

            <div className="transition-all duration-300 hover:scale-105 min-h-11 flex items-center">
              <Image
                src="/rhi-logo.png"
                alt="Rafic Hariri Technical Institute Logo"
                width={120}
                height={54}
                className="h-8 xs:h-9 sm:h-11 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity drop-shadow-2xs"
              />
            </div>

            <div className="transition-all duration-300 hover:scale-105 min-h-11 flex items-center">
              <Image
                src="/Eco Champ.png"
                alt="Eco Champ Logo"
                width={120}
                height={54}
                className="h-8 xs:h-9 sm:h-11 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity drop-shadow-2xs"
              />
            </div>
          </div>

          {/* Center-Aligned Social & Developer Hub */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs">
            {/* Instagram: RHHS Official */}
            <a
              href="https://www.instagram.com/rhhs_saida/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400 transition-all text-muted-foreground min-h-9 font-medium shadow-2xs"
              aria-label="Follow RHHS Official on Instagram"
            >
              <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />
              <span>@rhhs_saida</span>
            </a>

            {/* Instagram: ECO Club */}
            <a
              href="https://www.instagram.com/ecoclubrhhs2526/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-muted-foreground min-h-9 font-medium shadow-2xs"
              aria-label="Follow RHHS ECO Club on Instagram"
            >
              <InstagramIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>@ecoclubrhhs2526</span>
            </a>

          </div>

          {/* Legal Utilities Strip (Center Aligned) */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground/80 pt-1">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors min-h-9 inline-flex items-center px-1"
            >
              Privacy
            </Link>
            <span className="text-border/80 select-none">·</span>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors min-h-9 inline-flex items-center px-1"
            >
              Terms
            </Link>
            <span className="text-border/80 select-none">·</span>
            <Link
              href="/cookies"
              className="hover:text-foreground transition-colors min-h-9 inline-flex items-center px-1"
            >
              Cookies
            </Link>
            <span className="text-border/80 select-none">·</span>
            <button
              type="button"
              onClick={openModal}
              className="hover:text-primary transition-colors cursor-pointer min-h-9 inline-flex items-center px-1 font-medium"
            >
              Cookie Settings
            </button>
          </div>

          {/* Copyright & Micro Back-to-Top (Center Aligned) */}
          <div className="w-full border-t border-border/30 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground/75">
            <p className="tracking-tight">
              © {year} Rafic Hariri High School. All rights reserved.
            </p>
            <span className="hidden sm:inline text-border/60">•</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/40 transition-all cursor-pointer min-h-9"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
