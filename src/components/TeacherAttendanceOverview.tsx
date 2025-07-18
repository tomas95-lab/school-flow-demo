import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
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
  Users,
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
      present: boolean;
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
          <SchoolSpinner text="Cargando panel de asistencias..." fullScreen={true} />
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
  const twoWeeksAgo = subDays(today, 14);

  // 7. Asistencia promedio últimos 7 días
  const lastWeek = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return (
      (isAfter(d, weekAgo) || d.getTime() === weekAgo.getTime()) &&
      (isBefore(d, today) || d.getTime() === today.getTime())
    );
  });

  // 7b. Asistencia promedio semana anterior para comparar tendencia
  const previousWeek = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return (
      (isAfter(d, twoWeeksAgo) || d.getTime() === twoWeeksAgo.getTime()) &&
      (isBefore(d, weekAgo) || d.getTime() === weekAgo.getTime())
    );
  });

  type DayStats = {
    total: number;
    present: number;
    presentNames: string[];
    absentNames: string[];
  };

  const byDate = lastWeek.reduce((acc, { date, present, studentId }) => {
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
    if (present) {
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

  // Calcular tendencia comparando con semana anterior
  const previousByDate = previousWeek.reduce((acc, { date, present, studentId }) => {
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
    if (present) {
      acc[date].present++;
      acc[date].presentNames.push(nombre);
    } else {
      acc[date].absentNames.push(nombre);
    }

    return acc;
  }, {} as Record<string, DayStats>);

  const previousDailyPercents = Object.values(previousByDate).map(
    ({ present, total }) => (present / total) * 100
  );
  const avgPreviousWeekAttendance =
    previousDailyPercents.length > 0
      ? previousDailyPercents.reduce((sum, p) => sum + p, 0) / previousDailyPercents.length
      : 0;

  // Determinar tendencia
  const getAttendanceTrend = () => {
    if (avgPreviousWeekAttendance === 0) return "neutral";
    if (avgWeeklyAttendance > avgPreviousWeekAttendance + 2) return "up";
    if (avgWeeklyAttendance < avgPreviousWeekAttendance - 2) return "down";
    return "neutral";
  };

  // 8. Ausencias últimos 30 días
  const absCount = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return !a.present && (isAfter(d, monthAgo) || d.getTime() === monthAgo.getTime());
  }).length;

  // 9. Alumnos en riesgo
  const studentsAtRisk = teacherStudents.filter((student) => {
    const records = teacherAttendances.filter(
      (a) => a.studentId === student.firestoreId
    );
    if (records.length === 0) return false;

    const presentCount = records.filter((a) => a.present).length;
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
      if (!rec.present) consAbs++;
      else break;
    }

    return lowAttendance || consAbs >= 3;
  }).length;

  // Función para obtener estadísticas por curso
  const getCourseStats = (courseId: string) => {
    const courseStudents = students.filter(s => s.cursoId === courseId);
    const courseAttendances = teacherAttendances.filter(a => a.courseId === courseId);
    
    const totalAbsences = courseAttendances.filter(a => !a.present).length;
    const totalRecords = courseAttendances.length;
    const attendancePercentage = totalRecords > 0 ? Math.round(((totalRecords - totalAbsences) / totalRecords) * 100) : 0;
    
    return {
      studentCount: courseStudents.length,
      absences: totalAbsences,
      attendancePercentage
    };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={GraduationCap}
          label="Cursos"
          value={teacherCourses.length}
          subtitle="Asignados"
          color="blue"
        />
        
        <StatsCard
          icon={Users}
          label="Estudiantes"
          value={teacherStudents.length}
          subtitle="A cargo"
          color="purple"
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
              {courses.map((course, index) => {
                const stats = getCourseStats(course.firestoreId);
                const courseDescription = `${stats.studentCount} estudiantes - ${stats.absences} faltas - Asistencia ${stats.attendancePercentage}%`;
                
                return (
                  <div key={course.firestoreId || index} className="transform transition-all duration-200 hover:scale-105">
                    <CourseCard course={course} link={`/asistencias/detalles?id=${course.firestoreId}`} descripcion={courseDescription}/>
                  </div>
                );
              })}
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
