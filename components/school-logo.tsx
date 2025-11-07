import Image from "next/image"
import { cn } from "@/lib/utils"

interface SchoolLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function SchoolLogo({ className, size = "md", showText = true }: SchoolLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-12",
    md: "h-8 w-16", 
    lg: "h-12 w-24"
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Image
        src="/rhi-logo.png"
        alt="Rafic Hariri Technical Institute"
        width={size === "sm" ? 48 : size === "md" ? 64 : 96}
        height={size === "sm" ? 24 : size === "md" ? 32 : 48}
        className={cn(sizeClasses[size], "object-contain")}
        priority
      />
      {showText && (
        <div className="text-center mt-1">
          <p className="text-xs text-muted-foreground font-medium">
            Rafic Hariri Technical Institute
          </p>
        </div>
      )}
    </div>
  )
}
