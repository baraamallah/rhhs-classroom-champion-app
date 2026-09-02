import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Supervisor Portal",
  description: "Supervisor evaluation portal for RHHS Classroom Champion.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
