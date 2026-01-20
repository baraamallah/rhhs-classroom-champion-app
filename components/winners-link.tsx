"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getWinnersPageVisibility } from "@/app/actions/winners-page-actions"

export function WinnersLink() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkVisibility()
  }, [])

  const checkVisibility = async () => {
    const result = await getWinnersPageVisibility()
    if (result.success) {
      setVisible(result.visible ?? false)
    }
    setLoading(false)
  }

  if (loading || !visible) {
    return null
  }

  return (
    <Link href="/winners" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2 hidden sm:block">
      Winners
    </Link>
  )
}
