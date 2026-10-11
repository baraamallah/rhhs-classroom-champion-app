"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeafIcon } from "@/components/common/icons"
import { Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Invalid email or password" }))
        throw new Error(data.error || "Invalid email or password")
      }

      const data = (await response.json()) as { role?: string }
      const role = data.role ? String(data.role).trim().toLowerCase() : ""

      // Check for redirect query param safely without triggering Suspense requirement
      let redirectParam: string | null = null
      if (typeof window !== "undefined") {
        redirectParam = new URLSearchParams(window.location.search).get("redirect")
      }

      // Explicitly map role to control panel destination
      let destination = "/"
      if (role === "super_admin" || role === "admin") {
        destination = redirectParam && redirectParam.startsWith("/admin") ? redirectParam : "/admin"
      } else if (role === "stats") {
        destination = redirectParam && redirectParam.startsWith("/admin/tracking") ? redirectParam : "/admin/tracking"
      } else if (role === "supervisor") {
        // Supervisors ALWAYS open their control panel directly
        destination = redirectParam && redirectParam.startsWith("/supervisor") ? redirectParam : "/supervisor"
      } else if (redirectParam && redirectParam.startsWith("/") && redirectParam !== "/login" && redirectParam !== "/") {
        destination = redirectParam
      }

      // Update auth context state in parallel
      await refresh().catch(() => {})

      // Use window.location.replace to ensure full session-cookie synchronization,
      // preventing any client router race conditions or accidental redirects to the leaderboard
      window.location.replace(destination)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Invalid email or password")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
            <LeafIcon className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent className="p-4 xs:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="your.email@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-12 min-h-11"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full min-w-11 px-3 py-2 hover:bg-transparent flex items-center justify-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full min-h-11 cursor-pointer font-semibold" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground font-medium mb-2">Note:</p>
          <p className="text-xs text-muted-foreground">
            User accounts are created by administrators only. Contact your admin if you need access.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
