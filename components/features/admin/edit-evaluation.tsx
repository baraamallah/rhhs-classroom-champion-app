"use client"
import { useEffect, useState, useMemo } from "react"
import { getClassrooms } from "@/lib/supabase-data"
import type { Classroom } from "@/lib/types"
import { DIVISION_OPTIONS } from "@/lib/division-display"
import { loadEvaluationEditor, saveEvaluationEdit } from "@/app/actions/edit-evaluation-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminPageHeader } from "./admin-page-header"

const editorDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Beirut",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
})

type Loaded = NonNullable<Awaited<ReturnType<typeof loadEvaluationEditor>>>
export function EditEvaluation({ onSaved }: { onSaved: () => void }) {
  const [classes, setClasses] = useState<Classroom[]>([])
  const [date, setDate] = useState(() => editorDateFormatter.format(new Date()))
  const [division, setDivision] = useState("")
  const [classId, setClassId] = useState("")
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  useEffect(() => {
    void getClassrooms().then(setClasses)
  }, [])
  const original = loaded
    ? Object.keys(loaded.evaluation.items)
        .filter((k) => loaded.evaluation.items[k])
        .sort()
    : []
  const changed = JSON.stringify([...checked].sort()) !== JSON.stringify(original)
  const dirty = !!loaded && (changed || notes !== (loaded.evaluation.notes || ""))
  const reset = (data: Loaded) => {
    setLoaded(data)
    setChecked(Object.keys(data.evaluation.items).filter((k) => data.evaluation.items[k]))
    setNotes(data.evaluation.notes || "")
  }
  const changeSelection = (fn: () => void) => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return
    fn()
    setLoaded(null)
    setMessage("")
  }
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])
  const run = async (save = false) => {
    setBusy(true)
    setMessage("")
    try {
      if (save && loaded) {
        await saveEvaluationEdit(loaded.evaluation.id, checked, notes)
        onSaved()
      }
      const result = await loadEvaluationEditor(classId, date)
      if (result) reset(result)
      else setLoaded(null)
      setMessage(
        save ? "Evaluation saved." : result ? "" : "No editable evaluation found. Archived evaluations are read-only."
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not complete the request.")
    } finally {
      setBusy(false)
    }
  }
  const checkedIds = useMemo(() => new Set(checked), [checked])

  const max = loaded?.items.reduce((s, i) => s + i.points, 0) || 0
  const total = loaded?.items.reduce((s, i) => s + (checkedIds.has(i.id) ? i.points : 0), 0) || 0
  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Administration"
        title="Edit Evaluation"
        description="Choose a date, division, and class to correct an existing evaluation."
      />
      <EvaluationSelectionFields
        busy={busy}
        changeSelection={changeSelection}
        classId={classId}
        classes={classes}
        date={date}
        dirty={dirty}
        division={division}
        run={run}
        setClassId={setClassId}
        setDate={setDate}
        setDivision={setDivision}
      />
      {message && <p role="status">{message}</p>}
      {loaded && (
        <EvaluationCorrectionFields
          busy={busy}
          changed={changed}
          checked={checked}
          checkedIds={checkedIds}
          date={date}
          dirty={dirty}
          loaded={loaded}
          max={max}
          notes={notes}
          original={original}
          reset={reset}
          run={run}
          setChecked={setChecked}
          setNotes={setNotes}
          total={total}
        />
      )}
    </div>
  )
}

function EvaluationSelectionFields({
  busy,
  changeSelection,
  classId,
  classes,
  date,
  dirty,
  division,
  run,
  setClassId,
  setDate,
  setDivision
}: {
  busy: boolean
  changeSelection: (fn: () => void) => void
  classId: string
  classes: Classroom[]
  date: string
  dirty: boolean
  division: string
  run: (save?: boolean) => Promise<void>
  setClassId: import("react").Dispatch<import("react").SetStateAction<string>>
  setDate: import("react").Dispatch<import("react").SetStateAction<string>>
  setDivision: import("react").Dispatch<import("react").SetStateAction<string>>
}) {
  return (
    <fieldset disabled={busy} className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">
      <label>
        Date
        <Input type="date" value={date} onChange={(e) => changeSelection(() => setDate(e.target.value))} />
      </label>
      <label>
        Division
        <select
          className="block w-full rounded-md border p-2 bg-background"
          value={division}
          onChange={(e) =>
            changeSelection(() => {
              setDivision(e.target.value)
              setClassId("")
            })
          }
        >
          <option value="">Choose division</option>
          {DIVISION_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Class
        <select
          className="block w-full rounded-md border p-2 bg-background"
          disabled={!division}
          value={classId}
          onChange={(e) => changeSelection(() => setClassId(e.target.value))}
        >
          <option value="">Choose class</option>
          {classes
            .filter((c) => c.division === division)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.grade}
              </option>
            ))}
        </select>
      </label>
      <Button disabled={!date || !classId || busy || dirty} onClick={() => void run()}>
        {busy ? "Loading…" : "Load Evaluation"}
      </Button>
    </fieldset>
  )
}

function EvaluationCorrectionFields({
  busy,
  changed,
  checked,
  checkedIds,
  date,
  dirty,
  loaded,
  max,
  notes,
  original,
  reset,
  run,
  setChecked,
  setNotes,
  total
}: {
  busy: boolean
  changed: boolean
  checked: string[]
  checkedIds: Set<string>
  date: string
  dirty: boolean
  loaded: { evaluation: import("@/lib/types").Evaluation; items: import("@/lib/types").ChecklistItem[] } | null
  max: number
  notes: string
  original: string[]
  reset: (data: Loaded) => void
  run: (save?: boolean) => Promise<void>
  setChecked: import("react").Dispatch<import("react").SetStateAction<string[]>>
  setNotes: import("react").Dispatch<import("react").SetStateAction<string>>
  total: number
}) {
  if (!loaded) return null
  return (
    <fieldset disabled={busy} className="space-y-4 rounded-2xl border bg-card p-5">
      <p>
        {loaded.evaluation.classroom?.name} · {date} · {loaded.evaluation.supervisor?.name}
      </p>
      <p>
        Saved score: {loaded.evaluation.total_score}/{loaded.evaluation.max_score} · Updated score:{" "}
        {changed ? total : loaded.evaluation.total_score}/{changed ? max : loaded.evaluation.max_score}
      </p>
      {(max !== loaded.evaluation.max_score || original.some((k) => !loaded.items.some((i) => i.id === k))) && (
        <p className="text-amber-700">
          The rubric has changed. Checklist edits use current criteria and points; unavailable criteria will be removed.
          Notes-only edits preserve the saved score.
        </p>
      )}
      {loaded.items.map((item) => (
        <label key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={checkedIds.has(item.id)}
            onChange={(e) =>
              setChecked((prev) =>
                e.target.checked
                  ? [...prev.filter((k) => loaded.items.some((i) => i.id === k)), item.id]
                  : prev.filter((k) => k !== item.id && loaded.items.some((i) => i.id === k))
              )
            }
          />
          <span>
            {item.title} ({item.points} points)
          </span>
        </label>
      ))}
      <label className="block">
        Notes
        <textarea
          className="mt-2 block w-full rounded-md border bg-background p-3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <Button disabled={busy || !dirty} onClick={() => void run(true)}>
        {busy ? "Saving…" : "Save Changes"}
      </Button>{" "}
      <Button variant="outline" disabled={busy || !dirty} onClick={() => reset(loaded)}>
        Reset Changes
      </Button>
    </fieldset>
  )
}
