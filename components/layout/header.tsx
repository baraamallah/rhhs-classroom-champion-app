"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  Info,
  Menu,
  BarChart3,
} from "lucide-react"
import { WinnersLink } from "@/components/layout/winners-link"
import { useAuth } from "@/components/providers/auth-provider"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { cn } from "@/lib/utils"

export function Header({ winnersPageVisible }: { winnersPageVisible?: boolean } = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user: authUser, loading, refresh } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Reset visibility and close mobile menu on route change
  useEffect(() => {
    setVisible(true)
    setMobileMenuOpen(false)
  }, [pathname])

  // Scroll listener: Smooth autohide when scrolling down, reveal when scrolling up
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0
    let ticking = false

    const updateScroll = () => {
      const currentScrollY = window.scrollY

      // Subtle shadow & blur elevation on scroll
      setIsScrolled(currentScrollY > 10)

      // Always visible near top of page or if mobile menu is open
      if (currentScrollY <= 40 || mobileMenuOpen) {
        setVisible(true)
        ticking = false
        return
      }

      const diff = currentScrollY - lastScrollY

      // Scroll down by more than 8px past header -> hide smoothly
      if (diff > 8 && currentScrollY > 64) {
        setVisible(false)
      }
      // Scroll up by more than 8px -> reveal smoothly
      else if (diff < -8) {
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
  }, [mobileMenuOpen])

  // Synchronize CSS variable so sticky sub-elements (like division tabs) slide smoothly to top: 0
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--header-top-offset",
      visible ? "4rem" : "0rem"
    )
  }, [visible])

  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty("--header-top-offset", "4rem")
    }
  }, [])

  const user = authUser ? { id: authUser.id, role: authUser.role, name: authUser.name } : null

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[auth] Logout failed", error)
    }
    await refresh()
    router.push("/")
    router.refresh()
  }

  const getControlPanelLink = () => {
    if (!user) return "/"
    if (user.role === "super_admin" || user.role === "admin") return "/admin"
    if (user.role === "stats") return "/admin/tracking"
    if (user.role === "supervisor") return "/supervisor"
    return "/"
  }

  const getRoleBadge = (role?: string) => {
    if (!role) return null
    switch (role) {
      case "super_admin":
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Super Admin
          </span>
        )
      case "admin":
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Admin
          </span>
        )
      case "supervisor":
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            Supervisor
          </span>
        )
      case "stats":
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            Statistics
          </span>
        )
      default:
        return null
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full h-16 border-b transition-all duration-300 ease-in-out backdrop-blur-xl",
        isScrolled
          ? "border-border/70 bg-background/80 dark:bg-card/85 shadow-md shadow-black/5 dark:shadow-black/20"
          : "border-border/40 bg-background/90 dark:bg-card/90 shadow-2xs",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="container mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 group shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 transition-transform active:scale-95"
          aria-label="RHHS ECO Club Home"
        >
          <div className="relative shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-1 bg-white dark:bg-muted/40 shadow-2xs border border-emerald-500/20 group-hover:border-emerald-500/50 flex items-center justify-center transition-all duration-300 group-hover:shadow-emerald-500/20 group-hover:shadow-md">
              <Image
                src="/Eco Champ.png"
                alt="RHHS Eco Champ Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base md:text-lg font-black tracking-tight bg-linear-to-r from-emerald-600 via-primary to-green-600 bg-clip-text text-transparent leading-none whitespace-nowrap">
              RHHS ECO Club
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap">
                Classroom Champion
              </span>
            </div>
          </div>
        </Link>

        {/* Center: Desktop Navigation Pills */}
        <nav
          className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2 mx-auto"
          aria-label="Primary Navigation"
        >
          <Link
            href="/"
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all inline-flex items-center whitespace-nowrap",
              pathname === "/"
                ? "bg-primary/15 text-primary font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            Leaderboard
          </Link>

          <WinnersLink showOnMobile={false} initialVisible={winnersPageVisible} />

          <Link
            href="/about"
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all inline-flex items-center whitespace-nowrap",
              pathname === "/about"
                ? "bg-primary/15 text-primary font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            About Us
          </Link>
        </nav>

        {/* Right: Actions (Theme Toggle + User Dropdown / Login + Mobile Menu Trigger) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <ThemeToggle />

          {/* User Auth Controls */}
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2.5 sm:px-3 rounded-full border-border/80 hover:border-primary/50 gap-1.5 bg-card/60 shadow-2xs text-xs sm:text-sm font-medium cursor-pointer"
                      aria-label="User menu"
                    >
                      <div className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span className="max-w-24 sm:max-w-32 truncate hidden sm:inline-block font-medium">
                        {user.name || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 p-2 rounded-xl shadow-xl border-border/80"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="px-2 py-2">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name || "User"}</p>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href={getControlPanelLink()} className="flex items-center py-2">
                        <LayoutDashboard className="h-4 w-4 mr-2 text-primary" />
                        <span>Control Panel</span>
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
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-full border-border/80 hover:border-primary/50 text-xs sm:text-sm font-semibold gap-1.5 shadow-2xs bg-card/60 hover:bg-primary/10 hover:text-primary transition-all active:scale-95 cursor-pointer hidden sm:inline-flex"
                >
                  <Link href="/login" aria-label="Sign in to platform">
                    <LogIn className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Login</span>
                  </Link>
                </Button>
              )}
            </>
          )}

          {/* Mobile Navigation Drawer Trigger */}
          <div className="md:hidden flex items-center">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-muted/80 active:scale-95 cursor-pointer text-foreground"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-75 sm:w-87.5 p-0 flex flex-col justify-between"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-border/60">
                  <SheetHeader className="text-left space-y-1">
                    <SheetTitle className="text-base font-bold flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full p-0.5 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Image
                          src="/Eco Champ.png"
                          alt="Logo"
                          width={24}
                          height={24}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent font-black">
                        RHHS ECO Club
                      </span>
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground">
                      Classroom Champion Platform
                    </SheetDescription>
                  </SheetHeader>
                </div>

                {/* Drawer Navigation Links */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors",
                      pathname === "/"
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>Leaderboard</span>
                  </Link>

                  <WinnersLink
                    showOnMobile={true}
                    initialVisible={winnersPageVisible}
                    variant="text"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold hover:bg-amber-500/10 transition-colors"
                  />

                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors",
                      pathname === "/about"
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Info className="h-4 w-4 shrink-0" />
                    <span>About Us</span>
                  </Link>
                </div>

                {/* Drawer Footer with Account & Actions */}
                <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 px-2">
                        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-foreground">{user.name || "User"}</p>
                          <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                        </div>
                      </div>
                      <Button
                        asChild
                        className="w-full justify-start gap-2.5 rounded-xl text-sm font-medium"
                        variant="outline"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href={getControlPanelLink()}>
                          <LayoutDashboard className="h-4 w-4 text-primary" />
                          <span>Control Panel</span>
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start gap-2.5 rounded-xl text-sm font-medium cursor-pointer"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      asChild
                      className="w-full justify-center gap-2 rounded-xl text-sm font-semibold shadow-xs"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/login">
                        <LogIn className="h-4 w-4" />
                        <span>Sign In to Platform</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
