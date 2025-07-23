import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  Users, 
  Calendar,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { format, startOfDay, subDays, parseISO, isAfter, isBefore } from "date-fns";
import { StatsCard } from "./StatCards";
import { SchoolSpinner } from "./SchoolSpinner";
import { CourseCard } from "./CourseCard";
import type { Course } from "@/components/CourseCard";

export default function TeacherAttendanceOverview() {
  const { user } = useContext(AuthContext);
  const [selectedSubject, setSelectedSubject] = useState("");

  const { data: courses, loading: loadingCourses = false } =
    useFirestoreCollection("courses");
  const { data: teachers, loading: loadingTeachers = false } =
    useFirestoreCollection<{ firestoreId: string; cursoId?: string; cursoIds?: string[] }>(
      "teachers"
    );
  const { data: subjects, loading: loadingSubjects = false } =
    useFirestoreCollection<{ firestoreId: string; nombre: string; teacherId: string; cursoId: string | string[] }>(
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

  // 1. Identificar al docente
  const teacherUserId = user?.teacherId;
  const teacher = teachers.find(t => t.firestoreId == teacherUserId )
  
  // Obtener cursos del docente a través de las materias
  const teacherCourses = courses.filter(c => c.teacherId == teacherUserId )
  
  // 2. Materias del docente
  const subjectsTeacher = subjects.filter(
    (subj) => subj.teacherId == teacherUserId
  );

  // Auto-seleccionar materia si el docente tiene una sola
  useEffect(() => {
    if (subjectsTeacher.length === 1 && !selectedSubject) {
      setSelectedSubject(subjectsTeacher[0].nombre);
    } else if (subjectsTeacher.length > 1 && !selectedSubject) {
      // Pre-seleccionar la primera materia si tiene múltiples
      setSelectedSubject(subjectsTeacher[0].nombre);
    }
  }, [subjectsTeacher, selectedSubject]);

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

  // 3. IDs de cursos (soporta cursoId o cursoIds[])
  const cursoIds = Array.isArray(teacher?.cursoIds)
    ? teacher.cursoIds
    : teacher?.cursoId
    ? [teacher.cursoId]
    : [];


  // 5. Estudiantes de esos cursos
  const teacherStudents = students.filter((s) =>
    cursoIds.map((c) => c.includes(s.cursoId))
  );

  console.log("Teacher Students:", teacherStudents);
  const validStudentIds = new Set(teacherStudents.map((s) => s.firestoreId));
  // 6. Asistencias válidas: alumno + curso + materia
  const teacherAttendances = attendances.filter(
    (a) =>
      validStudentIds.has(a.studentId) &&
      cursoIds[0].includes(a.courseId) &&
      subjectsTeacher.some((subj) => subj.nombre === a.subject)
  );
  // dates de referencia
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);
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

  const getAttendanceTrend = () => {
    if (avgWeeklyAttendance > avgPreviousWeekAttendance) {
      return {
        direction: "up",
        percentage: Math.round(avgWeeklyAttendance - avgPreviousWeekAttendance),
        color: "green",
        icon: TrendingUp,
      };
    } else if (avgWeeklyAttendance < avgPreviousWeekAttendance) {
      return {
        direction: "down",
        percentage: Math.round(avgPreviousWeekAttendance - avgWeeklyAttendance),
        color: "red",
        icon: TrendingUp,
      };
    } else {
      return {
        direction: "stable",
        percentage: 0,
        color: "gray",
        icon: TrendingUp,
      };
    }
  };

  const getCourseStats = (courseId: string) => {
    const courseAttendances = teacherAttendances.filter(
      (a) => a.courseId === courseId
    );
    const total = courseAttendances.length;
    const present = courseAttendances.filter((a) => a.present).length;
    return {
      total,
      present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  };

  const trend = getAttendanceTrend();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Docente
          </h2>
          <p className="text-gray-600">
            Gestiona las asistencias de tus materias y cursos asignados
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          label="Estudiantes"
          value={teacherStudents.length}
          subtitle="Total asignados"
          color="blue"
        />
        <StatsCard
          icon={BookOpen}
          label="Materias"
          value={subjectsTeacher.length}
          subtitle="Materias impartidas"
          color="purple"
        />
        <StatsCard
          icon={TrendingUp}
          label="Asistencia Semanal"
          value={`${Math.round(avgWeeklyAttendance)}%`}
          subtitle={`${trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}${trend.percentage}% vs semana anterior`}
          color={trend.color as any}
        />
        <StatsCard
          icon={Calendar}
          label="Registros Hoy"
          value={teacherAttendances.filter(a => a.date === format(new Date(), "yyyy-MM-dd")).length}
          subtitle="Asistencias registradas"
          color="green"
        />
      </div>

      {/* Lista de Cursos */}
      {teacherCourses.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Mis Cursos ({teacherCourses.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Cursos activos</span>
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Administra cursos y revisa asistencias por materia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teacherCourses.map((course, index) => {
              if (!course.firestoreId) return null;
              const stats = getCourseStats(course.firestoreId);
              return (
                <div key={course.firestoreId || index} className="transform transition-all duration-200 hover:scale-105">
                  <CourseCard 
                    course={course as Course} 
                    link={`/asistencias/detalles?id=${course.firestoreId}`} 
                    descripcion={`${stats.percentage}% asistencia - ${stats.total} registros`}
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <h1 className="text-xl font-semibold text-gray-600">No hay cursos asignados</h1>
          <p className="text-gray-500 mt-2">Contacta al administrador para que te asigne cursos</p>
        </div>
      )}
    </div>
  );
}
