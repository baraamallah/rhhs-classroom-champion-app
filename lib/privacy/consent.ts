export interface PrivacyConsent {
  version: number
  necessary: true
  analytics: boolean
  functional: boolean
  updatedAt: string
}

export const CURRENT_CONSENT_VERSION = 1
export const CONSENT_STORAGE_KEY = 'rhhs_privacy_consent_v1'
export const CONSENT_CHANGE_EVENT = 'rhhs-consent-updated'
export const OPEN_CONSENT_MODAL_EVENT = 'rhhs-open-consent-modal'

export const DEFAULT_CONSENT: PrivacyConsent = {
  version: CURRENT_CONSENT_VERSION,
  necessary: true,
  analytics: false,
  functional: false,
  updatedAt: '',
}

/**
 * Safely retrieves stored privacy preferences from localStorage.
 * Validates version and schema integrity.
 */
export function getStoredConsent(): PrivacyConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PrivacyConsent>
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.version === CURRENT_CONSENT_VERSION &&
      parsed.necessary === true &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.functional === 'boolean' &&
      typeof parsed.updatedAt === 'string'
    ) {
      return {
        version: CURRENT_CONSENT_VERSION,
        necessary: true,
        analytics: parsed.analytics,
        functional: parsed.functional,
        updatedAt: parsed.updatedAt,
      }
    }
  } catch {
    // If corrupted or parsing fails, return null to trigger fresh consent
  }

  return null
}

/**
 * Persists privacy consent preferences to localStorage and notifies listeners.
 */
export function saveConsent(preferences: { analytics: boolean; functional: boolean }): PrivacyConsent {
  const record: PrivacyConsent = {
    version: CURRENT_CONSENT_VERSION,
    necessary: true,
    analytics: Boolean(preferences.analytics),
    functional: Boolean(preferences.functional),
    updatedAt: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record }))
    } catch {
      // Storage might be restricted or full
    }
  }

  return record
}

/**
 * Quick action: Accepts all optional categories.
 */
export function acceptAllConsent(): PrivacyConsent {
  return saveConsent({ analytics: true, functional: true })
}

/**
 * Quick action: Rejects all non-essential categories (strictly necessary only).
 */
export function rejectNonEssentialConsent(): PrivacyConsent {
  return saveConsent({ analytics: false, functional: false })
}

/**
 * Programmatically triggers the privacy preferences dialog.
 */
export function openConsentModal(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_MODAL_EVENT))
  }
}
