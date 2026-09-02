"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@/lib/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include", signal })
      if (signal?.aborted) return
      if (response.ok) {
        const data = (await response.json()) as { user?: User }
        setUser(data.user || null)
      } else {
        setUser(null)
      }
    } catch {
      if (signal?.aborted) return
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchUser(controller.signal)
    return () => controller.abort()
  }, [fetchUser])

  const contextValue = useMemo(() => ({ user, loading, refresh: fetchUser }), [user, loading, fetchUser])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
