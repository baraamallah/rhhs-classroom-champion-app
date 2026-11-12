import type { ReactNode } from "react"
import { HelpCircle } from "lucide-react"

export function SettingHelp({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 p-3.5 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-2.5">
      <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}
