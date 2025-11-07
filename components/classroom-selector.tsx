"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getClassrooms, getClassroomsBySupervisor } from "@/lib/supabase-data"
import type { Classroom } from "@/lib/types"

interface ClassroomSelectorProps {
  onSelect: (classroom: Classroom) => void
}

export function ClassroomSelector({ onSelect }: ClassroomSelectorProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        if (response.ok) {
          const { user } = (await response.json()) as { user?: { id: string; role: string } }
          if (user) {
            setCurrentUser(user)
            if (user.role === "supervisor") {
              const supervisorClassrooms = await getClassroomsBySupervisor(user.id)
              setClassrooms(supervisorClassrooms)
              setLoading(false)
              return
            }
          }
        }
        const data = await getClassrooms()
        setClassrooms(data)
      } catch (error) {
        console.error("Error fetching classrooms:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClassrooms()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading classrooms...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Select a Classroom to Evaluate</CardTitle>
          <CardDescription>Choose the classroom you want to evaluate today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((classroom) => (
              <Button
                key={classroom.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start hover:bg-primary/10 hover:border-primary transition-colors bg-transparent"
                onClick={() => onSelect(classroom)}
              >
                <span className="font-semibold text-lg text-foreground">{classroom.name}</span>
                <span className="text-xs text-muted-foreground">{classroom.grade}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
