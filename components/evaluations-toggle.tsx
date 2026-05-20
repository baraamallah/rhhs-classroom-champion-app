"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Play, Square, Settings2 } from "lucide-react"
import { getEvaluationsStatus, setEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"

export function EvaluationsToggle() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    const result = await getEvaluationsStatus()
    if (result.success) {
      setEnabled(result.enabled ?? true)
    }
    setLoading(false)
  }

  const handleToggle = async () => {
    setSaving(true)
    const newStatus = !enabled
    const result = await setEvaluationsStatus(newStatus)
    setSaving(false)

    if (result.success) {
      setEnabled(newStatus)
      toast({
        title: "Success",
        description: newStatus
          ? "System is now accepting evaluations"
          : "System is now closed for evaluations",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update evaluation status",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Submission Control
        </CardTitle>
        <CardDescription>
          Open or close the system for new evaluations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Evaluations Status</p>
            <p className="text-sm text-muted-foreground">
              {enabled ? "System is currently accepting evaluations" : "System is currently closed"}
            </p>
          </div>
          <Button
            onClick={handleToggle}
            disabled={loading || saving}
            variant={enabled ? "destructive" : "default"}
          >
            {loading ? (
              "Loading..."
            ) : enabled ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Close System
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Open System
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
