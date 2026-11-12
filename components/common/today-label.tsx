"use client"

import { useEffect, useState } from "react"

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Beirut",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
})

export function TodayLabel() {
  const [label, setLabel] = useState("")
  useEffect(() => {
    const update = () => setLabel(formatter.format(new Date()))
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [])
  return <span>{label || "Today"}</span>
}
