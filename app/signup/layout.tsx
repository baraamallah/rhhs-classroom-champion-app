import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Registration",
  description: "Initial Super Admin registration for RHHS Classroom Champion.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
