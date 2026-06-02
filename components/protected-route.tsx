"use client"

import type React from "react"
import { cloneElement, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { User } from "@/lib/types"

interface ProtectedRouteProps {
  children: React.ReactElement
  allowedRoles: Array<"super_admin" | "admin" | "supervisor" | "viewer" | "stats">
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setError("You need to sign in to continue.")
      setTimeout(() => router.push("/login"), 1500)
      return
    }

    if (!allowedRoles.includes(user.role)) {
      setError("You don't have permission to access this page.")
      setTimeout(() => router.push("/login"), 1500)
      return
    }
  }, [user, loading, router, allowedRoles])

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
