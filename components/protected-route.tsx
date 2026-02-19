"use client"

import type React from "react"
import { cloneElement } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

interface ProtectedRouteProps {
  children: React.ReactElement
  allowedRoles: Array<"super_admin" | "admin" | "supervisor" | "viewer" | "stats">
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })

        if (!response.ok) {
          if (isMounted) {
            setError("You need to sign in to continue.")
            setTimeout(() => router.push("/login"), 1500)
          }
          return
        }

        const data = (await response.json()) as { user?: User }
        const sessionUser = data.user

        if (!sessionUser) {
          if (isMounted) {
            setError("User profile not found. Please contact an administrator.")
            setTimeout(() => router.push("/login"), 1500)
          }
          return
        }

        if (!allowedRoles.includes(sessionUser.role)) {
          if (isMounted) {
            setError("You don't have permission to access this page.")
            setTimeout(() => router.push("/login"), 1500)
          }
          return
        }

        if (isMounted) {
          setUser(sessionUser)
          setLoading(false)
        }
      } catch (err) {
        console.error("[auth] Failed to verify session", err)
        if (isMounted) {
          setError("An unexpected error occurred. Please try again.")
          setTimeout(() => router.push("/login"), 1500)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, allowedRoles])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return cloneElement(children, { currentUser: user })
}
