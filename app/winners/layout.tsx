import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Monthly Champions & Hall of Fame",
  description: "Explore monthly winners, top-performing green classrooms, award certificates, and win streaks across all RHHS school divisions.",
  alternates: {
    canonical: "/winners",
  },
  openGraph: {
    title: "Monthly Champions & Hall of Fame | RHHS ECO Club",
    description: "Celebrating top eco-conscious classrooms and sustainability champions at Rafic Hariri High School.",
    url: "/winners",
    type: "website",
  },
  twitter: {
    title: "Monthly Champions & Hall of Fame | RHHS ECO Club",
    description: "Celebrating top eco-conscious classrooms and sustainability champions at Rafic Hariri High School.",
  },
}

export default function WinnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
