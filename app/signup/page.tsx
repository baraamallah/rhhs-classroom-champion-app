"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeafIcon } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch("/api/users/first", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setIsFirstUser(Boolean(data.isFirstUser))
        } else {
          setIsFirstUser(false)
        }
      } catch (err) {
        console.error("Error checking user count:", err)
        setIsFirstUser(false)
      }
    }

    checkFirstUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!isFirstUser) {
      setError("Account creation is disabled. Please contact an administrator to create your account.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/users/first", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to create account" }))
        throw new Error(data.error || "Failed to create account")
      }

      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "Failed to create account")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <LeafIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ECO Club</h1>
                <p className="text-xs text-muted-foreground">Classroom Champion</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <LeafIcon className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {isFirstUser === null ? "Loading..." : isFirstUser ? "Create Super Admin Account" : "Account Creation Disabled"}
              </CardTitle>
              <CardDescription>
                {isFirstUser === null
                  ? "Checking system status..."
                  : isFirstUser
                    ? "You are the first user and will become the super admin"
                    : "Account creation is disabled. Please contact an administrator."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {isFirstUser === false && (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Account creation is disabled. Please contact an administrator to create your account.
                    </p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || isFirstUser === false}>
                  {loading ? "Creating Account..." : isFirstUser ? "Create Super Admin Account" : "Sign Up Disabled"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-sm text-muted-foreground">Already have an account? </span>
                <Button variant="link" asChild className="p-0 h-auto">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
