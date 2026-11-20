import { redirect } from "next/navigation"
import { getWinnersPageVisibility, getDefaultMonthSettings } from "@/app/actions/winners-page-actions"
import { getPublicMonthlyWinners } from "@/app/actions/public-winners-actions"
import { resolveCompetitionMonth } from "@/lib/display-period"
import WinnersView from "@/components/features/leaderboard/winners-view"

export default async function WinnersPage() {
  const [visibility, settings] = await Promise.all([getWinnersPageVisibility(), getDefaultMonthSettings()])
  if (visibility.success && visibility.visible === false) redirect("/")
  const initialPeriod = resolveCompetitionMonth(settings.winnersMonth, settings.leaderboardMonth)
  const winnersRes = await getPublicMonthlyWinners(initialPeriod.year, initialPeriod.month)
  const initialWinners = winnersRes && winnersRes.success ? winnersRes.data : undefined
  return <WinnersView initialPeriod={initialPeriod} initialWinners={initialWinners} />
}
