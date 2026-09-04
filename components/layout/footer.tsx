"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowUp } from "lucide-react"
import { useConsent } from "@/components/providers/consent-provider"

export function Footer() {
  const year = new Date().getFullYear()
  const { openModal } = useConsent()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  return (
    <footer className="border-t border-border/60 bg-white/75 dark:bg-card/80 backdrop-blur-md mt-auto transition-colors">
      <div className="container mx-auto px-4 pt-8 pb-[max(2rem,calc(var(--mobile-bottom-nav-height,0px)+0.5rem))] lg:pb-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Partner Logos Only (Clean without any text) */}
          <div className="flex items-center justify-center gap-5 sm:gap-12 flex-wrap">
            <a
              href="https://rhhs.edu.lb"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-transform hover:scale-105 duration-200 min-h-11 flex items-center"
              aria-label="Rafic Hariri High School Official Website"
            >
              <Image
                src="/rhhs-logo.png"
                alt="Rafic Hariri High School Logo"
                width={120}
                height={64}
                className="h-10 sm:h-14 w-auto object-contain opacity-85 group-hover:opacity-100 transition-opacity"
              />
            </a>

            <div className="transition-transform hover:scale-105 duration-200 min-h-11 flex items-center">
              <Image
                src="/rhi-logo.png"
                alt="Rafic Hariri Technical Institute Logo"
                width={120}
                height={64}
                className="h-10 sm:h-14 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
            </div>

            <div className="transition-transform hover:scale-105 duration-200 min-h-11 flex items-center">
              <Image
                src="/Eco Champ.png"
                alt="Eco Champ Logo"
                width={120}
                height={64}
                className="h-10 sm:h-14 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Simple, Professional Bottom Info */}
          <div className="w-full border-t border-border/40 pt-6 text-center space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              ECO Club Classroom Champion • Leading the way in sustainability and environmental impact.
            </p>

            {/* Legal Navigation & Preferences Modal Trigger */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-1 text-xs text-muted-foreground/90">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors min-h-11 inline-flex items-center px-1"
              >
                Privacy Policy
              </Link>
              <span className="text-border hidden xs:inline">•</span>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors min-h-11 inline-flex items-center px-1"
              >
                Terms of Service
              </Link>
              <span className="text-border hidden xs:inline">•</span>
              <Link
                href="/cookies"
                className="hover:text-foreground transition-colors min-h-11 inline-flex items-center px-1"
              >
                Cookie Policy
              </Link>
              <span className="text-border hidden xs:inline">•</span>
              <button
                onClick={openModal}
                className="hover:text-primary transition-colors cursor-pointer min-h-11 inline-flex items-center px-1 font-medium text-primary/90"
              >
                Cookie Settings
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-muted-foreground/80 pt-1">
              <p>© {year} All rights reserved to Rafic Hariri High School</p>
              <span className="hidden sm:inline">•</span>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Scroll back to top"
              >
                <span>Back to Top</span>
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
