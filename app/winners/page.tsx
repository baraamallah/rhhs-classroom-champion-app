import { redirect } from "next/navigation"
import { getWinnersPageVisibility, getDefaultMonthSettings } from "@/app/actions/winners-page-actions"
import { resolveCompetitionMonth } from "@/lib/display-period"
import WinnersView from "@/components/features/leaderboard/winners-view"

export default async function WinnersPage() {
  const [visibility, settings] = await Promise.all([getWinnersPageVisibility(), getDefaultMonthSettings()])
  if (visibility.success && visibility.visible === false) redirect("/")
  return <WinnersView initialPeriod={resolveCompetitionMonth(settings.winnersMonth, settings.leaderboardMonth)} />
}
