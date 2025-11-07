import { SchoolLogo } from "@/components/school-logo"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <SchoolLogo size="md" showText={true} />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ECO Club Classroom Champion • Making our school greener, one classroom at a time
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
