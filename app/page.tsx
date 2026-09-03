import { Header } from "@/components/layout/header"
import { LeaderboardView } from "@/components/features/leaderboard/leaderboard-view"
import { getHomepageData } from "@/lib/supabase-data-server"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const { leaderboard, calculationMode, winnerRevealMode } = await getHomepageData()

  return (
    <>
      <Header />
      <main id="main-content">
        <LeaderboardView
          leaderboard={leaderboard}
          calculationMode={calculationMode}
          winnerRevealMode={winnerRevealMode}
        />
      </main>
    </>
  )
}
