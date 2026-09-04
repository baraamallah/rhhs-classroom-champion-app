"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Sun, Moon, User as UserIcon, Home } from "lucide-react"
import { useTheme } from "next-themes"
import type { User } from "@/lib/types"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()

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
    }
  }

  return (
    <header className="border-b border-border bg-white/90 dark:bg-card/85 backdrop-blur-md sticky top-0 z-50 shadow-xs h-(--app-header-height) flex items-center">
      <div className="container mx-auto px-2.5 xs:px-3 sm:px-4 w-full">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Image 
                src="/Eco Champ.png" 
                alt="Eco Champ Logo" 
                width={40} 
                height={40} 
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm xs:text-base sm:text-xl font-bold text-foreground truncate leading-tight">RHHS ECO Club</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {user.role === "super_admin" || user.role === "admin" ? "Admin Dashboard" :
                 user.role === "stats" ? "Stats & Analytics Portal" : "Supervisor Dashboard"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 px-2.5 sm:px-3.5 rounded-xl border-border/80 hover:border-primary/50 gap-1.5 shadow-2xs">
                  <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                  <span className="hidden sm:inline font-medium">{user.name || "User"}</span>
                  <span className="sm:hidden truncate max-w-17.5 xs:max-w-30 font-medium">{user.name?.split(' ')[0] || "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Home
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
          </div>
        </div>
      </div>
    </header>
  )
}
