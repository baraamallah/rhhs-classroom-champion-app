"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { archiveAndReset, deleteEvaluation, deleteClassroom } from "@/app/actions/data-management-actions"
import { Loader2, Trash2, Archive } from "lucide-react"

export function DataManagementPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "evaluation" | "classroom" | null
    id: string
  }>({ open: false, type: null, id: "" })
  const [archiveDialog, setArchiveDialog] = useState(false)
  const [evaluationId, setEvaluationId] = useState("")
  const [classroomId, setClassroomId] = useState("")

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
      {/* Archive and Reset Section */}
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

      {/* Delete Evaluation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Evaluation
          </CardTitle>
          <CardDescription>Delete a specific evaluation by its ID. Related data will remain intact.</CardDescription>
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

      {/* Delete Classroom Section */}
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

      {/* Archive & Reset Confirmation Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog.type === "evaluation" ? "Evaluation" : "Classroom"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === "evaluation"
                ? "This will delete the specific evaluation. This action cannot be undone."
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
