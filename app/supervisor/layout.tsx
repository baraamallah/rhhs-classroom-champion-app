import type { Metadata } from "next"
import { requirePageRole } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Supervisor Portal",
  description: "Supervisor evaluation portal for RHHS Classroom Champion.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageRole(["supervisor"])
  return <>{children}</>
}
