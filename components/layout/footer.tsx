"use client"

import Image from "next/image"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-white dark:bg-card/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center justify-center gap-8 sm:gap-12">
            <div className="flex items-center justify-center">
              <a
                href="https://rhhs.edu.lb"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <Image
                  src="/rhhs-logo.png"
                  alt="RHHS Logo"
                  width={120}
                  height={64}
                  className="h-12 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 sm:h-16"
                />
              </a>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/rhi-logo.png"
                alt="RHTI Logo"
                width={120}
                height={64}
                className="h-12 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 sm:h-16"
              />
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/Eco Champ.png"
                alt="Eco Champ"
                width={120}
                height={64}
                className="h-12 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 sm:h-16"
              />
            </div>
          </div>
          <div className="w-full border-t border-border/40 pt-6 mt-2 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              ECO Club Classroom Champion • Leading the way in sustainability and environmental impact.
            </p>
            <p className="text-xs text-muted-foreground/80">
              © {year} All rights reserved to Rafic Hariri High School
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
