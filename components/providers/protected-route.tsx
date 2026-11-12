"use client"

import { EcoLoader } from "@/components/common/eco-loader"
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
      : !allowedRoles.map((r) => r.toLowerCase()).includes((user.role || "").toLowerCase() as any)
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
    return <EcoLoader fullScreen title="Welcome back" description="Preparing your school workspace." />
  }

  if (!user) {
    return null
  }

  return cloneElement(children, { currentUser: user })
}
