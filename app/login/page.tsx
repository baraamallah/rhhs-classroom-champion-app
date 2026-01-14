import Link from "next/link"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                <Image 
                  src="/Eco Champ.png" 
                  alt="Eco Champ Logo" 
                  width={40} 
                  height={40} 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ECO Club</h1>
                <p className="text-xs text-muted-foreground">Classroom Champion</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
          <div className="mt-6 text-center space-y-2">
            <Button variant="link" asChild>
              <Link href="/">Back to Leaderboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
