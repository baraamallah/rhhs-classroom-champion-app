"use client"

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
import { LayoutDashboard, LogOut, Sun, Moon, User, LogIn, Info } from "lucide-react"
import { useTheme } from "next-themes"
import { m } from "framer-motion"
import { WinnersLink } from "@/components/layout/winners-link"
import { useAuth } from "@/components/providers/auth-provider"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { cn } from "@/lib/utils"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()
  const { user: authUser, loading, refresh } = useAuth()
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
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Super Admin</span>
      case "admin":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Admin</span>
      case "supervisor":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">Supervisor</span>
      case "stats":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">Statistics</span>
      default:
        return null
    }
  }

  return (
    <LazyMotionProvider>
      <m.header
        className="sticky top-0 z-50 border-b border-border/60 bg-background/80 dark:bg-card/85 backdrop-blur-md transition-colors duration-200"
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="container mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Brand Logo & Title */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 group shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-0.5"
              aria-label="RHHS ECO Club Home"
            >
              <div className="relative">
                <m.div
                  className="h-9 w-9 sm:h-11 sm:w-11 rounded-full p-1 bg-white dark:bg-muted/40 shadow-sm border border-emerald-500/20 group-hover:border-emerald-500/50 flex items-center justify-center transition-all duration-300 group-hover:shadow-emerald-500/20 group-hover:shadow-md"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                >
                  <Image
                    src="/Eco Champ.png"
                    alt="RHHS Eco Champ Logo"
                    width={44}
                    height={44}
                    className="h-full w-full object-contain drop-shadow-xs"
                    priority
                  />
                </m.div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-xl font-black tracking-tight bg-linear-to-r from-emerald-600 via-primary to-green-600 bg-clip-text text-transparent leading-none">
                    RHHS ECO Club
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                    Classroom Champion
                  </span>
                </div>
              </div>
            </Link>

            {/* Main Navigation & User Actions */}
            <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0" aria-label="Main Navigation">
              {/* Leaderboard Link */}
              <Link
                href="/"
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hidden sm:inline-flex items-center gap-1",
                  pathname === "/"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Leaderboard
              </Link>

              {/* Winners Pill Button */}
              <WinnersLink showOnMobile={true} />

              {/* About Us Link */}
              <Link
                href="/about"
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1",
                  pathname === "/about"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Info className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">About Us</span>
              </Link>

              {/* Direct Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* User / Auth Menu */}
              {!loading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border-border/80 hover:border-primary/50 gap-1.5 bg-card/60 shadow-2xs text-xs sm:text-sm font-medium"
                          aria-label="User menu"
                        >
                          <div className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span className="max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline-block">
                            {user.name || "User"}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-border/80">
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
                        <DropdownMenuItem
                          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                          className="rounded-lg cursor-pointer py-2 sm:hidden"
                        >
                          {theme === "light" ? (
                            <>
                              <Moon className="h-4 w-4 mr-2" />
                              <span>Dark Mode</span>
                            </>
                          ) : (
                            <>
                              <Sun className="h-4 w-4 mr-2" />
                              <span>Light Mode</span>
                            </>
                          )}
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
                    <div className="flex items-center gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-9 px-3 rounded-full border-border/80 hover:border-primary/50 text-xs sm:text-sm font-medium gap-1.5 shadow-2xs"
                      >
                        <Link href="/login">
                          <LogIn className="h-3.5 w-3.5 text-primary" />
                          <span>Login</span>
                        </Link>
                      </Button>
                      <div className="sm:hidden">
                        <ThemeToggle />
                      </div>
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </m.header>
    </LazyMotionProvider>
  )
}

