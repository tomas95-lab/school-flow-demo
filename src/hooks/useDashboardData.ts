import { useMemo } from 'react'
import { useFirestoreCollection } from './useFireStoreCollection'
import { where } from 'firebase/firestore'

interface DashboardDataOptions {
  role?: string
  teacherId?: string
  studentId?: string
  teacherCourseIds?: string[]
}

export function useDashboardData(options: DashboardDataOptions) {
  const { role, teacherId, studentId, teacherCourseIds = [] } = options

  const studentsConstraints = useMemo(() => {
    if (role === 'alumno' && studentId) {
      return [where('firestoreId', '==', studentId)]
    }
    return []
  }, [role, studentId])

  const coursesConstraints = useMemo(() => {
    if (role === 'docente' && teacherId) {
      return [where('teacherId', '==', teacherId)]
    }
    if (role === 'alumno' && studentId) {
      return [where('alumnos', 'array-contains', studentId)]
    }
    return []
  }, [role, teacherId, studentId])

  const teachersConstraints = useMemo(() => {
    if (role === 'docente' && teacherId) {
      return [where('firestoreId', '==', teacherId)]
    }
    return []
  }, [role, teacherId])

  const calificacionesConstraints = useMemo(() => {
    if (role === 'docente' && teacherCourseIds.length > 0) {
      return [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
    }
    if (role === 'alumno' && studentId) {
      return [where('studentId', '==', studentId)]
    }
    return []
  }, [role, teacherCourseIds, studentId])

  const asistenciasConstraints = useMemo(() => {
    if (role === 'docente' && teacherCourseIds.length > 0) {
      return [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
    }
    if (role === 'alumno' && studentId) {
      return [where('studentId', '==', studentId)]
    }
    return []
  }, [role, teacherCourseIds, studentId])

  const subjectsConstraints = useMemo(() => {
    if (role === 'docente' && teacherId) {
      return [where('teacherId', '==', teacherId)]
    }
    return []
  }, [role, teacherId])

  const alertsConstraints = useMemo(() => {
    if (role === 'docente' && teacherId) {
      return [where('teacherId', '==', teacherId)]
    }
    if (role === 'alumno' && studentId) {
      return [where('studentId', '==', studentId)]
    }
    return []
  }, [role, teacherId, studentId])

  const { data: students, loading: studentsLoading } = useFirestoreCollection(
    "students",
    {
      enableCache: true,
      constraints: studentsConstraints,
      dependencies: [role, studentId]
    }
  )

  const { data: courses, loading: coursesLoading } = useFirestoreCollection(
    "courses",
    {
      enableCache: true,
      constraints: coursesConstraints,
      dependencies: [role, teacherId, studentId]
    }
  )

  const { data: teachers, loading: teachersLoading } = useFirestoreCollection(
    "teachers",
    {
      enableCache: true,
      constraints: teachersConstraints,
      dependencies: [role, teacherId]
    }
  )

  const { data: calificaciones, loading: calificacionesLoading } = useFirestoreCollection(
    "calificaciones",
    {
      enableCache: true,
      constraints: calificacionesConstraints,
      dependencies: [role, teacherCourseIds.join(','), studentId]
    }
  )

  const { data: asistencias, loading: asistenciasLoading } = useFirestoreCollection(
    "attendances",
    {
      enableCache: true,
      constraints: asistenciasConstraints,
      dependencies: [role, teacherCourseIds.join(','), studentId]
    }
  )

  const { data: subjects, loading: subjectsLoading } = useFirestoreCollection(
    "subjects",
    {
      enableCache: true,
      constraints: subjectsConstraints,
      dependencies: [role, teacherId]
    }
  )

  const { data: alerts, loading: alertsLoading } = useFirestoreCollection(
    "alerts",
    {
      enableCache: true,
      constraints: alertsConstraints,
      dependencies: [role, teacherId, studentId]
    }
  )

  const loading = studentsLoading || coursesLoading || teachersLoading ||
    calificacionesLoading || asistenciasLoading || subjectsLoading || alertsLoading

  return {
    students: students || [],
    courses: courses || [],
    teachers: teachers || [],
    calificaciones: calificaciones || [],
    asistencias: asistencias || [],
    subjects: subjects || [],
    alerts: alerts || [],
    loading
  }
}

