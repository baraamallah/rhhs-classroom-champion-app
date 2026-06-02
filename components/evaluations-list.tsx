"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvaluations } from "@/lib/supabase-data"
import type { Evaluation } from "@/lib/types"
import { FileText, Calendar, User, Search, Filter, ArrowUpRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function EvaluationsList() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const data = await getEvaluations()
        setEvaluations(data)
      } catch (error) {
        console.error("Error fetching evaluations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluations()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading evaluations...</p>
        </CardContent>
      </Card>
    )
  }

  const [searchTerm, setSearchTerm] = useState("")

  const filteredEvaluations = evaluations.filter(e =>
    e.classroom?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.supervisor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Evaluation History
            </CardTitle>
            <CardDescription className="text-sm">
              Review and track all classroom eco-evaluations submitted by supervisors.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by classroom or supervisor..."
              className="pl-9 h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm font-medium">Retrieving submissions...</p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="py-20 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No evaluations found matching your criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-border sm:border sm:rounded-xl overflow-hidden">
            {filteredEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors bg-card">
                <div className="flex items-start gap-4 mb-3 sm:mb-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-foreground text-base sm:text-lg tracking-tight truncate leading-tight group-hover:text-primary transition-colors">
                      {evaluation.classroom?.name || "Unknown Classroom"}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 opacity-60" />
                        {evaluation.supervisor?.name || "Unknown Staff"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        {formatDate(evaluation.evaluation_date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 pl-14 sm:pl-0 pt-2 sm:pt-0">
                  <div className="flex flex-col items-center sm:items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-primary leading-none">
                        {evaluation.total_score}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        pts
                      </span>
                    </div>
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden mt-1 hidden sm:block">
                      <div
                        className="bg-primary h-full rounded-full opacity-60"
                        style={{ width: `${Math.min((evaluation.total_score / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <button className="h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm opacity-0 group-hover:opacity-100 hidden sm:flex">
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {filteredEvaluations.length > 0 && (
        <div className="bg-muted/30 px-6 py-4 border-t flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            Total Submissions: <span className="text-foreground">{filteredEvaluations.length}</span>
          </p>
          <button className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">
            View All History
          </button>
        </div>
      )}
    </Card>
  )
}
