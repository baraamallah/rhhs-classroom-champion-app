"use client"

import { m } from "framer-motion"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { LeafIcon, TrophyIcon, StarIcon, CalculatorIcon, PodiumIcon, AwardBadgeIcon } from "@/components/common/icons"
import { Mail, Code2, Sparkles, ShieldCheck, Award, Users, Laptop } from "lucide-react"

const appSteps = [
  {
    step: "01",
    icon: StarIcon,
    title: "Classroom Audits",
    description: "Supervisors conduct objective visits using a standardized digital checklist covering waste management, electricity conservation, cleanliness, and green culture.",
  },
  {
    step: "02",
    icon: TrophyIcon,
    title: "Live Analytics & Ranking",
    description: "Scores are compiled and weighted in real time. Classrooms compete transparently within their academic division on the live public leaderboard.",
  },
  {
    step: "03",
    icon: Award,
    title: "Monthly Recognition",
    description: "The top-performing classroom in each division is awarded the Monthly Green Champion title, receiving official school certificates and trophies.",
  },
]

const technicalTeam = [
  { name: "Baraa El-Mallah", role: "Lead Developer", email: "baraa.elmallah@rhhs.edu.lb", initials: "BM" },
  { name: "Ziad Naholi", role: "Developer", email: "ziad.naholi@rhhs.edu.lb", initials: "ZN" },
]

const ecoClubTeam = [
  { name: "Adam Yehya", role: "Club President", email: "adam.yehya@rhhs.edu.lb", initials: "AY" },
  { name: "Mariam Baalbaky", role: "Vice President", email: "mariam.baalbaky@rhhs.edu.lb", initials: "MB" },
  { name: "Lana Bechara", role: "Secretary", email: "lana.bechara@rhhs.edu.lb", initials: "LB" },
  { name: "Malek Khobeiz", role: "School Affairs Logistics", email: "malek.khobeiz@rhhs.edu.lb", initials: "MK" },
  { name: "Bana Akra", role: "Logistics Coordinator", email: "bana.akra@rhhs.edu.lb", initials: "BA" },
]

export default function AboutPage() {
  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 pb-20">
        <Header />
        <main id="main-content" className="container mx-auto px-4 pt-12 pb-16">
          <AboutHero />
          <MilestonesBanner />
          <MissionSection />
          <HowItWorksSection />
          <ScoringRulesSection />
          <TeamSection />
        </main>
      </div>
    </LazyMotionProvider>
  )
}

function AboutHero() {
  return (
    <m.div
      className="text-center mb-14 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-4 shadow-2xs">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Rafic Hariri High School • Green Classrooms Initiative</span>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 bg-linear-to-r from-emerald-600 via-primary to-green-600 bg-clip-text text-transparent">
        Pioneering Sustainability Through Code & Conscience
      </h1>

      <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
        A student-engineered environmental governance platform inspiring daily eco-friendly habits and collaborative school spirit across all academic divisions.
      </p>
    </m.div>
  )
}

function MilestonesBanner() {
  return (
    <m.div
      className="max-w-5xl mx-auto mb-20 grid grid-cols-2 sm:grid-cols-4 gap-4"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-5 rounded-2xl bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border/70 shadow-xs text-center">
        <p className="text-3xl sm:text-4xl font-black text-primary">5</p>
        <p className="text-xs font-bold text-foreground mt-1">Divisions</p>
        <p className="text-[11px] text-muted-foreground">Pre-School to Technical Institute</p>
      </div>

      <div className="p-5 rounded-2xl bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border/70 shadow-xs text-center">
        <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
        <p className="text-xs font-bold text-foreground mt-1">Student Built</p>
        <p className="text-[11px] text-muted-foreground">Software & Design</p>
      </div>

      <div className="p-5 rounded-2xl bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border/70 shadow-xs text-center">
        <p className="text-3xl sm:text-4xl font-black text-amber-500">Live</p>
        <p className="text-xs font-bold text-foreground mt-1">Real-Time Data</p>
        <p className="text-[11px] text-muted-foreground">Transparent Audits</p>
      </div>

      <div className="p-5 rounded-2xl bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border/70 shadow-xs text-center">
        <p className="text-3xl sm:text-4xl font-black text-blue-500">Monthly</p>
        <p className="text-xs font-bold text-foreground mt-1">Recognition</p>
        <p className="text-[11px] text-muted-foreground">Certificates & Trophies</p>
      </div>
    </m.div>
  )
}


function MissionSection() {
  return (
    <div className="mb-24 max-w-5xl mx-auto">
      {/* Tech × Eco Partnership Card */}
      <m.div
        className="flex flex-col justify-between p-7 sm:p-9 rounded-3xl bg-linear-to-br from-primary/10 via-card/80 to-emerald-500/10 backdrop-blur-md border border-border/70 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
            <Laptop className="h-4 w-4" />
            <span>The Collaboration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4 text-foreground">
            Technical Institute Meets ECO Club
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            This platform represents a landmark interdisciplinary partnership at Rafic Hariri High School. <strong>Software Engineering students from the Technical Institute</strong> engineered the database architecture, algorithms, and responsive interfaces.
          </p>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Simultaneously, the <strong>ECO Club Executive Board</strong> established the objective criteria, supervised audits, and mobilized student participation across every academic grade.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card/80 border border-border/70 shadow-2xs">
          <p className="text-xs font-semibold text-foreground italic leading-relaxed">
            "When technical capability is steered by environmental responsibility, students become true architects of a sustainable future."
          </p>
        </div>
      </m.div>
    </div>
  )
}

function HowItWorksSection() {
    return (
      <div className="mb-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Operational Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            How The System Works
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            An objective, closed-loop evaluation cycle from on-site visit to award ceremony.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {appSteps.map((card, index) => (
            <m.div
              key={card.title}
              className="relative bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border/70 p-6 rounded-3xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-300 group"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="h-11 w-11 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center text-primary transition-colors">
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                  {card.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{card.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </m.div>
          ))}
        </div>
      </div>
    )
  }

function ScoringRulesSection() {
  return (
    <div className="mb-24 max-w-5xl mx-auto">
      <m.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
          <CalculatorIcon className="h-3.5 w-3.5" />
          <span>Evaluation Rubric</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Scoring Standards & Benchmark Tiers
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mt-1">
          Weighted criteria ensure high-impact actions like energy conservation and multi-bin sorting carry the greatest recognition.
        </p>
      </m.div>

      <div className="grid md:grid-cols-3 gap-6">
        <ScoringMechanicsCard />
        <LeaderboardRulesCard />
        <PerformanceTiersCard />
      </div>
    </div>
  )
}

function ScoringMechanicsCard() {
  return (
    <m.div
      className="bg-card/80 dark:bg-card/50 border border-border/70 p-6 rounded-3xl shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <div>
        <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <CalculatorIcon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold mb-1.5 text-foreground">Checklist Weights</h3>
        <p className="text-muted-foreground text-xs leading-relaxed mb-4">
          Items are weighted by their direct environmental impact:
        </p>
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-muted/50 border border-border/50">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              General Cleanliness
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">5 pts</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-muted/50 border border-border/50">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Standard Sorting
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">10 pts</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-muted/50 border border-border/50">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              High Impact (AC & Power)
            </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">15 pts</span>
          </div>
        </div>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-center mt-auto">
        <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">Total = Sum of Criteria</p>
      </div>
    </m.div>
  )
}

function LeaderboardRulesCard() {
  return (
    <m.div
      className="bg-card/80 dark:bg-card/50 border border-border/70 p-6 rounded-3xl shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between group"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div>
        <div className="h-10 w-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <PodiumIcon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold mb-1.5 text-foreground">Ranking & Tie-Breaker</h3>
        <p className="text-muted-foreground text-xs leading-relaxed mb-4">
          Fair governance ensures sustained effort over single-day spikes:
        </p>
        <div className="space-y-2.5 mb-6 text-xs text-muted-foreground">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50">
            <strong className="text-foreground block mb-0.5">Cumulative Sum</strong>
            Rooms are ordered primarily by aggregate points over the active period.
          </div>
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50">
            <strong className="text-foreground block mb-0.5">Tie-Breaker Rule</strong>
            If points tie, the classroom with higher <strong>Average Score</strong> takes the rank.
          </div>
        </div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2 text-center mt-auto">
        <p className="text-xs font-mono text-blue-700 dark:text-blue-300 font-bold">Tie-Breaker = Max Average</p>
      </div>
    </m.div>
  )
}

function PerformanceTiersCard() {
  return (
    <m.div
      className="bg-card/80 dark:bg-card/50 border border-border/70 p-6 rounded-3xl shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div>
        <div className="h-10 w-10 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <AwardBadgeIcon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold mb-1.5 text-foreground">Status Tiers</h3>
        <p className="text-muted-foreground text-xs leading-relaxed mb-4">
          Standardized compliance percentages mapped to visual badges:
        </p>
        <div className="space-y-2 mb-6">
          <TierRow className="bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400" label="Excellent" value="90% - 100%" />
          <TierRow className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" label="Good" value="75% - 89%" />
          <TierRow className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" label="Fair" value="60% - 74%" />
          <TierRow className="bg-muted border-border/60 text-muted-foreground" label="Needs Improvement" value="< 60%" />
        </div>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-center mt-auto">
        <p className="text-xs font-mono text-amber-700 dark:text-amber-300 font-bold">Goal = Excellent (90%+)</p>
      </div>
    </m.div>
  )
}

function TierRow({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-xl border ${className}`}>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-xs font-bold font-mono">{value}</span>
    </div>
  )
}

function TeamSection() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
          <Users className="h-3.5 w-3.5" />
          <span>Project Leadership</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Meet The Minds Behind The App
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Dedicated students collaborating across engineering and environmental advocacy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <TeamList title="Software Engineering Team" subtitle="Rafic Hariri Technical Institute" accent="primary" members={technicalTeam} />
        <TeamList title="ECO Club Executive Board" subtitle="Rafic Hariri High School" accent="green" members={ecoClubTeam} />
      </div>
    </div>
  )
}

function TeamList({
  title,
  subtitle,
  accent,
  members,
}: {
  title: string
  subtitle: string
  accent: "primary" | "green"
  members: { name: string; role: string; email: string; initials: string }[]
}) {
  const isGreen = accent === "green"

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black ${isGreen ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-primary/15 text-primary"}`}>
            {isGreen ? <LeafIcon className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
          </div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
      </div>

      <div className="space-y-2.5">
        {members.map((member, index) => (
          <m.div
            key={member.email}
            className="flex items-center justify-between p-3 bg-card/80 dark:bg-card/50 border border-border/70 rounded-2xl hover:border-primary/40 shadow-2xs hover:shadow-xs transition-all duration-200 group"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
          >
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${isGreen ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" : "bg-primary/15 text-primary border border-primary/30"}`}>
                {member.initials}
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-foreground tracking-tight">{member.name}</p>
                <span className="text-[11px] text-muted-foreground font-medium">{member.role}</span>
              </div>
            </div>

            <a
              href={`mailto:${member.email}`}
              aria-label={`Email ${member.name}`}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
              title={`Email ${member.email}`}
            >
              <Mail className="h-4 w-4" />
            </a>
          </m.div>
        ))}
      </div>
    </div>
  )
}


