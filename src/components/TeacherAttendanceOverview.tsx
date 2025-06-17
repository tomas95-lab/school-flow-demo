import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext } from "react";
import { CourseCard } from "./CourseCard";
import type { Course } from "@/components/CourseCard";
import { SchoolSpinner } from "./SchoolSpinner";
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  UserX,
  Calendar,
} from "lucide-react";
import {
  subDays,
  startOfDay,
  parseISO,
  isAfter,
  isBefore
} from "date-fns";
import { StatsCard } from "./StatCards";

export default function TeacherAttendanceOverview() {
  const { user } = useContext(AuthContext);
  const { data: courses, loading: loadingCourses = false } =
    useFirestoreCollection<Course>("courses");
  const { data: teachers, loading: loadingTeachers = false } =
    useFirestoreCollection<{ firestoreId: string; cursoId?: string; cursoIds?: string[] }>(
      "teachers"
    );
  const { data: subjects, loading: loadingSubjects = false } =
    useFirestoreCollection<{ firestoreId: string; nombre: string; teacherId: string }>(
      "subjects"
    );
  const { data: students, loading: loadingStudents = false } =
    useFirestoreCollection<{ firestoreId: string; cursoId: string; nombre: string; apellido: string }>(
      "students"
    );
  const { data: attendances, loading: loadingAttendances = false } =
    useFirestoreCollection<{
      firestoreId: string;
      studentId: string;
      courseId: string;
      subject: string;
      date: string;
      presente: boolean;
    }>("attendances");

  if (
    loadingCourses ||
    loadingTeachers ||
    loadingSubjects ||
    loadingStudents ||
    loadingAttendances
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolSpinner text="Cargando panel de asistencias..." />
          <p className="text-gray-500 mt-4">Preparando información del sistema</p>
        </div>
      </div>
    );
  }

  // 1. Identificar al docente
  const teacherUserId = user?.teacherId;
  const teacher = teachers.find((t) => t.firestoreId === teacherUserId);

  // 2. Materias del docente
  const subjectsTeacher = subjects.filter(
    (subj) => subj.teacherId === teacher?.firestoreId
  );

  // 3. IDs de cursos (soporta cursoId o cursoIds[])
  const cursoIds = Array.isArray(teacher?.cursoIds)
    ? teacher.cursoIds
    : teacher?.cursoId
    ? [teacher.cursoId]
    : [];

  // 4. Cursos que imparte
  const teacherCourses = courses.filter((c) =>
    cursoIds.includes(c.firestoreId)
  );

  // 5. Estudiantes de esos cursos
  const teacherStudents = students.filter((s) =>
    cursoIds.includes(s.cursoId)
  );
  const validStudentIds = new Set(teacherStudents.map((s) => s.firestoreId));

  // 6. Asistencias válidas: alumno + curso + materia
  const teacherAttendances = attendances.filter(
    (a) =>
      validStudentIds.has(a.studentId) &&
      cursoIds.includes(a.courseId) &&
      subjectsTeacher.some((subj) => subj.nombre === a.subject)
  );

  // dates de referencia
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);
  const monthAgo = subDays(today, 30);

  // 7. Asistencia promedio últimos 7 días
  const lastWeek = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return (
      (isAfter(d, weekAgo) || d.getTime() === weekAgo.getTime()) &&
      (isBefore(d, today) || d.getTime() === today.getTime())
    );
  });

  type DayStats = {
    total: number;
    present: number;
    presentNames: string[];
    absentNames: string[];
  };

  const byDate = lastWeek.reduce((acc, { date, presente, studentId }) => {
    const alumno = teacherStudents.find((s) => s.firestoreId === studentId);
    const nombre = alumno
      ? `${alumno.nombre} ${alumno.apellido}`
      : studentId;

    if (!acc[date]) {
      acc[date] = {
        total: 0,
        present: 0,
        presentNames: [],
        absentNames: []
      };
    }

    acc[date].total++;
    if (presente) {
      acc[date].present++;
      acc[date].presentNames.push(nombre);
    } else {
      acc[date].absentNames.push(nombre);
    }

    return acc;
  }, {} as Record<string, DayStats>);

  const dailyPercents = Object.values(byDate).map(
    ({ present, total }) => (present / total) * 100
  );
  const avgWeeklyAttendance =
    dailyPercents.length > 0
      ? dailyPercents.reduce((sum, p) => sum + p, 0) / dailyPercents.length
      : 0;

  // 8. Ausencias últimos 30 días
  const absCount = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return !a.presente && (isAfter(d, monthAgo) || d.getTime() === monthAgo.getTime());
  }).length;

  // 9. Alumnos en riesgo
  const studentsAtRisk = teacherStudents.filter((student) => {
    const records = teacherAttendances.filter(
      (a) => a.studentId === student.firestoreId
    );
    if (records.length === 0) return false;

    const presentCount = records.filter((a) => a.presente).length;
    const attendanceRate = (presentCount / records.length) * 100;
    const lowAttendance = attendanceRate < 75;

    const recent = records
      .filter((a) => {
        const d = parseISO(a.date);
        return isAfter(d, weekAgo);
      })
      .sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
      );

    let consAbs = 0;
    for (const rec of recent) {
      if (!rec.presente) consAbs++;
      else break;
    }

    return lowAttendance || consAbs >= 3;
  }).length;

  // Determinar tendencias (opcional - podrías comparar con período anterior)
  const getAttendanceTrend = () => {
    if (avgWeeklyAttendance >= 90) return "up";
    if (avgWeeklyAttendance < 75) return "down";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={GraduationCap}
          label="Mis Cursos"
          value={teacherCourses.length}
          subtitle={`${teacherStudents.length} estudiantes total`}
          color="blue"
        />
        
        <StatsCard
          icon={TrendingUp}
          label="Asistencia Promedio"
          value={dailyPercents.length > 0 ? `${Math.round(avgWeeklyAttendance)}%` : "Sin datos"}
          subtitle="Últimos 7 días"
          color={avgWeeklyAttendance >= 85 ? "green" : avgWeeklyAttendance >= 75 ? "orange" : "red"}
          trend={getAttendanceTrend()}
        />
        
        <StatsCard
          icon={UserX}
          label="Ausencias"
          value={absCount}
          subtitle="Últimos 30 días"
          color="orange"
        />
        
        <StatsCard
          icon={AlertTriangle}
          label="Alumnos en Riesgo"
          value={studentsAtRisk}
          subtitle="< 75% asistencia"
          color={studentsAtRisk === 0 ? "green" : studentsAtRisk <= 3 ? "orange" : "red"}
        />
      </div>

      {/* Courses Grid */}
      {teacherCourses.length > 0 ? (
        <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Todos los Cursos ({courses.length})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Todos los cursos activos</span>
                </div>
              </div>
              <p className="text-gray-600 mt-1">
                Administra tus cursos, revisa asistencias y gestiona información académica
              </p>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teacherCourses.map((course) => (
              <CourseCard
                course={course as Course}
                key={course.firestoreId}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos asignados</h3>
          <p className="text-gray-500">Contacta al administrador para que te asigne cursos.</p>
        </div>
      )}
    </div>
  );
}