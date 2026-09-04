"use client"

import React, { createContext, useContext, useEffect, useState, useTransition } from "react"
import {
  type PrivacyConsent,
  getStoredConsent,
  saveConsent,
  acceptAllConsent,
  rejectNonEssentialConsent,
  CONSENT_CHANGE_EVENT,
  OPEN_CONSENT_MODAL_EVENT,
  CONSENT_STORAGE_KEY,
} from "@/lib/privacy/consent"

interface ConsentContextType {
  consent: PrivacyConsent | null
  hasDecided: boolean
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  updateConsent: (preferences: { analytics: boolean; functional: boolean }) => void
  acceptAll: () => void
  rejectNonEssential: () => void
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined)

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<PrivacyConsent | null>(null)
  const [hasDecided, setHasDecided] = useState<boolean>(true) // default true on SSR to avoid layout shift
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    // Read on client mount
    const stored = getStoredConsent()
    startTransition(() => {
      setConsent(stored)
      setHasDecided(stored !== null)
    })

    const handleLocalConsentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<PrivacyConsent>
      if (customEvent.detail) {
        setConsent(customEvent.detail)
        setHasDecided(true)
      }
    }

    const handleOpenModal = () => {
      setIsModalOpen(true)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONSENT_STORAGE_KEY) {
        const updated = getStoredConsent()
        setConsent(updated)
        setHasDecided(updated !== null)
      }
    }

    window.addEventListener(CONSENT_CHANGE_EVENT, handleLocalConsentUpdate)
    window.addEventListener(OPEN_CONSENT_MODAL_EVENT, handleOpenModal)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, handleLocalConsentUpdate)
      window.removeEventListener(OPEN_CONSENT_MODAL_EVENT, handleOpenModal)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleUpdate = (prefs: { analytics: boolean; functional: boolean }) => {
    const record = saveConsent(prefs)
    setConsent(record)
    setHasDecided(true)
    setIsModalOpen(false)
  }

  const handleAcceptAll = () => {
    const record = acceptAllConsent()
    setConsent(record)
    setHasDecided(true)
    setIsModalOpen(false)
  }

  const handleRejectNonEssential = () => {
    const record = rejectNonEssentialConsent()
    setConsent(record)
    setHasDecided(true)
    setIsModalOpen(false)
  }

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasDecided,
        isModalOpen,
        openModal,
        closeModal,
        updateConsent: handleUpdate,
        acceptAll: handleAcceptAll,
        rejectNonEssential: handleRejectNonEssential,
      }}
    >
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent(): ConsentContextType {
  const context = useContext(ConsentContext)
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider")
  }
  return context
}
