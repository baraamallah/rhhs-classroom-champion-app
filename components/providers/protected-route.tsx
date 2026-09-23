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
      <div className="min-h-screen bg-linear-to-b from-background via-background/95 to-primary/5 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        <div className="absolute top-1/3 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border border-emerald-500/20 border-t-emerald-500/80 animate-spin animation-duration-[4s] pointer-events-none" />
          <div className="absolute w-28 h-28 rounded-full border border-teal-500/25 border-b-teal-500/70 animate-spin animation-duration-[2.5s] direction-[reverse] pointer-events-none" />
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-border/80 shadow-2xl shadow-emerald-500/15 p-3 flex items-center justify-center ring-1 ring-emerald-500/20">
            <img
              src="/Eco Champ.png"
              alt="Loading"
              width={64}
              height={64}
              className="w-full h-full object-contain animate-pulse animation-duration-[2s]"
            />
          </div>
        </div>

        <div className="mt-6 text-center space-y-2 relative z-10">
          <p className="text-sm font-bold text-foreground">
            Verifying Authentication...
          </p>
          <div className="w-44 h-1.5 bg-muted/70 dark:bg-muted/40 rounded-full overflow-hidden p-px border border-border/50 relative shadow-inner mx-auto">
            <div className="h-full w-1/3 bg-linear-to-r from-emerald-500/10 via-emerald-500 to-emerald-500/10 rounded-full animate-indeterminate-slide" />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground/80 pt-1">
            Accessing secure school platform
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return cloneElement(children, { currentUser: user })
}
