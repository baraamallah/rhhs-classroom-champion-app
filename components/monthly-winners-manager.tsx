"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TrophyIcon, Calendar, Award, Trash2, Edit } from "lucide-react"
import {
  declareMonthlyWinner,
  getMonthlyWinners,
  deleteMonthlyWinner,
  getTopClassroomsByDivision
} from "@/app/actions/monthly-winners-actions"
import { getClassrooms } from "@/lib/supabase-data"
import type { Classroom } from "@/lib/types"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const DIVISIONS = ['Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute']
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function MonthlyWinnersManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [winners, setWinners] = useState<any[]>([])
  const [topClassrooms, setTopClassrooms] = useState<Record<string, any[]>>({})
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [editingWinner, setEditingWinner] = useState<any | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; winnerId: string }>({ open: false, winnerId: "" })

  useEffect(() => {
    loadWinners()
    loadClassrooms()
  }, [])

  useEffect(() => {
    loadWinners()
    loadTopClassrooms()
  }, [selectedYear, selectedMonth])

  const loadWinners = async () => {
    setLoading(true)
    const result = await getMonthlyWinners(selectedYear, selectedMonth)
    setLoading(false)

    if (result.success) {
      setWinners(result.data || [])
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load winners",
        variant: "destructive",
      })
    }
  }

  const loadClassrooms = async () => {
    try {
      const data = await getClassrooms()
      setClassrooms(data)
    } catch (error) {
      console.error("Error loading classrooms:", error)
    }
  }

  const loadTopClassrooms = async () => {
    setLoading(true)
    const topClassroomsMap: Record<string, any[]> = {}

    for (const division of DIVISIONS) {
      const result = await getTopClassroomsByDivision(division, selectedYear, selectedMonth)
      if (result.success) {
        topClassroomsMap[division] = result.data || []
      }
    }

    setTopClassrooms(topClassroomsMap)
    setLoading(false)
  }

  const handleDeclareWinner = async (division: string, classroom: any) => {
    if (!classroom) return

    setLoading(true)
    const result = await declareMonthlyWinner(
      classroom.classroom.id,
      division,
      selectedYear,
      selectedMonth,
      classroom.totalScore,
      classroom.averageScore,
      classroom.evaluationCount
    )
    setLoading(false)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message || "Winner declared successfully",
      })
      loadWinners()
      loadTopClassrooms()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to declare winner",
        variant: "destructive",
      })
    }
  }

  const handleDeleteWinner = async () => {
    if (!deleteDialog.winnerId) return

    setLoading(true)
    const result = await deleteMonthlyWinner(deleteDialog.winnerId)
    setLoading(false)
    setDeleteDialog({ open: false, winnerId: "" })

    if (result.success) {
      toast({
        title: "Success",
        description: result.message || "Winner deleted successfully",
      })
      loadWinners()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete winner",
        variant: "destructive",
      })
    }
  }

  const getWinnerForDivision = (division: string) => {
    return winners.find(w => w.division === division)
  }

  const getTopClassroomsForDivision = (division: string) => {
    return topClassrooms[division] || []
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Month & Year
          </CardTitle>
          <CardDescription>Choose the month and year to declare winners for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winners by Division */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DIVISIONS.map((division) => {
          const winner = getWinnerForDivision(division)
          const topClassroomsList = getTopClassroomsForDivision(division)

          return (
            <motion.div
              key={division}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={winner ? "border-primary border-2" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{division}</span>
                    {winner && (
                      <Award className="h-5 w-5 text-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {winner ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrophyIcon className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-primary">Winner</span>
                        </div>
                        <p className="font-medium">{winner.classrooms?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">Grade {winner.classrooms?.grade || "N/A"}</p>
                        <div className="mt-2 pt-2 border-t border-primary/20">
                          <div className="flex justify-between text-sm">
                            <span>Total Score:</span>
                            <span className="font-semibold">{winner.total_score}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Score:</span>
                            <span className="font-semibold">{winner.average_score.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Evaluations:</span>
                            <span className="font-semibold">{winner.evaluation_count}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setDeleteDialog({ open: true, winnerId: winner.id })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Winner
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topClassroomsList.length > 0 ? (
                        <>
                          <p className="text-sm font-medium text-muted-foreground">Top Classrooms:</p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {topClassroomsList.slice(0, 5).map((classroom, index) => (
                              <div
                                key={classroom.classroom.id}
                                className="p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{classroom.classroom.name}</span>
                                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Score: {classroom.totalScore}</span>
                                  <span>Avg: {classroom.averageScore.toFixed(1)}</span>
                                  <span>{classroom.evaluationCount} evals</span>
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => handleDeclareWinner(division, classroom)}
                                  disabled={loading}
                                >
                                  <Award className="h-3 w-3 mr-1" />
                                  Declare Winner
                                </Button>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No evaluations found for this division in {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Winners History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5" />
            Winners History
          </CardTitle>
          <CardDescription>View all declared winners</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : winners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No winners declared for {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </div>
          ) : (
            <div className="space-y-3">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrophyIcon className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{winner.division}</span>
                    </div>
                    <p className="font-medium">{winner.classrooms?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {MONTHS.find(m => m.value === winner.month)?.label} {winner.year} • 
                      Score: {winner.total_score} • 
                      Avg: {winner.average_score.toFixed(1)}
                    </p>
                    {winner.declared_by_user && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Declared by: {winner.declared_by_user.name}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, winnerId: winner.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, winnerId: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Winner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the winner declaration. You can declare a new winner for this division and month later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWinner} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
