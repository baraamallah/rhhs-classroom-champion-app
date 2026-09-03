"use client"

import Image from "next/image"
import { ArrowUp } from "lucide-react"

export function Footer() {
  const year = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="border-t border-border/60 bg-white/75 dark:bg-card/80 backdrop-blur-md mt-auto transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Partner Logos Only (Clean without any text) */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            <a
              href="https://rhhs.edu.lb"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-transform hover:scale-105 duration-200"
              aria-label="Rafic Hariri High School Official Website"
            >
              <Image
                src="/rhhs-logo.png"
                alt="Rafic Hariri High School Logo"
                width={120}
                height={64}
                className="h-12 sm:h-14 w-auto object-contain opacity-85 group-hover:opacity-100 transition-opacity"
              />
            </a>

            <div className="transition-transform hover:scale-105 duration-200">
              <Image
                src="/rhi-logo.png"
                alt="Rafic Hariri Technical Institute Logo"
                width={120}
                height={64}
                className="h-12 sm:h-14 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
            </div>

            <div className="transition-transform hover:scale-105 duration-200">
              <Image
                src="/Eco Champ.png"
                alt="Eco Champ Logo"
                width={120}
                height={64}
                className="h-12 sm:h-14 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Simple, Professional Bottom Info */}
          <div className="w-full border-t border-border/40 pt-6 text-center space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              ECO Club Classroom Champion • Leading the way in sustainability and environmental impact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-muted-foreground/80">
              <p>© {year} All rights reserved to Rafic Hariri High School</p>
              <span className="hidden sm:inline">•</span>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Scroll back to top"
              >
                <span>Back to Top</span>
                <ArrowUp className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
