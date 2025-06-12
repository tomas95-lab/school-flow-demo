import { DataTable } from "@/app/asistencias/data-table"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { columnsDetalle } from "@/app/asistencias/columns"
import type { AttendanceRow } from "@/app/asistencias/columns"
import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { SchoolSpinner } from "./SchoolSpinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  UserCheck, 
  UserX, 
  BookOpen,
  TrendingDown,
  Download,
  Eye,
  EyeClosed
} from "lucide-react"

export default function DetalleAsistencia() {
  const [searchParams] = useSearchParams()
  const [id] = useState(searchParams.get("id"))
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set())
  
  const { data: courses } = useFirestoreCollection("courses")
  const { data: students } = useFirestoreCollection("students")
  const { data: subjects } = useFirestoreCollection("subjects")
  const { data: asistencias } = useFirestoreCollection("attendances")

  const course = courses.find((c) => c.firestoreId === id)
  const studentsInCourse = students.filter((s) => s.cursoId === id)
  const subjectsInCourse = subjects.filter((s) => s.cursoId === id)

  // Estadísticas generales del curso
  const courseStats = useMemo(() => {
    const totalStudents = studentsInCourse.length
    const totalSubjects = subjectsInCourse.length
    
    // Calcular estadísticas de asistencia por materia
  const subjectStats = subjectsInCourse.map(subject => {
    // Contamos cuántos alumnos del curso están presentes en ESTE registro
    const presentCount = studentsInCourse.reduce((acc, student) => {
      const rec = asistencias.find(a =>
        a.studentId === student.firestoreId &&
        a.courseId  === id &&
        a.subject   === subject.nombre
      )
      return acc + (rec?.presente ? 1 : 0)
    }, 0)

    const totalStudents = studentsInCourse.length
    const absentCount  = totalStudents - presentCount
    const percentage   = totalStudents > 0
      ? Math.round((presentCount / totalStudents) * 100)
      : 0

    return {
      subject:  subject.nombre,
      present:  presentCount,
      absent:   absentCount,
      total:    totalStudents,
      percentage
    }
})


    const overallPresent = subjectStats.reduce((acc, s) => acc + s.present, 0)
    const overallTotal = subjectStats.reduce((acc, s) => acc + s.total, 0)
    const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0

    return {
      totalStudents,
      totalSubjects,
      overallPercentage,
      subjectStats
    }
  }, [studentsInCourse, subjectsInCourse, asistencias, id])

  const toggleSubjectCollapse = (subjectId: string) => {
    const newCollapsed = new Set(collapsedSubjects)
    if (newCollapsed.has(subjectId)) {
      newCollapsed.delete(subjectId)
    } else {
      newCollapsed.add(subjectId)
    }
    setCollapsedSubjects(newCollapsed)
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header mejorado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{course.nombre}</h1>
              <Badge variant="secondary" className="ml-2">
                División {course.division}
              </Badge>
            </div>
            <p className="text-gray-600">
              Gestión de asistencias • Año {course.año}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Estudiantes</p>
                  <p className="text-2xl font-bold">{courseStats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Asistencia General</p>
                  <p className="text-2xl font-bold">{courseStats.overallPercentage}%</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Materias</p>
                  <p className="text-2xl font-bold">{courseStats.totalSubjects}</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Alertas</p>
                  <p className="text-2xl font-bold">
                    {courseStats.subjectStats.filter(s => s.percentage < 80).length}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vista por materias mejorada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Asistencia por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjectsInCourse.map((subject) => {
              const dataPorMateria: AttendanceRow[] = studentsInCourse.map((student) => {
                const asistencia = asistencias.find(
                  (a) =>
                    a.studentId === student.firestoreId &&
                    a.courseId === course.firestoreId &&
                    a.subject === subject.nombre
                )
                return {
                  id: student.firestoreId,
                  Nombre: `${student.nombre} ${student.apellido}`,
                  presente: Boolean(asistencia?.presente),
                  fecha: asistencia?.fecha ?? new Date().toISOString(),
                }
              })

              const subjectStat = courseStats.subjectStats.find(s => s.subject === subject.nombre)
              const isCollapsed = subject.firestoreId ? collapsedSubjects.has(subject.firestoreId) : false

              return (
                <div key={subject.firestoreId} className="space-y-4">
                  {/* Header de la materia */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => subject.firestoreId && toggleSubjectCollapse(subject.firestoreId)}
                        className="p-1"
                        disabled={!subject.firestoreId}
                      >
                        {isCollapsed ? (
                          <EyeClosed className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {subject.nombre}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subjectStat?.total || 0} registros de asistencia
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Estadísticas rápidas */}
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          {subjectStat?.present || 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-700">
                          {subjectStat?.absent || 0}
                        </span>
                      </div>

                      <Badge 
                        variant={subjectStat && subjectStat.percentage >= 80 ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {subjectStat?.percentage || 0}% asistencia
                      </Badge>
                    </div>
                  </div>

                  {/* Tabla colapsable */}
                  {!isCollapsed && (
                    <div className="bg-white rounded-lg border shadow-sm">
                      <DataTable<AttendanceRow, any>
                        columns={columnsDetalle}
                        data={dataPorMateria}
                        placeholder="Buscar alumno..."
                        filters={[
                          {
                            type: "button",
                            label: "Solo presentes",
                            onClick: (table) =>
                              table.getColumn("presente")?.setFilterValue(true),
                          },
                          {
                            type: "button",
                            label: "Solo ausentes",
                            onClick: (table) =>
                              table.getColumn("presente")?.setFilterValue(false),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}