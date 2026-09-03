"use client"

import type React from "react"
import { cloneElement, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import type { User } from "@/lib/types"

interface ProtectedRouteProps {
  children: React.ReactElement<{ currentUser?: User }>
  allowedRoles: Array<"super_admin" | "admin" | "supervisor" | "viewer" | "stats">
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const accessError = !loading
    ? !user
      ? "You need to sign in to continue."
      : !allowedRoles.includes(user.role)
        ? "You don't have permission to access this page."
        : null
    : null

  useEffect(() => {
    if (loading) return

    if (!accessError) return

    const redirectTimer = window.setTimeout(() => router.replace("/login"), 1500)
    return () => window.clearTimeout(redirectTimer)
  }, [accessError, loading, router])

  if (accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{accessError}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping opacity-50" />
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-card border border-border shadow-lg p-2.5 flex items-center justify-center">
            <img
              src="/Eco Champ.png"
              alt="Loading"
              width={48}
              height={48}
              className="w-full h-full object-contain animate-pulse"
            />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-muted-foreground animate-pulse">
          Verifying credentials...
        </p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return cloneElement(children, { currentUser: user })
}
