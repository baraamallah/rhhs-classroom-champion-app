"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User as UserIcon, Home, LayoutDashboard } from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"

interface DashboardHeaderProps {
  user?: User | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll listener: Smooth autohide when scrolling down, reveal when scrolling up
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0
    let ticking = false

    const updateScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 10)

      if (currentScrollY <= 40) {
        setVisible(true)
        ticking = false
        return
      }

      const diff = currentScrollY - lastScrollY
      if (diff > 8 && currentScrollY > 64) {
        setVisible(false)
      } else if (diff < -8) {
        setVisible(true)
      }

      lastScrollY = currentScrollY > 0 ? currentScrollY : 0
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[auth] Failed to logout", error)
    } finally {
      router.push("/login")
      router.refresh()
    }
  }

  const roleText =
    user?.role === "super_admin" || user?.role === "admin"
      ? "Admin Dashboard"
      : user?.role === "stats"
      ? "Stats & Analytics Portal"
      : user?.role === "supervisor"
      ? "Supervisor Dashboard"
      : "Control Panel"

  return (
    <header
      className={cn(
        "border-b sticky top-0 z-50 h-16 flex items-center transition-all duration-300 ease-in-out backdrop-blur-xl",
        isScrolled
          ? "border-border/70 bg-background/80 dark:bg-card/85 shadow-md shadow-black/5 dark:shadow-black/20"
          : "border-border/40 bg-background/90 dark:bg-card/90 shadow-2xs",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="container mx-auto px-3 sm:px-6 w-full">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo & Context Title */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 transition-transform active:scale-95"
            aria-label="Back to Classroom Champion Home"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-1 bg-white dark:bg-muted/40 shadow-2xs border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Image
                src="/Eco Champ.png"
                alt="Eco Champ Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain drop-shadow-2xs"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm xs:text-base sm:text-lg font-black tracking-tight bg-linear-to-r from-emerald-600 via-primary to-green-600 bg-clip-text text-transparent truncate leading-tight">
                RHHS ECO Club
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">
                {roleText}
              </p>
            </div>
          </Link>

          {/* Right: Theme Toggle & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm h-9 px-2.5 sm:px-3 rounded-full border-border/80 hover:border-primary/50 gap-1.5 shadow-2xs bg-card/60 cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-3 w-3" />}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-32 truncate">{user?.name || "User"}</span>
                  <span className="sm:hidden truncate max-w-20 font-medium">
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-2 rounded-xl shadow-xl border-border/80"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ") || "Member"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/" className="flex items-center py-2">
                    <Home className="h-4 w-4 mr-2 text-primary" />
                    <span>Home Leaderboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
