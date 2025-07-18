import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, Check, Minus, Search, Clock, AlertCircle, Save, X, RotateCcw } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        save()
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        markAllPresent()
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        markAllAbsent()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [attendanceMap])

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

  const resetAttendance = () => {
    const newMap: Record<string, boolean> = {}
    students.forEach(s => newMap[s.id] = false)
    setAttendanceMap(newMap)
  }

  const save = async () => {
    setIsLoading(true)
    setSaveSuccess(false)
    try {
      for (const s of students) {
        const present = attendanceMap[s.id] ?? false

        const docId = `${s.id}_${courseId}_${subject}_${date}`

        const rec = attendances.find(a =>
          a.studentId === s.id &&
          a.courseId === courseId &&
          a.subject === subject &&
          a.date === date
        )

        if (rec) {
          await updateDoc(doc(db, "attendances", rec.id), { present })
        } else {
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
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving attendance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const presentCount = Object.values(attendanceMap).filter(Boolean).length
  const totalStudents = students.length
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get attendance history for the selected date and subject
  const getAttendanceHistory = () => {
    return attendances.filter(a => 
      a.courseId === courseId && 
      a.subject === subject && 
      a.date === date
    )
  }

  const history = getAttendanceHistory()
  const hasExistingData = history.length > 0

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Enhanced Header with better stats */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl shadow-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Registro de Asistencias</h3>
              <p className="text-sm text-gray-600">Gestiona la asistencia de tus estudiantes</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{attendancePercentage}%</div>
            <div className="text-sm text-gray-600">Asistencia</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{presentCount}</div>
            <div className="text-xs text-gray-600">Presentes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{totalStudents - presentCount}</div>
            <div className="text-xs text-gray-600">Ausentes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{totalStudents}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Form Controls with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
            Materia
          </label>
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none cursor-pointer shadow-sm"
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
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      {/* Existing data warning */}
      {hasExistingData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Ya existe registro para esta fecha y materia
              </p>
              <p className="text-xs text-amber-700">
                Los datos existentes se actualizarán al guardar
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Quick Actions */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={markAllPresent}
            variant="outline"
            className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 rounded-xl py-2.5 transition-all duration-200"
          >
            <Check className="w-4 h-4 mr-2" />
            Todos Presentes
          </Button>
          <Button
            onClick={markAllAbsent}
            variant="outline"
            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 rounded-xl py-2.5 transition-all duration-200"
          >
            <Minus className="w-4 h-4 mr-2" />
            Todos Ausentes
          </Button>
          <Button
            onClick={resetAttendance}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl py-2.5 transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Students List with enhanced design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Estudiantes ({filteredStudents.length})</h4>
          <div className="text-xs text-gray-500">
            Ctrl+S: Guardar | Ctrl+A: Todos presentes | Ctrl+D: Todos ausentes
          </div>
        </div>
        
        <div className="grid gap-3">
          {filteredStudents.map((student) => {
            const isPresent = attendanceMap[student.id] || false
            const studentHistory = attendances.filter(a => 
              a.studentId === student.id && 
              a.courseId === courseId && 
              a.subject === subject
            ).slice(-5) // Last 5 records
            
            const recentAttendance = studentHistory.length > 0 
              ? studentHistory.filter(a => a.present).length / studentHistory.length 
              : null

            return (
              <div
                key={student.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                  isPresent
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                    : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleAttendance(student.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      isPresent ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className={`text-sm font-medium ${isPresent ? 'text-green-600' : 'text-gray-500'}`}>
                          {isPresent ? '✓ Presente' : '✗ Ausente'}
                        </p>
                        {recentAttendance !== null && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {Math.round(recentAttendance * 100)}% últimas 5 clases
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-sm ${
                    isPresent
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    {isPresent && <Check className="w-5 h-5 text-white" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredStudents.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No se encontraron estudiantes con "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Asistencias guardadas exitosamente
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {hasExistingData ? 'Actualizando registro existente' : 'Creando nuevo registro'}
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border-gray-300 hover:bg-gray-100 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Asistencias</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
