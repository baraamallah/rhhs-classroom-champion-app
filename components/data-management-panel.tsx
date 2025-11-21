"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  deleteEvaluation,
  deleteClassroom,
  archiveEvaluations,
  getAllEvaluationsForManagement,
  getArchivedEvaluations,
} from "@/app/actions/data-management-actions"
import { Loader2, Trash2, Archive, Search, History } from "lucide-react"

interface EvaluationData {
  id: string
  evaluation_date: string
  total_score: number
  max_score: number
  created_at: string
  classrooms: { name: string; grade: string } | null
  users: { name: string } | null
}

export function DataManagementPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "evaluation" | "classroom" | null
    id: string
  }>({ open: false, type: null, id: "" })

  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean
    count: number
  }>({ open: false, count: 0 })

  const [evaluationId, setEvaluationId] = useState("")
  const [classroomId, setClassroomId] = useState("")
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([])
  const [archivedEvaluations, setArchivedEvaluations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])

  useEffect(() => {
    loadEvaluations()
    loadArchivedEvaluations()
  }, [])

  const loadEvaluations = async () => {
    const result = await getAllEvaluationsForManagement()
    if (result.success && result.data) {
      setEvaluations(result.data as EvaluationData[])
    }
  }

  const loadArchivedEvaluations = async () => {
    const result = await getArchivedEvaluations()
    if (result.success && result.data) {
      setArchivedEvaluations(result.data)
    } else if (result.error) {
      toast({
        title: "Error loading archive",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const filteredEvaluations = useMemo(() => {
    if (!searchTerm) return evaluations
    const term = searchTerm.toLowerCase()
    return evaluations.filter(
      (evaluation) =>
        evaluation.classrooms?.name.toLowerCase().includes(term) ||
        evaluation.classrooms?.grade.toLowerCase().includes(term) ||
        evaluation.users?.name.toLowerCase().includes(term) ||
        new Date(evaluation.evaluation_date).toLocaleDateString().includes(term)
    )
  }, [evaluations, searchTerm])

  const handleSelectAll = () => {
    if (selectedEvaluations.length === filteredEvaluations.length) {
      setSelectedEvaluations([])
    } else {
      setSelectedEvaluations(filteredEvaluations.map((e) => e.id))
    }
  }

  const toggleSelection = (id: string) => {
    if (selectedEvaluations.includes(id)) {
      setSelectedEvaluations(selectedEvaluations.filter((e) => e !== id))
    } else {
      setSelectedEvaluations([...selectedEvaluations, id])
    }
  }

  const handleArchiveSelected = async () => {
    if (selectedEvaluations.length === 0) return

    setLoading(true)
    const result = await archiveEvaluations(selectedEvaluations)
    setLoading(false)
    setArchiveDialog({ open: false, count: 0 })

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setSelectedEvaluations([])
      loadEvaluations()
      loadArchivedEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to archive evaluations",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvaluation = async () => {
    if (!evaluationId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an evaluation ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await deleteEvaluation(evaluationId)
    setLoading(false)
    setDeleteDialog({ open: false, type: null, id: "" })

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setEvaluationId("")
      loadEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete evaluation",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClassroom = async () => {
    if (!classroomId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a classroom ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await deleteClassroom(classroomId)
    setLoading(false)
    setDeleteDialog({ open: false, type: null, id: "" })

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setClassroomId("")
      loadEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete classroom",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Evaluations
          </CardTitle>
          <CardDescription>
            Select evaluations to move to the archive. Archived evaluations are removed from the active list but preserved for history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by classroom, grade, supervisor, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
                className="pl-10"
              />
            </div>
            <Button
              variant={selectedEvaluations.length > 0 ? "default" : "outline"}
              onClick={() => setArchiveDialog({ open: true, count: selectedEvaluations.length })}
              disabled={loading || selectedEvaluations.length === 0}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive ({selectedEvaluations.length})
            </Button>
          </div>

          <div className="border rounded-md">
            <div className="flex items-center p-3 border-b bg-muted/50">
              <Checkbox
                checked={selectedEvaluations.length === filteredEvaluations.length && filteredEvaluations.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={loading || filteredEvaluations.length === 0}
              />
              <span className="ml-3 text-sm font-medium text-muted-foreground">
                {selectedEvaluations.length} selected
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {filteredEvaluations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No evaluations found.
                </div>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center p-3 border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedEvaluations.includes(evaluation.id)}
                      onCheckedChange={() => toggleSelection(evaluation.id)}
                      disabled={loading}
                    />
                    <div className="ml-3 flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {evaluation.classrooms?.name || "Unknown"}
                          <span className="text-muted-foreground font-normal ml-1">
                            ({evaluation.classrooms?.grade || "N/A"})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supervisor: {evaluation.users?.name || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right md:text-left">
                        <p className="text-sm">
                          Score: {evaluation.total_score}/{evaluation.max_score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evaluation.evaluation_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Archived Evaluations
          </CardTitle>
          <CardDescription>
            View previously archived evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Total Archived: {archivedEvaluations.length}
                </p>
                {archivedEvaluations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No archived evaluations found.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {archivedEvaluations.map((evalItem) => (
                      <div
                        key={evalItem.id}
                        className="flex justify-between items-center p-2 border rounded hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {evalItem.classrooms?.name || "Unknown Classroom"}{" "}
                            <span className="text-muted-foreground font-normal">
                              ({evalItem.classrooms?.grade || "N/A"})
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supervisor: {evalItem.users?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Date: {new Date(evalItem.evaluation_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Score: {evalItem.total_score}/{evalItem.max_score}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Archived:{" "}
                            {evalItem.archived_at ? new Date(evalItem.archived_at).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={loadArchivedEvaluations} disabled={loading} size="sm">
              <History className="mr-2 h-4 w-4" />
              Refresh Archive
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Evaluation
            </CardTitle>
            <CardDescription>Permanently delete a specific evaluation by its ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter evaluation ID (UUID)"
              value={evaluationId}
              onChange={(e) => setEvaluationId(e.target.value)}
              disabled={loading}
            />
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: true, type: "evaluation", id: evaluationId })}
              disabled={loading || !evaluationId.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Evaluation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Classroom
            </CardTitle>
            <CardDescription>
              Delete a specific classroom and all its associated evaluations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter classroom ID (UUID)"
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              disabled={loading}
            />
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: true, type: "classroom", id: classroomId })}
              disabled={loading || !classroomId.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Classroom
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={archiveDialog.open} onOpenChange={(open) => setArchiveDialog({ ...archiveDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveDialog.count} Evaluations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the selected evaluations to the archive table and remove them from the active list.
              This action preserves the data for history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchiveSelected}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive Selected
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog.type === "evaluation" ? "Evaluation" : "Classroom"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === "evaluation"
                ? "This will permanently delete the specific evaluation. This action cannot be undone."
                : "This will delete the classroom and all its associated evaluations. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteDialog.type === "evaluation" ? handleDeleteEvaluation : handleDeleteClassroom}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
