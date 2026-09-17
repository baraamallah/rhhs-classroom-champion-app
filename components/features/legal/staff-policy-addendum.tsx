"use client"

import React from "react"
import { ShieldCheck, Lock, UserCheck, KeyRound, Clock, Server } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"

function formatRole(role?: string): string {
  switch (role) {
    case "super_admin":
      return "Super Administrator"
    case "admin":
      return "Administrator"
    case "supervisor":
      return "Supervisor / Evaluator"
    case "stats":
      return "Statistical Analyst"
    default:
      return "Authorized Staff"
  }
}

/**
 * Renders staff-specific privacy disclosures only when authorized personnel are logged in.
 */
export function StaffPrivacyAddendum() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section id="staff-governance" className="mt-12 pt-8 border-t-2 border-primary/20 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/25">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <span>Authorized Personnel Governance Addendum</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Authenticated Session: <strong className="text-foreground">{user.name}</strong> •{" "}
              <span className="text-primary font-medium">{formatRole(user.role)}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Restricted to Authenticated Personnel
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4 text-xs sm:text-sm leading-relaxed text-foreground/90 shadow-2xs">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>Staff Account Data Processing &amp; Safeguards</span>
          </h3>
          <p className="text-muted-foreground">
            As an authorized supervisor or administrative evaluator, your institutional profile consists of your full name, verified institutional school email address, securely salted cryptographic credentials, and assigned permission boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Evaluation Audit Trails</span>
            </span>
            <p className="text-muted-foreground text-xs">
              All submitted classroom checklist evaluations and score adjustments are logged with your account ID and an immutable timestamp to maintain institutional transparency and accountability.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Session Boundaries</span>
            </span>
            <p className="text-muted-foreground text-xs">
              Administrative sessions utilize encrypted, HttpOnly, SameSite browser session cookies with enforced 7-day expiration limits. Plaintext passwords are never accessible or stored.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-1 italic">
          Staff profile data is retained for the active academic appointment term. You maintain the right to review your audit history through the school administration office.
        </p>
      </div>
    </section>
  )
}

/**
 * Renders staff-specific code of conduct and account obligations only when logged in.
 */
export function StaffTermsAddendum() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section id="staff-governance" className="mt-12 pt-8 border-t-2 border-primary/20 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/25">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Evaluator &amp; Supervisor Obligations Addendum
            </h2>
            <p className="text-xs text-muted-foreground">
              Signed in as: <strong className="text-foreground">{user.name}</strong> •{" "}
              <span className="text-primary font-medium">{formatRole(user.role)}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Personnel Code of Conduct
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4 text-xs sm:text-sm leading-relaxed text-foreground/90 shadow-2xs">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>1. Objective Evaluation Standards</span>
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Designated student supervisors and faculty inspectors must conduct audits impartially, without favoritism or bias. Every classroom must be graded against the standardized 5-point eco rubric (Waste Sorting, Cleanliness, Lighting/Energy, Board/Furniture, Ecological Initiative).
          </p>
        </div>

        <div className="space-y-2 pt-1 border-t border-border/50">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>2. Credential Confidentiality &amp; Non-Delegation</span>
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Supervisor and administrator account credentials are non-transferable. Account sharing, lending passwords, or permitting unauthorized third parties to submit scores on your behalf is strictly prohibited and subject to institutional review.
          </p>
        </div>

        <div className="space-y-2 pt-1 border-t border-border/50">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <span>3. Audit Discrepancies &amp; Incident Reporting</span>
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Supervisors who notice anomalies in score tallies, duplicate evaluations, or suspect unauthorized access to their credentials must immediately notify the RHHS Administration at <a href="mailto:info@rhhs.edu.lb" className="text-primary underline">info@rhhs.edu.lb</a>.
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Renders staff-specific session cookies table only when logged in.
 */
export function StaffCookiesAddendum() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section id="staff-governance" className="mt-12 pt-8 border-t-2 border-primary/20 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/25">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Administrative &amp; Evaluator Session Tokens
            </h2>
            <p className="text-xs text-muted-foreground">
              Session details for: <strong className="text-foreground">{user.name}</strong> •{" "}
              <span className="text-primary font-medium">{formatRole(user.role)}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Authenticated Storage
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70 shadow-2xs">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-muted/70 text-foreground border-b border-border/60">
              <th className="p-3 font-semibold">Technical Purpose</th>
              <th className="p-3 font-semibold">Storage Type</th>
              <th className="p-3 font-semibold">Security Safeguards</th>
              <th className="p-3 font-semibold">Lifespan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 bg-card">
            <tr>
              <td className="p-3 font-medium text-foreground">Staff Session Authentication</td>
              <td className="p-3 text-muted-foreground">HTTP Cookie</td>
              <td className="p-3 text-muted-foreground">HttpOnly, Secure, SameSite=Lax. Protects evaluation and administration endpoints.</td>
              <td className="p-3 text-muted-foreground">7 Days</td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-foreground">Evaluation Write Sync</td>
              <td className="p-3 text-muted-foreground">HTTP Cookie</td>
              <td className="p-3 text-muted-foreground">Temporary read-after-write synchronization token for instant leaderboard updates.</td>
              <td className="p-3 text-muted-foreground">10 Seconds</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
