import { DataTable } from "@/app/asistencias/data-table"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { columnsDetalle } from "@/app/asistencias/columns"
import type { AttendanceRow } from "@/app/asistencias/columns"
import { useState, useMemo, useEffect } from "react"
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


type AdminStatsCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
};

const DetallesStatsCard = ({ icon: Icon, label, value, subtitle, color = "indigo" }: AdminStatsCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 mr-2">{subtitle}</p>
        )}
      </div>
      <div className={`p-4 rounded-xl bg-${color}-100`}>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  </div>
)

export default function DetalleAsistencia() {
  const [searchParams] = useSearchParams()
  const [id] = useState(searchParams.get("id"))
  
  // Estado de colapsado por materia
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set())
  const [didInitCollapse, setDidInitCollapse] = useState(false)

  const { data: courses } = useFirestoreCollection("courses")
  const { data: students } = useFirestoreCollection("students")
  const { data: subjects } = useFirestoreCollection("subjects")
  const { data: asistencias } = useFirestoreCollection("attendances")

  const course = courses.find(c => c.firestoreId === id)
  const studentsInCourse = students.filter(s => s.cursoId === id)
  const subjectsInCourse = subjects.filter(s => s.cursoId === id)

  // ⏳ Inicializar colapsado UNA sola vez al llegar subjectsInCourse
  useEffect(() => {
    if (!didInitCollapse && subjectsInCourse.length > 0) {
      const allIds = subjectsInCourse
        .map(s => s.firestoreId)
        .filter((sid): sid is string => Boolean(sid))
      setCollapsedSubjects(new Set(allIds))
      setDidInitCollapse(true)
    }
  }, [subjectsInCourse, didInitCollapse])

  // Exportar CSV
  const exportToCSV = () => {
    if (!course) return

    const csvData: string[][] = []
    csvData.push(['Alumno','Materia','Estado','Fecha'])

    subjectsInCourse.forEach(subject => {
      studentsInCourse.forEach(student => {
        const rec = asistencias.find(a =>
          a.studentId === student.firestoreId &&
          a.courseId === course.firestoreId &&
          a.subject === subject.nombre
        )
        csvData.push([
          `${student.nombre} ${student.apellido}`,
          subject.nombre,
          rec?.presente ? 'Presente' : 'Ausente',
          rec?.fecha 
            ? new Date(rec.fecha).toLocaleDateString() 
            : 'N/A'
        ])
      })
    })

    const csvContent = csvData
      .map(row => row.map(f => `"${f}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `asistencias_${course.nombre}_division_${course.division}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Stats generales
  const courseStats = useMemo(() => {
    const totalStudents = studentsInCourse.length
    const totalSubjects = subjectsInCourse.length

    const subjectStats = subjectsInCourse.map(subject => {
      const presentCount = studentsInCourse.reduce((acc, student) => {
        const rec = asistencias.find(a =>
          a.studentId === student.firestoreId &&
          a.courseId  === id &&
          a.subject   === subject.nombre
        )
        return acc + (rec?.presente ? 1 : 0)
      }, 0)
      const absentCount = totalStudents - presentCount
      const percentage = totalStudents > 0
        ? Math.round((presentCount / totalStudents) * 100)
        : 0

      return {
        subject: subject.nombre,
        present: presentCount,
        absent: absentCount,
        total: totalStudents,
        percentage
      }
    })

    const overallPresent = subjectStats.reduce((sum, s) => sum + s.present, 0)
    const overallTotal   = subjectStats.reduce((sum, s) => sum + s.total, 0)
    const overallPercentage = overallTotal > 0
      ? Math.round((overallPresent / overallTotal) * 100)
      : 0
    
    // Total de ausencias
    const totalAbsences = subjectStats.reduce((sum, s) => sum + s.absent, 0)
    
    // Materias con baja asistencia
    const lowAttendanceSubjects = subjectStats.filter(s => s.percentage < 80).length
    
    // Mejor y peor materia por asistencia
    const bestSubject = subjectStats.reduce((max, s) => s.percentage > max.percentage ? s : max, subjectStats[0] || { percentage: 0 })
    const worstSubject = subjectStats.reduce((min, s) => s.percentage < min.percentage ? s : min, subjectStats[0] || { percentage: 100 })

    return { 
      totalStudents, 
      totalSubjects, 
      overallPercentage, 
      subjectStats,
      totalAbsences,
      lowAttendanceSubjects,
      bestSubject,
      worstSubject
    }
  }, [studentsInCourse, subjectsInCourse, asistencias, id])

  const toggleSubjectCollapse = (subjectId: string) => {
    const copy = new Set(collapsedSubjects)
    if (copy.has(subjectId)) copy.delete(subjectId)
    else copy.add(subjectId)
    setCollapsedSubjects(copy)
  }

  if (!course || !students || !asistencias) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{course.nombre}</h1>
              <Badge variant="secondary" className="ml-2">
                División {course.division}
              </Badge>
            </div>
            <p className="text-gray-600">
              Gestión de asistencias • Año {course.año}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={studentsInCourse.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DetallesStatsCard 
            label="Total Estudiantes" 
            icon={Users} 
            value={courseStats.totalStudents} 
            subtitle={`Registrados en ${courseStats.totalSubjects} materias`}
            color="blue"
          />
          <DetallesStatsCard 
            label="Asistencia General" 
            icon={UserCheck} 
            value={courseStats.overallPercentage + "%"} 
            subtitle={courseStats.bestSubject?.subject ? `Mejor: ${courseStats.bestSubject.subject} (${courseStats.bestSubject.percentage}%)` : "Sin datos"}
            color="green"
          />
          <DetallesStatsCard 
            label="Materias" 
            icon={BookOpen} 
            value={courseStats.totalSubjects} 
            color="purple"
          />
          <DetallesStatsCard 
            label="Alertas" 
            icon={TrendingDown} 
            value={courseStats.lowAttendanceSubjects} 
            subtitle={courseStats.lowAttendanceSubjects > 0 ? `Materias con menos del 80%` : "Todas las materias en buen nivel"}
            color="red"
          />
        </div>

        {/* Vista por materias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Asistencia por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjectsInCourse.map(subject => {
              const dataPorMateria: AttendanceRow[] = studentsInCourse.map(student => {
                const rec = asistencias.find(a =>
                  a.studentId === student.firestoreId &&
                  a.courseId === course.firestoreId &&
                  a.subject === subject.nombre
                )
                return {
                  id: student.firestoreId,
                  Nombre: `${student.nombre} ${student.apellido}`,
                  presente: Boolean(rec?.presente),
                  fecha: rec?.fecha ?? new Date().toISOString(),
                }
              })

              const stat = courseStats.subjectStats.find(s => s.subject === subject.nombre)
              const isCollapsed = subject.firestoreId
                ? collapsedSubjects.has(subject.firestoreId)
                : false

              return (
                <div key={subject.firestoreId} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => subject.firestoreId && toggleSubjectCollapse(subject.firestoreId)}
                        className="p-1"
                        disabled={!subject.firestoreId}
                      >
                        {isCollapsed ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.nombre}</h3>
                        <p className="text-sm text-gray-600">{stat?.total || 0} registros</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">{stat?.present || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-700">{stat?.absent || 0}</span>
                      </div>
                      <Badge
                        variant={stat && stat.percentage >= 80 ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {stat?.percentage || 0}% asistencia
                      </Badge>
                    </div>
                  </div>
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
                            onClick: table => table.getColumn("presente")?.setFilterValue(true),
                          },
                          {
                            type: "button",
                            label: "Solo ausentes",
                            onClick: table => table.getColumn("presente")?.setFilterValue(false),
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