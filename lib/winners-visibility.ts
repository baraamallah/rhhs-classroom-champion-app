/**
 * Client and server shared helper for managing Winners Page visibility state.
 * Prevents "Flash of Hidden Content" (FOUC) when the Winners page is hidden by the admin.
 */

const STORAGE_KEY = "rhhs_winners_page_visible"
const EVENT_NAME = "rhhs_winners_visibility_changed"

let memoryCache: boolean | null = null
let pendingPromise: Promise<boolean> | null = null
let lastFetchedTime = 0
const CACHE_TTL_MS = 60000 // 1 minute client cache

/**
 * Synchronously retrieves the cached winners page visibility.
 * Defaults to false so hidden tabs never flash into existence during initial render.
 */
export function getCachedWinnersVisibility(defaultVal = false): boolean {
  if (memoryCache !== null) return memoryCache

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        memoryCache = stored === "true"
        return memoryCache
      }
    } catch {
      // Ignore localStorage read errors (e.g. privacy mode)
    }
  }

  return defaultVal
}

/**
 * Updates the cached visibility and broadcasts the change to all open listeners/tabs.
 */
export function setCachedWinnersVisibility(visible: boolean) {
  memoryCache = visible
  lastFetchedTime = Date.now()

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, String(visible))
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: visible }))
    } catch {
      // Ignore localStorage write errors
    }
  }
}

/**
 * Subscribes to real-time visibility changes triggered within this tab or other tabs.
 */
export function onWinnersVisibilityChange(callback: (visible: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handler = (e: Event) => {
    const custom = e as CustomEvent<boolean>
    if (typeof custom.detail === "boolean") {
      callback(custom.detail)
    }
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue !== null) {
      const val = e.newValue === "true"
      memoryCache = val
      callback(val)
    }
  }

  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener("storage", storageHandler)

  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener("storage", storageHandler)
  }
}

/**
 * Deduplicated, throttled async fetcher for winners visibility.
 * Prevents multiple components (e.g. desktop + mobile WinnersLink + LeaderboardView)
 * from making redundant simultaneous server action RPCs.
 */
export async function fetchWinnersVisibility(forceRefresh = false): Promise<boolean> {
  const now = Date.now()

  if (!forceRefresh && memoryCache !== null && now - lastFetchedTime < CACHE_TTL_MS) {
    return memoryCache
  }

  if (pendingPromise) {
    return pendingPromise
  }

  pendingPromise = (async () => {
    try {
      const { getWinnersPageVisibility } = await import("@/app/actions/winners-page-actions")
      const result = await getWinnersPageVisibility()
      const isVisible = result.success && typeof result.visible === "boolean" ? result.visible : false
      setCachedWinnersVisibility(isVisible)
      return isVisible
    } catch {
      return memoryCache ?? false
    } finally {
      pendingPromise = null
    }
  })()

  return pendingPromise
}
