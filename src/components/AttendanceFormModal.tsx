import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { db } from "@/firebaseConfig"
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"

type Subject = {
  id: string
  name: string
}

type Student = {
  id: string
  firstName: string
  lastName: string
}

type Attendance = {
  id: string
  studentId: string
  courseId: string
  subject: string
  date: string
  present: boolean
}

export function AttendanceModal({
  subjects,
  students,
  attendances,
  courseId,
}: {
  subjects: Subject[]
  students: Student[]
  attendances: Attendance[]
  courseId: string
}) {
  const today = new Date().toISOString().split("T")[0]
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(subjects[0]?.name || "")
  const [date, setDate] = useState(today)
  const [map, setMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return
    const m: Record<string, boolean> = {}
    students.forEach((s) => {
      const rec = attendances.find(
        (a) =>
          a.studentId === s.id &&
          a.courseId === courseId &&
          a.subject === subject &&
          a.date === date
      )
      m[s.id] = rec?.present || false
    })
    setMap(m)
  }, [open, subject, date, students, attendances, courseId])

  const toggle = (id: string) => setMap((p) => ({ ...p, [id]: !p[id] }))

  const save = async () => {
    for (const s of students) {
      const present = map[s.id]
      const rec = attendances.find(
        (a) =>
          a.studentId === s.id &&
          a.courseId === courseId &&
          a.subject === subject &&
          a.date === date
      )
      if (rec) {
        await updateDoc(doc(db, "attendances", rec.id), { present })
      } else {
        await addDoc(collection(db, "attendances"), {
          studentId: s.id,
          courseId,
          subject,
          date,
          present,
          createdAt: new Date().toISOString(),
        })
      }
    }
    setOpen(false)
  }

  return (
    <div>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
            />
          </div>
          <div className="h-48 overflow-auto border rounded p-2">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center py-1"
              >
                <span>
                  {s.firstName} {s.lastName}
                </span>
                <input
                  type="checkbox"
                  checked={map[s.id] || false}
                  onChange={() => toggle(s.id)}
                />
              </div>
            ))}
          </div>
        </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
    </div>

  )
}
