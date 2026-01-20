import { redirect } from "next/navigation"
import { getWinnersPageVisibility } from "@/app/actions/winners-page-actions"

export default async function WinnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check visibility on server side
  const visibilityResult = await getWinnersPageVisibility()
  
  if (visibilityResult.success && visibilityResult.visible === false) {
    redirect("/")
  }

  return <>{children}</>
}
