import type { Metadata } from "next"
import Link from "next/link"
import { Scale, ArrowLeft, Award, CheckCircle, AlertTriangle, UserCheck, ShieldCheck } from "lucide-react"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "Terms of Service | RHHS Classroom Champion",
  description:
    "Terms of Service and Code of Conduct for the RHHS ECO Club Classroom Champion platform at Rafic Hariri High School.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsOfServicePage() {
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
            <Scale className="h-3.5 w-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service &amp; Code of Conduct
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Welcome to the **RHHS ECO Club Classroom Champion** platform. By accessing or using this service, students, faculty, supervisors, and administrative personnel agree to adhere to these Terms of Service and Code of Conduct established by **Rafic Hariri High School**.
          </p>
        </header>

        {/* Terms Body */}
        <div className="space-y-10 text-sm sm:text-base text-foreground/90 leading-relaxed">
          {/* Section 1: Educational Mission */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Award className="h-5 w-5 text-primary shrink-0" />
              <span>1. Educational Purpose &amp; Program Mission</span>
            </h2>
            <p className="text-muted-foreground">
              The Classroom Champion platform was conceived and built by students of the **RHHS Technical Institute** in partnership with the **RHHS ECO Club**. Its sole purpose is to foster environmental stewardship, classroom cleanliness, resource conservation, and constructive camaraderie across all divisions of Rafic Hariri High School.
            </p>
            <p className="text-muted-foreground">
              Use of the platform is strictly non-commercial and dedicated to supporting school educational initiatives.
            </p>
          </section>

          {/* Section 2: Code of Conduct & Fair Play */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span>2. Fair Play and Academic Integrity</span>
            </h2>
            <p>
              Integrity is the cornerstone of the Classroom Champion initiative. All participants agree to observe the following rules of fair competition:
            </p>
            <div className="space-y-2.5 pt-1">
              <div className="p-3.5 rounded-lg bg-card border border-border/60">
                <span className="font-semibold text-foreground block text-sm">Genuine Classroom Stewardship:</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Classroom preparation must represent real environmental care (proper waste segregation, turned-off projectors, orderly desks), not superficial or deceptive staging.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border/60">
                <span className="font-semibold text-foreground block text-sm">Zero Falsification:</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Any attempt to fabricate inspection records, coerce supervisors, or alter score entries will result in immediate disqualification of the section and formal school disciplinary review.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-card border border-border/60">
                <span className="font-semibold text-foreground block text-sm">Respect for Campus Facilities:</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Competition actions must never compromise school safety, property, or fellow students&apos; personal belongings.</span>
              </div>
            </div>
          </section>

          {/* Section 3: Supervisor Obligations */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-primary shrink-0" />
              <span>3. Supervisor Standards &amp; Impartiality</span>
            </h2>
            <p>
              Designated student supervisors and faculty inspectors hold positions of trust and must uphold high standards of objectivity:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li><strong>Impartial Evaluations:</strong> Supervisors must evaluate assigned classrooms without bias, favoritism, or personal prejudice.</li>
              <li><strong>Standard Rubric Adherence:</strong> Every evaluation must strictly follow the official 5-point eco rubric (Waste Sorting, Cleanliness, Lighting/Energy, Board/Furniture, Ecological Initiative).</li>
              <li><strong>Timely Submission:</strong> Daily inspections must be conducted and submitted within the assigned schedule to ensure transparent, live leaderboard updates.</li>
            </ul>
          </section>

          {/* Section 4: Account Security */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <span>4. Account Security and Authorized Access</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Administrative and supervisor accounts are granted exclusively to designated RHHS personnel. Account holders are personally responsible for preserving the confidentiality of their credentials.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li>Account sharing, password lending, or unauthorized delegation is strictly prohibited.</li>
              <li>Supervisors must promptly notify the school administration if they suspect credential compromise.</li>
              <li>Attempting to bypass role-based access control, inject unauthorized payloads, or reverse-engineer API endpoints is prohibited.</li>
            </ul>
          </section>

          {/* Section 5: Administrative Authority */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
              <span>5. Administrative Authority &amp; Final Decisions</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The Rafic Hariri High School Administration and designated Super Admins retain final authority over all platform operations, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>Auditing inspection logs and invalidating suspicious or duplicate submissions.</li>
              <li>Resolving leaderboard score ties and certifying official monthly division champions.</li>
              <li>Locking or freezing competition months for official reporting and school ceremonies.</li>
            </ul>
          </section>

          {/* Section 6: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              6. Intellectual Property &amp; School Marks
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              All official trademarks, school crests, logos (Rafic Hariri High School, Rafic Hariri Technical Institute, ECO Club Champion), UI designs, and codebase rights are the intellectual property of **Rafic Hariri High School** or their respective student creators. Unauthorized commercial reproduction is prohibited.
            </p>
          </section>

          {/* Section 7: Governing Jurisdiction */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              7. Governing Guidelines &amp; Inquiries
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              These Terms of Service are governed by the institutional bylaws and educational policies of Rafic Hariri High School and the applicable laws of the Republic of Lebanon.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground pt-1">
              For questions regarding these terms, please reach out to the school administration office at{" "}
              <a href="mailto:info@rhhs.edu.lb" className="text-primary underline font-medium">
                info@rhhs.edu.lb
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
