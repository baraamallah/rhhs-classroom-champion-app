"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getClassrooms, getClassroomsBySupervisor } from "@/lib/supabase-data"
import type { Classroom } from "@/lib/types"

interface ClassroomSelectorProps {
  onSelect: (classroom: Classroom) => void
}

import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function ClassroomSelector({ onSelect }: ClassroomSelectorProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [filteredClassrooms, setFilteredClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        let data: Classroom[] = []

        if (response.ok) {
          const { user } = (await response.json()) as { user?: { id: string; role: string } }
          if (user) {
            setCurrentUser(user)
            if (user.role === "supervisor") {
              data = await getClassroomsBySupervisor(user.id)
            } else {
              data = await getClassrooms()
            }
          } else {
            data = await getClassrooms()
          }
        } else {
          data = await getClassrooms()
        }

        setClassrooms(data)
        setFilteredClassrooms(data)
      } catch (error) {
        console.error("Error fetching classrooms:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClassrooms()
  }, [])

  useEffect(() => {
    const filtered = classrooms.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.grade.toString().includes(searchQuery) ||
      (c.division && c.division.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredClassrooms(filtered)
  }, [searchQuery, classrooms])

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading classrooms...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search classrooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No classrooms found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredClassrooms.map((classroom, index) => (
            <motion.div
              key={classroom.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-start hover:bg-primary/5 hover:border-primary/50 transition-all bg-card text-left whitespace-normal"
                onClick={() => onSelect(classroom)}
              >
                <span className="font-semibold text-lg text-foreground w-full truncate">{classroom.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                  <span>Grade {classroom.grade}</span>
                  {classroom.division && (
                    <>
                      <span>•</span>
                      <span>{classroom.division}</span>
                    </>
                  )}
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
