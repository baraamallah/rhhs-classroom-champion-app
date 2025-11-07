"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LeafIcon } from "@/components/icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LayoutDashboard, LogOut, Sun, Moon, User } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function Header() {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const [user, setUser] = useState<{ id: string; role: string; name?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser({ id: data.user.id, role: data.user.role, name: data.user.name })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("[auth] Failed to load session", error)
        setUser(null)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[auth] Logout failed", error)
    }
    setUser(null)
    router.push("/")
    router.refresh()
  }

  const getControlPanelLink = () => {
    if (!user) return "/"
    if (user.role === "super_admin" || user.role === "admin") return "/admin"
    if (user.role === "supervisor") return "/supervisor"
    return "/"
  }

  return (
    <motion.header 
      className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <LeafIcon className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">ECO Club</h1>
              <p className="text-xs text-muted-foreground">Classroom Champion</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                        <Button variant="outline" size="sm">
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
    </motion.header>
  )
}
