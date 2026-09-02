"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LayoutDashboard, LogOut, Sun, Moon, User } from "lucide-react"
import { useTheme } from "next-themes"
import { m } from "framer-motion"
import { WinnersLink } from "@/components/layout/winners-link"
import { useAuth } from "@/components/providers/auth-provider"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

export function Header() {
  const router = useRouter()
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

  return (
    <LazyMotionProvider>
      <m.header
        className="border-b border-border bg-white dark:bg-card/80 backdrop-blur-sm sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group shrink-0" aria-label="RHHS ECO Club Home">
              <m.div
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image 
                  src="/Eco Champ.png" 
                  alt="RHHS Eco Champ Logo" 
                  width={40} 
                  height={40} 
                  className="h-full w-full object-contain"
                  priority
                />
              </m.div>
              <div>
                <span className="text-sm sm:text-xl font-bold bg-linear-to-r from-primary to-green-600 bg-clip-text text-transparent leading-tight whitespace-nowrap block">
                  RHHS ECO Club
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Classroom Champion
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar" aria-label="Main Navigation">
              <WinnersLink showOnMobile={true} className="mr-0 whitespace-nowrap text-xs sm:text-sm" />
              <Link href="/about" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                About Us
              </Link>
              {!loading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="User menu">
                          <User className="h-4 w-4 mr-2" />
                          {user.name || "User"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium">{user.name || "User"}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={getControlPanelLink()} className="flex items-center">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Control Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                          {theme === "light" ? (
                            <>
                              <Moon className="h-4 w-4 mr-2" />
                              Dark Mode
                            </>
                          ) : (
                            <>
                              <Sun className="h-4 w-4 mr-2" />
                              Light Mode
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" aria-label="Guest menu">
                            <User className="h-4 w-4 mr-2" />
                            Guest
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href="/login" className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Login
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                            {theme === "light" ? (
                              <>
                                <Moon className="h-4 w-4 mr-2" />
                                Dark Mode
                              </>
                            ) : (
                              <>
                                <Sun className="h-4 w-4 mr-2" />
                                Light Mode
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
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
