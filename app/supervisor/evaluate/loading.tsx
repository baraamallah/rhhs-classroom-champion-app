import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-7 w-64" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-5 w-80" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
