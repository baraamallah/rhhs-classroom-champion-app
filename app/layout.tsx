import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ConsentProvider } from "@/components/providers/consent-provider"
import { Footer } from "@/components/layout/footer"
import { AutoArchiveChecker } from "@/components/features/system/auto-archive-checker"
import { MotionProvider } from "@/components/providers/motion-provider"
import { PrivacyConsentBanner } from "@/components/features/legal/privacy-consent-banner"
import { PwaInstallBanner } from "@/components/features/pwa/pwa-install-banner"
import { ConditionalTelemetry } from "@/components/features/analytics/conditional-telemetry"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rhhs-eco-champion.vercel.app"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ECO Club - Classroom Champion | RHHS",
    template: "%s | RHHS Classroom Champion",
  },
  description: "Track and celebrate eco-friendly classrooms at Rafic Hariri High School. Live sustainability leaderboard, environmental evaluations, monthly awards, and ecological score tracking.",
  applicationName: "RHHS Classroom Champion",
  authors: [
    { name: "RHHS Technical Institute & ECO Club", url: "https://rhhs.edu.lb" },
  ],
  generator: "Next.js",
  keywords: [
    "RHHS",
    "Rafic Hariri High School",
    "ECO Club",
    "Classroom Champion",
    "Green Classrooms",
    "Sustainability Competition",
    "School Environmental App",
    "Eco-friendly Classrooms",
    "Classroom Leaderboard",
    "Lebanon Eco Schools",
    "Student Sustainability",
    "Energy Conservation School",
  ],
  creator: "RHHS Technical Institute Students & ECO Club",
  publisher: "Rafic Hariri High School",
  category: "education",
  classification: "Educational Environmental Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "RHHS Classroom Champion",
    title: "RHHS ECO Club - Classroom Champion",
    description: "Track and celebrate eco-friendly classrooms with live sustainability leaderboards, green checklists, and monthly awards at Rafic Hariri High School.",
    images: [
      {
        url: "/Eco Champ.png",
        width: 512,
        height: 512,
        alt: "RHHS Classroom Champion Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHHS ECO Club - Classroom Champion",
    description: "Empowering students to build a sustainable future through friendly classroom competition.",
    images: ["/Eco Champ.png"],
    creator: "@rhhs_ecoclub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/Eco Champ.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/Eco Champ.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      "name": "RHHS Classroom Champion",
      "url": siteUrl,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description": "Real-time sustainability leaderboard and eco-friendly competition tracker for classrooms at Rafic Hariri High School.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "creator": {
        "@type": "Organization",
        "name": "RHHS Technical Institute & ECO Club",
        "url": "https://rhhs.edu.lb",
      },
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://rhhs.edu.lb/#organization",
      "name": "Rafic Hariri High School",
      "url": "https://rhhs.edu.lb",
      "logo": `${siteUrl}/Eco Champ.png`,
      "sameAs": [
        "https://www.facebook.com/rhhs.edu.lb",
        "https://www.instagram.com/rhhs.official",
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ConsentProvider>
              <AutoArchiveChecker />
              <div className="min-h-screen flex flex-col">
                <MotionProvider>
                  {children}
                </MotionProvider>
                <Footer />
              </div>
              <PrivacyConsentBanner />
              <PwaInstallBanner />
              {process.env.VERCEL && <ConditionalTelemetry />}
            </ConsentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
