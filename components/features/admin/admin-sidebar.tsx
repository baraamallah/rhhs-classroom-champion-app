"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  ClipboardList,
  Building2,
  FileText,
  BarChart3,
  Users,
  Archive,
  Database,
  Home,
  MoreHorizontal,
  Download,
  Calendar,
} from "lucide-react"
import Link from "next/link"

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  superAdminOnly?: boolean
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "classrooms", label: "Classrooms & Divisions", icon: Building2 },
  { id: "users", label: "Staff & Assignments", icon: Users },
  { id: "checklist", label: "Checklist Rubrics", icon: ClipboardList },
  { id: "evaluations", label: "Evaluations Log", icon: FileText },
  { id: "tracking", label: "Submission Tracking", icon: BarChart3 },
  { id: "calendar", label: "School Calendar", icon: Calendar, badge: "Daily" },
  { id: "statistics", label: "Score Analytics", icon: BarChart3 },
  { id: "exports", label: "Data Exports", icon: Download, badge: "Hub" },
  { id: "academic-archives", label: "New Year Archive", icon: Archive, badge: "New" },
  { id: "system", label: "System & Settings", icon: Database },
]

interface AdminSidebarProps {
  activeTab: string
  onSelectTab: (tabId: string) => void
  userRole?: string
}

export function AdminSidebar({ activeTab, onSelectTab, userRole }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly && userRole !== "super_admin") return false
    return true
  })

  const NavButtons = () => (
    <div className="space-y-1">
      {visibleNavItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <Link
            key={item.id}
            href={`/admin/${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              onSelectTab(item.id)
              setMobileOpen(false)
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left select-none ${
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  // The most frequent admin destinations stay one tap away on phones.
  // Less frequent configuration and reporting areas live in the More sheet.
  const mobilePrimaryItems = visibleNavItems.filter((item) =>
    ["classrooms", "users", "tracking"].includes(item.id),
  )
  const mobileMoreItems = visibleNavItems.filter((item) =>
    !mobilePrimaryItems.some((primary) => primary.id === item.id),
  )

  return (
    <>
      {/* Mobile bottom navigation: optimized for the daily admin workflow. */}
      <nav
        aria-label="Admin navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Link
                key={item.id}
                href={`/admin/${item.id}`}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  onSelectTab(item.id)
                }}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
              </Link>
            )
          })}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
              <SheetHeader className="text-left pb-4">
                <SheetTitle className="text-base font-bold">More administration</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2">
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <Link
                      key={item.id}
                      href={`/admin/${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        onSelectTab(item.id)
                        setMobileOpen(false)
                      }}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                        isActive ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-border">
                <Button asChild variant="outline" size="sm" className="w-full rounded-xl">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" /> View Public Site
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-3 shadow-xs space-y-4">
          <div className="px-3 py-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Management Portal
            </p>
          </div>
          <NavButtons />

          <div className="pt-3 border-t border-border/60">
            <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs">
              <Link href="/">
                <Home className="mr-2 h-3.5 w-3.5" /> Return to Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
