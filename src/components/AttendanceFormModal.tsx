import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, Check, Minus } from "lucide-react"
import { db } from "@/firebaseConfig"
import { updateDoc, doc, setDoc } from "firebase/firestore"

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
  onClose,
}: {
  subjects: Subject[]
  students: Student[]
  attendances: Attendance[]
  courseId: string
  onClose?: () => void
}) {
  const today = new Date().toISOString().split("T")[0]
  const [subject, setSubject] = useState(subjects[0]?.name || "")
  const [date, setDate] = useState(today)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
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
    setAttendanceMap(m)
  }, [subject, date, students, attendances, courseId])

  const toggleAttendance = (id: string) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const markAllPresent = () => {
    const newMap: Record<string, boolean> = {}
    students.forEach(s => newMap[s.id] = true)
    setAttendanceMap(newMap)
  }

  const markAllAbsent = () => {
    const newMap: Record<string, boolean> = {}
    students.forEach(s => newMap[s.id] = false)
    setAttendanceMap(newMap)
  }

  const save = async () => {
  setIsLoading(true)
  try {
    for (const s of students) {
      const present = attendanceMap[s.id] ?? false

      // ID único por alumno, materia, fecha, curso
      const docId = `${s.id}_${courseId}_${subject}_${date}`

      // Buscá el registro existente en attendances por id (si lo querés actualizar)
      const rec = attendances.find(a =>
        a.studentId === s.id &&
        a.courseId === courseId &&
        a.subject === subject &&
        a.date === date
      )

      if (rec) {
        // Actualizá si existe (por id de firestore real)
        await updateDoc(doc(db, "attendances", rec.id), { present })
      } else {
        // Crea SOLO si no existe, con docId único
        await setDoc(doc(db, "attendances", docId), {
          studentId: s.id,
          courseId,
          subject,
          date,
          present,
          createdAt: new Date()
        })
      }
    }
    // ...
  } catch (error) {
    console.error("Error saving attendance:", error)
  } finally {
    setIsLoading(false)
  }
}

  const presentCount = Object.values(attendanceMap).filter(Boolean).length
  const totalStudents = students.length

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Información adicional</h3>
              <p className="text-sm text-gray-600">
                {presentCount} de {totalStudents} estudiantes presentes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
            Subject
          </label>
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          onClick={markAllPresent}
          variant="outline"
          className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 rounded-xl py-2.5"
        >
          <Check className="w-4 h-4 mr-2" />
          Marcar Todos Presentes
        </Button>
        <Button
          onClick={markAllAbsent}
          variant="outline"
          className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 rounded-xl py-2.5"
        >
          <Minus className="w-4 h-4 mr-2" />
          Marcar Todos Ausentes
        </Button>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        <div className="grid gap-3">
          {students.map((student) => {
            const isPresent = attendanceMap[student.id] || false
            return (
              <div
                key={student.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                  isPresent
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleAttendance(student.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                      isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className={`text-sm ${isPresent ? 'text-green-600' : 'text-gray-500'}`}>
                        {isPresent ? 'Presente' : 'Ausente'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    isPresent
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    {isPresent && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={isLoading}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Guardando...
            </div>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  )
}