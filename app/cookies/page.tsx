import type { Metadata } from "next"
import Link from "next/link"
import { Cookie, ArrowLeft, ShieldCheck, Lock, Activity, EyeOff, Globe } from "lucide-react"
import { Header } from "@/components/layout/header"
import { OpenPreferencesButton } from "@/components/features/legal/open-preferences-button"

export const metadata: Metadata = {
  title: "Cookie & Telemetry Policy | RHHS Classroom Champion",
  description:
    "Complete inventory of cookies, terminal storage, and performance telemetry utilized across the RHHS Classroom Champion platform under Lebanese Law No. 81/2018.",
  alternates: {
    canonical: "/cookies",
  },
}

export default function CookiesPolicyPage() {
  const lastUpdated = "September 2026"

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-4xl" id="main-content">
        {/* Back button & Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leaderboard</span>
          </Link>
          <span className="text-xs text-muted-foreground">Effective Date: {lastUpdated}</span>
        </div>

        {/* Hero Header */}
        <header className="mb-10 pb-6 border-b border-border/60">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Cookie className="h-3.5 w-3.5" />
            <span>Storage &amp; Telemetry Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Cookie &amp; Storage Policy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            This policy transparently itemizes every cookie, browser terminal storage key (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">localStorage</code>), and performance telemetry technology deployed across the **RHHS ECO Club Classroom Champion** web platform.
          </p>
        </header>

        {/* Interactive Preferences Callout */}
        <div className="mb-10 p-5 rounded-2xl bg-card border border-primary/25 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Your Active Privacy Preferences</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You can adjust, enable, or revoke optional telemetry permissions at any time.
            </p>
          </div>
          <OpenPreferencesButton variant="default" className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground" />
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-sm sm:text-base text-foreground/90 leading-relaxed">
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              1. Understanding Terminal Storage &amp; Telemetry
            </h2>
            <p className="text-muted-foreground">
              Under **Lebanese Law No. 81/2018** and international ePrivacy standards, platforms that store data in your browser terminal equipment must provide clear, prior information regarding their technical purpose and duration.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li><strong>HTTP Cookies:</strong> Small strings of text sent by our server and stored in your browser, used primarily for secure supervisor authentication and write consistency.</li>
              <li><strong>Local Storage (localStorage):</strong> Browser-managed terminal storage used to retain client-side display preferences (such as light/dark theme) across sessions.</li>
              <li><strong>Cookie-Free Performance Telemetry:</strong> Aggregated, privacy-preserving network diagnostics that do <strong>not</strong> write persistent tracking cookies to your device.</li>
            </ul>
          </section>

          {/* Section 2: Strictly Necessary Storage */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                2. Strictly Necessary Storage &amp; Cookies (Always Active)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              These items are strictly essential for core system integrity, security, and authorized access. Under applicable law, strictly necessary technical storage does not require prior user consent as the service cannot function without it.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/70 text-foreground border-b border-border/60">
                    <th className="p-3 font-semibold">Identifier</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Purpose</th>
                    <th className="p-3 font-semibold">Lifespan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-card">
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">rhhs_session</td>
                    <td className="p-3 text-muted-foreground">HTTP Cookie (HttpOnly, Secure, SameSite=Lax)</td>
                    <td className="p-3 text-muted-foreground">Authenticates logged-in school supervisors and administrators; protects backend evaluation endpoints.</td>
                    <td className="p-3 text-muted-foreground">7 Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">sb-* (Supabase)</td>
                    <td className="p-3 text-muted-foreground">HTTP Cookie / Storage</td>
                    <td className="p-3 text-muted-foreground">Maintains secure database connection state for authenticated requests.</td>
                    <td className="p-3 text-muted-foreground">Session / Refresh token</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">rhhs_recent_mutation</td>
                    <td className="p-3 text-muted-foreground">HTTP Cookie</td>
                    <td className="p-3 text-muted-foreground">Ensures read-after-write cache synchronization so newly submitted scores appear immediately.</td>
                    <td className="p-3 text-muted-foreground">10 Seconds</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">theme</td>
                    <td className="p-3 text-muted-foreground">localStorage</td>
                    <td className="p-3 text-muted-foreground">Remembers the user&apos;s preferred interface color mode (Light, Dark, or System).</td>
                    <td className="p-3 text-muted-foreground">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">rhhs_privacy_consent_v1</td>
                    <td className="p-3 text-muted-foreground">localStorage</td>
                    <td className="p-3 text-muted-foreground">Stores your affirmative privacy and telemetry preferences and consent timestamp.</td>
                    <td className="p-3 text-muted-foreground">1 Year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Optional Telemetry */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                3. Optional Performance Telemetry (Opt-In Only)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We respect your autonomy: performance telemetry is <strong>switched OFF by default</strong> for every new visitor. It is mounted and transmitted only if you explicitly choose &quot;Accept All&quot; or enable it via Privacy Preferences.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/70 text-foreground border-b border-border/60">
                    <th className="p-3 font-semibold">Service</th>
                    <th className="p-3 font-semibold">Mechanism</th>
                    <th className="p-3 font-semibold">Data Gathered</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-card">
                  <tr>
                    <td className="p-3 font-medium text-foreground">Vercel Web Analytics</td>
                    <td className="p-3 text-muted-foreground">Cookie-free aggregated beacons</td>
                    <td className="p-3 text-muted-foreground">Page path, referring URL, country, browser family. No personal IP addresses or student profiles are recorded.</td>
                    <td className="p-3 text-primary font-medium">Opt-In Required</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Vercel Speed Insights</td>
                    <td className="p-3 text-muted-foreground">Real-User Performance Telemetry</td>
                    <td className="p-3 text-muted-foreground">Core Web Vitals (LCP, FID, CLS), network connection speed, and route loading latency.</td>
                    <td className="p-3 text-primary font-medium">Opt-In Required</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: User-Initiated Experience State */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                4. User-Initiated Experience Preferences
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Certain client-side keys exist solely to honor an explicit action you took in the interface:
            </p>
            <div className="p-4 rounded-xl bg-card border border-border/60 text-xs sm:text-sm space-y-1">
              <span className="font-mono font-semibold text-foreground">pwa_install_dismissed (localStorage)</span>
              <p className="text-muted-foreground">
                When you click &quot;Not Now&quot; on the PWA Install Banner, this key records a timestamp so the platform respects your decision and does not prompt you again for seven (7) days.
              </p>
            </div>
          </section>

          {/* Section 5: Browser Management */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                5. How to Manage Storage in Your Browser
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              In addition to our on-site Privacy Preferences dialog, you can inspect, block, or purge cookies and local terminal storage through your web browser settings:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li><strong>Google Chrome:</strong> Settings $\rightarrow$ Privacy and Security $\rightarrow$ Cookies and other site data.</li>
              <li><strong>Apple Safari (iOS &amp; macOS):</strong> Settings $\rightarrow$ Safari $\rightarrow$ Advanced $\rightarrow$ Website Data.</li>
              <li><strong>Mozilla Firefox:</strong> Settings $\rightarrow$ Privacy &amp; Security $\rightarrow$ Cookies and Site Data.</li>
              <li><strong>Microsoft Edge:</strong> Settings $\rightarrow$ Cookies and site permissions $\rightarrow$ Manage and delete cookies.</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              <em>Note: Disabling strictly necessary cookies in your browser settings will prevent supervisor and administrative authentication from functioning.</em>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
