import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrative control center for RHHS Classroom Champion.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
