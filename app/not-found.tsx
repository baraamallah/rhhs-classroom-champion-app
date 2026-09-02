"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { m } from "framer-motion"
import { Leaf, Home, Trophy, Info, ArrowLeft, Compass, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { LazyMotionProvider } from "@/components/providers/lazy-motion-provider"

const floatingLeaves = [
  { x: "10%", y: "20%", delay: 0, duration: 6, rotate: 45 },
  { x: "85%", y: "15%", delay: 1.5, duration: 7, rotate: -30 },
  { x: "20%", y: "75%", delay: 0.8, duration: 8, rotate: 90 },
  { x: "80%", y: "70%", delay: 2, duration: 6.5, rotate: -60 },
  { x: "50%", y: "85%", delay: 1, duration: 7.5, rotate: 15 },
]

export default function NotFound() {
  const router = useRouter()

  return (
    <LazyMotionProvider>
      <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
        <Header />

        {/* Ambient Floating Foliage */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {floatingLeaves.map((leaf, index) => (
            <m.div
              key={index}
              className="absolute text-primary/15 dark:text-primary/10"
              style={{ left: leaf.x, top: leaf.y }}
              initial={{ y: 0, rotate: leaf.rotate, opacity: 0 }}
              animate={{
                y: [-15, 15, -15],
                x: [-10, 10, -10],
                rotate: [leaf.rotate - 15, leaf.rotate + 15, leaf.rotate - 15],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: leaf.duration,
                delay: leaf.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Leaf className="h-10 w-10" />
            </m.div>
          ))}
        </div>

        {/* Main 404 Hero Content */}
        <main id="main-content" className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center relative z-10">
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl mx-auto"
          >
            {/* Animated Eco Compass Badge */}
            <div className="relative inline-block mb-6">
              <m.div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-linear-to-tr from-primary/20 via-emerald-500/10 to-transparent border-2 border-primary/30 flex items-center justify-center mx-auto shadow-2xl backdrop-blur-sm"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(22, 163, 74, 0.2)",
                    "0 0 45px rgba(22, 163, 74, 0.4)",
                    "0 0 20px rgba(22, 163, 74, 0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <m.div
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <Compass className="h-16 w-16 md:h-20 md:w-20 text-primary drop-shadow-md" />
                  <m.div
                    className="absolute -top-1 -right-1 text-emerald-500"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-6 w-6" />
                  </m.div>
                </m.div>
              </m.div>

              {/* Big 404 Number Overlay */}
              <m.div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background/90 border border-primary/30 text-primary font-black text-xl md:text-2xl px-4 py-1 rounded-full shadow-lg backdrop-blur-md"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                404
              </m.div>
            </div>

            {/* Typography */}
            <m.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 bg-linear-to-r from-primary via-emerald-600 to-green-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Lost in the Green Canopy?
            </m.h1>

            <m.p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              The eco-trail you followed doesn't exist or has branched into a new path. Nature always finds its way back — let us guide you!
            </m.p>

            {/* Action Buttons */}
            <m.div
              className="flex flex-wrap items-center justify-center gap-3 mb-12"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button asChild size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Return to Leaderboard
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                className="rounded-full border-border/80 hover:bg-muted/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Page
              </Button>
            </m.div>

            {/* Helpful Eco Trails Section */}
            <m.div
              className="bg-card/70 border border-border/70 rounded-2xl p-6 backdrop-blur-md shadow-sm max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">
                🌿 Popular Green Destinations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/"
                  className="p-3 rounded-xl bg-background/60 hover:bg-primary/10 border border-border/40 hover:border-primary/40 transition-all flex flex-col items-center text-center group"
                >
                  <Leaf className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">Live Scores</span>
                  <span className="text-[10px] text-muted-foreground">Classroom Ranks</span>
                </Link>

                <Link
                  href="/winners"
                  className="p-3 rounded-xl bg-background/60 hover:bg-amber-500/10 border border-border/40 hover:border-amber-500/40 transition-all flex flex-col items-center text-center group"
                >
                  <Trophy className="h-5 w-5 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">Champions</span>
                  <span className="text-[10px] text-muted-foreground">Monthly Awards</span>
                </Link>

                <Link
                  href="/about"
                  className="p-3 rounded-xl bg-background/60 hover:bg-blue-500/10 border border-border/40 hover:border-blue-500/40 transition-all flex flex-col items-center text-center group"
                >
                  <Info className="h-5 w-5 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">About Us</span>
                  <span className="text-[10px] text-muted-foreground">Club & Scoring</span>
                </Link>
              </div>
            </m.div>
          </m.div>
        </main>
      </div>
    </LazyMotionProvider>
  )
}
