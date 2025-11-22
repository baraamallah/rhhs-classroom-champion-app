export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-6">

          {/* Logos Container */}
          <div className="flex items-center justify-center gap-8 sm:gap-12">
            {/* RHHS Logo */}
            <div className="flex items-center justify-center">
              <img
                src="/rhhs-logo.png"
                alt="RHHS Logo"
                className="h-12 sm:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* RHI Logo (formerly SchoolLogo) */}
            <div className="flex items-center justify-center">
              <img
                src="/rhi-logo.png"
                alt="RHTI Logo"
                className="h-12 sm:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Eco Champ Logo */}
            <div className="flex items-center justify-center">
              <img
                src="/Eco Champ.png"
                alt="Eco Champ"
                className="h-12 sm:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

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
