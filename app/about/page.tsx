"use client"

import { m } from "framer-motion"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"
import { LeafIcon, TrophyIcon, StarIcon, CalculatorIcon, PodiumIcon, AwardBadgeIcon } from "@/components/common/icons"
import { Mail } from "lucide-react"

const missionPoints = [
  "Promoting energy efficiency & waste reduction",
  "Encouraging recycling & smart sorting",
  "Rewarding innovation in sustainability",
]

const appSteps = [
  {
    icon: StarIcon,
    title: "Evaluation",
    description: "Supervisors visit classrooms regularly to assess environmental practices using a comprehensive checklist.",
  },
  {
    icon: TrophyIcon,
    title: "Competition",
    description: "Classrooms earn points for their eco-friendly efforts, competing for the top spot on the leaderboard.",
  },
  {
    icon: LeafIcon,
    title: "Recognition",
    description: "Top-performing classrooms are recognized as 'Green Champions' and awarded for their dedication.",
  },
]

const technicalTeam = [
  { name: "Baraa El-Mallah", role: "Lead Developer", email: "baraa.elmallah@rhhs.edu.lb" },
  { name: "Ziad Naholi", role: "Developer", email: "ziad.naholi@rhhs.edu.lb" },
]

const ecoClubTeam = [
  { name: "Adam Yehya", role: "Club President", email: "adam.yehya@rhhs.edu.lb" },
  { name: "Mariam Baalbaky", role: "Vice President", email: "mariam.baalbaky@rhhs.edu.lb" },
  { name: "Lana Bechara", role: "Secretary", email: "lana.bechara@rhhs.edu.lb" },
  { name: "Malek Khobeiz", role: "School Affairs Logistics", email: "malek.khobeiz@rhhs.edu.lb" },
  { name: "Bana Akra", role: "Logistics Coordinator", email: "bana.akra@rhhs.edu.lb" },
]

export default function AboutPage() {
  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5">
        <Header />
        <main id="main-content" className="container mx-auto px-4 py-12">
          <AboutHero />
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
      className="text-center mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <m.div
        className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6"
        initial={{ scale: 0.01 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
      >
        <LeafIcon className="h-12 w-12 text-primary" />
      </m.div>
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-primary to-green-600 bg-clip-text text-transparent">
        About Us
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Empowering students to build a sustainable future, one classroom at a time.
      </p>
    </m.div>
  )
}

function MissionSection() {
  return (
    <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
      <m.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Green Classrooms Initiative:</span> Fostering a culture of sustainability at Rafic Hariri High School. We empower students to protect our planet through daily eco-friendly habits.
          </p>
          <p>
            <span className="font-semibold text-foreground">Tech Meets Eco:</span> This App was built by the <span className="text-primary font-medium">Technical Institute Students</span> in partnership with the <span className="text-green-600 font-medium">RHHS ECO Club</span>. We merged the codes with the consciences to build this platform - demonstrating that technology, when guided by purpose, can deliver real, measurable environmental impact.
          </p>
        </div>

        <div className="mt-8">
          <ul className="space-y-3">
            {missionPoints.map((item, index) => (
              <m.li
                key={item}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-medium">{item}</span>
              </m.li>
            ))}
          </ul>
        </div>
      </m.div>

      <m.div
        className="relative h-100 rounded-2xl overflow-hidden shadow-2xl bg-muted/50 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center p-8">
          <LeafIcon className="h-32 w-32 text-primary/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Building a Greener Future</p>
        </div>
      </m.div>
    </div>
  )
}

function HowItWorksSection() {
  return (
    <div className="mb-20">
      <h2 className="text-3xl font-bold text-center mb-12">How The App Works?</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {appSteps.map((card, index) => (
          <m.div
            key={card.title}
            className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
          >
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
            <p className="text-muted-foreground">{card.description}</p>
          </m.div>
        ))}
      </div>
    </div>
  )
}

function ScoringRulesSection() {
  return (
    <div className="mb-20">
      <m.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-4 bg-linear-to-r from-primary to-green-600 bg-clip-text text-transparent">
          Point Calculation & Scoring Rules
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A transparent, fair scoring system designed to reward daily environmental habits and team collaboration.
        </p>
      </m.div>

      <div className="grid md:grid-cols-3 gap-8">
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
      className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-300 flex flex-col justify-between group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div>
        <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <CalculatorIcon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">Scoring Mechanics</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Supervisors check classroom compliance using a weighted checklist. Each item has a specific value based on its environmental impact:
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Simple Checks: 5 pts
          </li>
          <li className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/30">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Standard Practices: 10 pts
          </li>
          <li className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/30">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            High Impact (AC, Sorting): 15 pts
          </li>
        </ul>
      </div>
      <div className="bg-linear-to-r from-emerald-500/5 to-blue-500/5 border border-primary/10 rounded-lg p-3 text-center mt-auto">
        <p className="text-xs font-mono text-primary font-semibold">Evaluation Score = Sum of Checked Items</p>
      </div>
    </m.div>
  )
}

function LeaderboardRulesCard() {
  return (
    <m.div
      className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-300 flex flex-col justify-between group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div>
        <div className="h-12 w-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <PodiumIcon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">Leaderboard Rules</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Rankings reflect sustained performance. Scores are aggregated to drive friendly school competition:
        </p>
        <div className="space-y-3 mb-6 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><span className="text-blue-500 font-semibold mt-0.5">-</span><span><strong>Cumulative Sort:</strong> Rooms are ranked by total points across unarchived evaluations.</span></p>
          <p className="flex items-start gap-2"><span className="text-blue-500 font-semibold mt-0.5">-</span><span><strong>Aggregation:</strong> Configurable between all-time stats and monthly resets for fresh goals.</span></p>
          <p className="flex items-start gap-2"><span className="text-blue-500 font-semibold mt-0.5">-</span><span><strong>Tie-Breaker:</strong> If total scores tie, the classroom with the higher <strong>Average Score</strong> takes the lead!</span></p>
        </div>
      </div>
      <div className="bg-linear-to-r from-blue-500/5 to-indigo-500/5 border border-primary/10 rounded-lg p-3 text-center mt-auto">
        <p className="text-xs font-mono text-primary font-semibold">Tie-Breaker = Max Average Score</p>
      </div>
    </m.div>
  )
}

function PerformanceTiersCard() {
  return (
    <m.div
      className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-300 flex flex-col justify-between group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div>
        <div className="h-12 w-12 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <AwardBadgeIcon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">Performance Tiers</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Individual evaluation percentages earn specific visual status badges inside the app:
        </p>
        <div className="space-y-3 mb-6">
          <TierRow className="bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400" label="Excellent" value="90% - 100%" />
          <TierRow className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" label="Good" value="75% - 89%" />
          <TierRow className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" label="Fair" value="60% - 74%" />
          <TierRow className="bg-muted border-border text-muted-foreground" label="Needs Improvement" value="< 60%" />
        </div>
      </div>
      <div className="bg-linear-to-r from-amber-500/5 to-yellow-500/5 border border-primary/10 rounded-lg p-3 text-center mt-auto">
        <p className="text-xs font-mono text-primary font-semibold">Target Status = Excellent (90%+)</p>
      </div>
    </m.div>
  )
}

function TierRow({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border ${className}`}>
      <span className="text-xs font-bold flex items-center gap-1.5">{label}</span>
      <span className="text-xs font-bold font-mono">{value}</span>
    </div>
  )
}

function TeamSection() {
  return (
    <div className="mb-20">
      <h2 className="text-3xl font-bold text-center mb-12">Meet the Team</h2>
      <div className="grid md:grid-cols-2 gap-12">
        <TeamList title="Technical Team" accent="primary" members={technicalTeam} />
        <TeamList title="ECO Club Team" accent="green" members={ecoClubTeam} />
      </div>
    </div>
  )
}

function TeamList({
  title,
  accent,
  members,
}: {
  title: string
  accent: "primary" | "green"
  members: { name: string; role: string; email: string }[]
}) {
  const hoverClass = accent === "green" ? "hover:border-green-500/50" : "hover:border-primary/50"
  const mailClass = accent === "green"
    ? "hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
    : "hover:text-primary hover:bg-primary/10"

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <span className={accent === "green" ? "p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 text-xl" : "p-2 bg-primary/10 rounded-lg text-primary text-xl"}>
          {accent === "green" ? "ECO" : "TECH"}
        </span>
        {title}
      </h3>
      <div className="grid gap-4">
        {members.map((member, index) => (
          <m.div
            key={member.email}
            className={`flex items-center justify-between p-4 bg-card border border-border rounded-xl ${hoverClass} transition-colors`}
            initial={{ opacity: 0, x: accent === "green" ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
            <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`} className={`p-2 text-muted-foreground ${mailClass} rounded-full transition-colors`}>
              <Mail className="h-5 w-5" />
            </a>
          </m.div>
        ))}
      </div>
    </div>
  )
}
