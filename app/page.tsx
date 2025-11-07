import { Header } from "@/components/header"
import { SimpleClassroomCard } from "@/components/simple-classroom-card"
import { calculateLeaderboard } from "@/lib/utils-leaderboard"
import { getEvaluationsServer } from "@/lib/supabase-data-server"
import { LeafIcon } from "@/components/icons"

export const revalidate = 0

export default async function HomePage() {
  const evaluations = await getEvaluationsServer()
  const leaderboard = calculateLeaderboard(evaluations)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Clean Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <LeafIcon className="h-16 w-16 text-primary" />
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">Green Classrooms</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating environmental excellence across our school community
          </p>
        </div>

        {/* All Classrooms List */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No evaluations yet. Check back soon!</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3 mb-16">
            {leaderboard.map((classroom, index) => (
              <SimpleClassroomCard 
                key={`${classroom.classroom.id}-${index}`} 
                classroom={classroom} 
                rank={index + 1} 
              />
            ))}
          </div>
        )}

        {/* Simple How It Works */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">How It Works</h3>
            <p className="text-muted-foreground mb-4">
              Supervisors evaluate each classroom based on eco-friendly practices like waste sorting, 
              energy conservation, and environmental care.
            </p>
            <p className="text-primary font-medium">
              The higher your Eco-Score, the better your ranking!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
