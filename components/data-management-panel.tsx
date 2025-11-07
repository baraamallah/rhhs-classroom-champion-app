"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { archiveAndReset, deleteEvaluation, deleteClassroom, archiveEvaluation, getAllEvaluationsForManagement } from "@/app/actions/data-management-actions"
import { Loader2, Trash2, Archive, Search } from "lucide-react"

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
  const [archiveDialog, setArchiveDialog] = useState(false)
  const [archiveEvalDialog, setArchiveEvalDialog] = useState<{
    open: boolean
    id: string
  }>({ open: false, id: "" })
  const [evaluationId, setEvaluationId] = useState("")
  const [classroomId, setClassroomId] = useState("")
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("")

  useEffect(() => {
    loadEvaluations()
  }, [])

  const loadEvaluations = async () => {
    const result = await getAllEvaluationsForManagement()
    if (result.success && result.data) {
      setEvaluations(result.data as EvaluationData[])
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

  const handleArchiveAndReset = async () => {
    setLoading(true)
    const result = await archiveAndReset()
    setLoading(false)
    setArchiveDialog(false)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setEvaluationId("")
      setClassroomId("")
      setSelectedEvaluation("")
      loadEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to archive and reset data",
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
      setSelectedEvaluation("")
      loadEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete evaluation",
        variant: "destructive",
      })
    }
  }

  const handleArchiveEvaluation = async () => {
    const evalId = archiveEvalDialog.id || selectedEvaluation
    if (!evalId) {
      toast({
        title: "Error",
        description: "Please select an evaluation",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await archiveEvaluation(evalId)
    setLoading(false)
    setArchiveEvalDialog({ open: false, id: "" })

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      setSelectedEvaluation("")
      loadEvaluations()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to archive evaluation",
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
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive & Reset
          </CardTitle>
          <CardDescription>
            Move all evaluations and classrooms to archive tables and reset the main tables. This action cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setArchiveDialog(true)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive All Data & Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Evaluation
          </CardTitle>
          <CardDescription>Archive a specific evaluation. It will be moved to archive table and removed from active data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="evaluation-search"
              name="evaluation-search"
              placeholder="Search by classroom, grade, supervisor, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedEvaluation}
            onValueChange={(value) => {
              setSelectedEvaluation(value)
              setEvaluationId(value)
            }}
            disabled={loading}
            name="evaluation-select"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an evaluation to archive" />
            </SelectTrigger>
            <SelectContent>
              {filteredEvaluations.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">No evaluations found</div>
              )}
              {filteredEvaluations.map((evaluation) => (
                <SelectItem key={evaluation.id} value={evaluation.id}>
                  {evaluation.classrooms?.name || "Unknown"} ({evaluation.classrooms?.grade || "N/A"}) -{" "}
                  {new Date(evaluation.evaluation_date).toLocaleDateString()} - Score: {evaluation.total_score}/{evaluation.max_score}
                  {evaluation.users?.name && ` - ${evaluation.users.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setArchiveEvalDialog({ open: true, id: selectedEvaluation })}
            disabled={loading || !selectedEvaluation}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive Selected Evaluation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Evaluation
          </CardTitle>
          <CardDescription>Permanently delete a specific evaluation by its ID. This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="evaluation-id-delete"
            name="evaluation-id-delete"
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
            Delete a specific classroom and all its associated evaluations. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="classroom-id-delete"
            name="classroom-id-delete"
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

      <AlertDialog open={archiveDialog} onOpenChange={setArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive & Reset Everything?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move all evaluations and classrooms to archive tables and reset the main tables. This action
              cannot be undone. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchiveAndReset}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive & Reset
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveEvalDialog.open} onOpenChange={(open) => setArchiveEvalDialog({ ...archiveEvalDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the selected evaluation to the archive table and remove it from active data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchiveEvaluation}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive
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
