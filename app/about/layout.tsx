import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us & Green Classrooms Initiative",
  description: "Learn about the RHHS ECO Club mission, scoring rules, points calculation mechanics, and the Technical Institute students behind the Classroom Champion App.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About RHHS ECO Club & Classroom Champion Initiative",
    description: "Fostering sustainability and friendly eco competition at Rafic Hariri High School. Discover our scoring rules, team, and mission.",
    url: "/about",
    type: "website",
  },
  twitter: {
    title: "About RHHS ECO Club & Classroom Champion",
    description: "Fostering sustainability and friendly eco competition at Rafic Hariri High School.",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
