import type { Metadata } from "next"
import Link from "next/link"
import { Shield, ArrowLeft, Building, Lock, FileText, CheckCircle2, Mail, ExternalLink } from "lucide-react"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "Privacy Policy | RHHS Classroom Champion",
  description:
    "Privacy Policy for RHHS ECO Club Classroom Champion, governed by Lebanese Law No. 81/2018 on Electronic Transactions and Personal Data.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPolicyPage() {
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
            <Shield className="h-3.5 w-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            This Privacy Policy sets forth the principles and practices governing the collection, processing, and protection of information within the **RHHS ECO Club Classroom Champion** web platform, operated under **Lebanese Law No. 81/2018** on Electronic Transactions and Personal Data.
          </p>
        </header>

        {/* Policy Body */}
        <div className="space-y-10 text-sm sm:text-base text-foreground/90 leading-relaxed">
          {/* Section 1: Data Controller */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Building className="h-5 w-5 text-primary shrink-0" />
              <span>1. Data Controller Identification</span>
            </h2>
            <p className="text-muted-foreground">
              The data controller responsible for the processing of data through this platform is:
            </p>
            <div className="p-4 rounded-xl bg-card border border-border/70 text-sm space-y-1 shadow-xs">
              <p className="font-semibold text-foreground">Rafic Hariri High School &amp; Technical Institute</p>
              <p className="text-muted-foreground">Al-Sharhabeel, Saida, Lebanon</p>
              <p className="text-muted-foreground">
                Institutional Contact:{" "}
                <a href="mailto:info@rhhs.edu.lb" className="text-primary hover:underline font-medium">
                  info@rhhs.edu.lb
                </a>
              </p>
              <p className="text-muted-foreground">
                Official Website:{" "}
                <a
                  href="https://rhhs.edu.lb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  rhhs.edu.lb <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </section>

          {/* Section 2: Legal Basis & Lebanese Law 81/2018 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span>2. Primary Legal Framework (Lebanese Law No. 81/2018)</span>
            </h2>
            <p>
              The platform operates in primary compliance with **Lebanese Law No. 81 of October 10, 2018** on Electronic Transactions and Personal Data.
            </p>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-sm space-y-2">
              <p className="font-semibold text-foreground">
                Article 94(4) Educational Exemption Notice:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Under Article 94, paragraph 4 of Law No. 81/2018, recognized educational institutions are exempt from the formal declaration and authorization procedures before competent ministries when processing data strictly for their own educational, academic, or administrative objectives.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                While procedurally exempt, Rafic Hariri High School strictly abides by the substantive legal mandates of Law 81/2018: purpose specification, data proportionality, strict confidentiality, infrastructure safeguards, and respect for individual rights.
              </p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              International frameworks such as the EU General Data Protection Regulation (GDPR) and student privacy principles (such as COPPA/FERPA guidance) are applied as aligned educational best practices where relevant.
            </p>
          </section>

          {/* Section 3: Collective Classroom Scope */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>3. Collective Classroom Scope (No Individual Student Profiles)</span>
            </h2>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-2">
              <p className="font-semibold text-primary">
                Important Student Privacy Declaration:
              </p>
              <p className="text-foreground leading-relaxed">
                The RHHS Classroom Champion platform evaluates, scores, and recognizes <strong>entire classrooms and grade divisions as collective units</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
                <li>No individual student names, civil identification numbers, or student photographs are collected or displayed.</li>
                <li>No personal academic grades, behavioral reprimands, or medical histories are recorded in this system.</li>
                <li>Inspection scores reflect physical classroom conditions (energy conservation, recycling, cleanliness, organization).</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Data Categories Processed */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              4. Categories of Data Collected and Processed
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-card border border-border/60">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  A. Classroom &amp; Inspection Data (Publicly Visible to School Community)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Classroom names, division groupings (e.g., Grade 10, Grade 11), room numbers, daily inspection dates, 5-point eco rubric checklist ratings, cumulative points, and monthly champion awards.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/60">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  B. Staff &amp; Supervisor Accounts (Restricted Access)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Full name of supervisor or administrator, institutional school email address, salted bcrypt password hash, assigned role (`super_admin`, `admin`, `supervisor`, `stats`), and evaluation submission audit logs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/60">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  C. Technical &amp; Performance Telemetry (Opt-In Only)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Cookie-free, aggregated Web Vitals and route latency metrics via Vercel Web Analytics and Speed Insights. This telemetry is transmitted <strong>only</strong> after affirmative user consent in the privacy preferences banner.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Data Security & Storage */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-primary shrink-0" />
              <span>5. Data Storage &amp; Infrastructure Safeguards</span>
            </h2>
            <p>
              Data is hosted using Supabase cloud database infrastructure. Connections to Supabase HTTP API services enforce Transport Layer Security (TLS/HTTPS). Database connection security and administrative safeguards are configured in accordance with the school’s security deployment settings.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li><strong>Password Protection:</strong> Account passwords are encrypted using one-way bcrypt hashing with individual random salts prior to storage; plaintext passwords are never stored.</li>
              <li><strong>Session Security:</strong> Authenticated sessions utilize encrypted, HttpOnly, SameSite cookies with a strictly enforced 7-day expiration.</li>
              <li><strong>Role-Based Access Control:</strong> Strict backend permission boundaries partition Super Admin, Admin, Supervisor, and Public access levels.</li>
            </ul>
          </section>

          {/* Section 6: Data Subject Rights under Law 81/2018 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              6. Your Rights Under Lebanese Law No. 81/2018
            </h2>
            <p>
              In accordance with Part II of Lebanese Law No. 81/2018, authorized individuals whose data is processed have the following enforceable rights:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-card border border-border/60 text-xs sm:text-sm">
                <span className="font-semibold text-foreground block">Right of Access</span>
                <span className="text-muted-foreground">Verify what personal account or inspection records are associated with your profile.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border/60 text-xs sm:text-sm">
                <span className="font-semibold text-foreground block">Right of Rectification &amp; Completion</span>
                <span className="text-muted-foreground">Request the prompt correction or completion of inaccurate or incomplete records.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border/60 text-xs sm:text-sm">
                <span className="font-semibold text-foreground block">Right of Deletion</span>
                <span className="text-muted-foreground">Request deletion of data that is obsolete, excessive, prohibited, or incompatible with the educational purpose.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border/60 text-xs sm:text-sm">
                <span className="font-semibold text-foreground block">Right of Purpose Limitation</span>
                <span className="text-muted-foreground">Guarantee that data will never be sold, rented, or utilized for commercial marketing.</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pt-2">
              To exercise any of these statutory rights, please contact the RHHS Administration at{" "}
              <a href="mailto:info@rhhs.edu.lb" className="text-primary underline font-medium">
                info@rhhs.edu.lb
              </a>
              . Requests are reviewed and addressed within thirty (30) school business days.
            </p>
          </section>

          {/* Section 7: Retention & Updates */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              7. Data Retention and Policy Updates
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Classroom inspection scores and champion awards are retained for the duration of the active academic school year. At the end of each academic cycle, administrative archives preserve aggregated rankings while non-essential logs are securely purged.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Rafic Hariri High School reserves the right to update this Privacy Policy to reflect system enhancements or regulatory developments. Notice of material modifications will be posted prominently on the platform.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
