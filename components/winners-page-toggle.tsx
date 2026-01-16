"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Trophy } from "lucide-react"
import { getWinnersPageVisibility, setWinnersPageVisibility } from "@/app/actions/winners-page-actions"

export function WinnersPageToggle() {
  const { toast } = useToast()
  const [visible, setVisible] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadVisibility()
  }, [])

  const loadVisibility = async () => {
    setLoading(true)
    const result = await getWinnersPageVisibility()
    if (result.success) {
      setVisible(result.visible ?? true)
    }
    setLoading(false)
  }

  const handleToggle = async () => {
    setSaving(true)
    const newVisibility = !visible
    const result = await setWinnersPageVisibility(newVisibility)
    setSaving(false)

    if (result.success) {
      setVisible(newVisibility)
      toast({
        title: "Success",
        description: newVisibility
          ? "Winners page is now visible to all users"
          : "Winners page is now hidden",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update visibility",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Winners Page Control
        </CardTitle>
        <CardDescription>
          Control the visibility of the animated winners/leaderboard page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Winners Page Visibility</p>
            <p className="text-sm text-muted-foreground">
              {visible ? "Page is currently visible to all users" : "Page is currently hidden"}
            </p>
          </div>
          <Button
            onClick={handleToggle}
            disabled={loading || saving}
            variant={visible ? "default" : "outline"}
          >
            {loading ? (
              "Loading..."
            ) : visible ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Page
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Page
              </>
            )}
          </Button>
        </div>
        {visible && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Users can access the winners page at: <code className="text-primary">/winners</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

