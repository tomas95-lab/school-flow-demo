import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  Users, 
  Calendar,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { startOfDay, subDays, parseISO, isAfter } from "date-fns";
import { StatsCard } from "./StatCards";
import { SchoolSpinner } from "./SchoolSpinner";
import { CourseCard } from "./CourseCard";

export default function TeacherAttendanceOverview() {
  const { user } = useContext(AuthContext);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Usar hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);
  
  const { data: attendances, loading: loadingAttendances = false } =
    useFirestoreCollection<{
      firestoreId: string;
      studentId: string;
      courseId: string;
      subject: string;
      date: string;
      present: boolean;
    }>("attendances");

  // Auto-seleccionar materia si el docente tiene una sola
  useEffect(() => {
    if (teacherSubjects.length === 1 && !selectedSubject) {
      setSelectedSubject(teacherSubjects[0].nombre);
    } else if (teacherSubjects.length > 1 && !selectedSubject) {
      // Pre-seleccionar la primera materia si tiene múltiples
      setSelectedSubject(teacherSubjects[0].nombre);
    }
  }, [teacherSubjects, selectedSubject]);

  if (coursesLoading || studentsLoading || loadingAttendances) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolSpinner text="Cargando panel de asistencias..." fullScreen={true} />
          <p className="text-gray-500 mt-4">Preparando información del sistema</p>
        </div>
      </div>
    );
  }

  // Obtener IDs de cursos del docente
  const courseIds = teacherCourses.map(c => c.firestoreId);

  // Asistencias válidas: alumno + curso + materia
  const teacherAttendances = attendances.filter(
    (a) =>
      teacherStudents.some(s => s.firestoreId === a.studentId) &&
      courseIds.includes(a.courseId) &&
      teacherSubjects.some((subj) => subj.nombre === a.subject)
  );

  // dates de referencia
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);
  const twoWeeksAgo = subDays(today, 14);

  // Calcular estadísticas
  const totalStudents = teacherStudents.length;
  const totalCourses = teacherCourses.length;
  const totalSubjects = teacherSubjects.length;

  // Asistencias de la semana actual
  const thisWeekAttendances = teacherAttendances.filter(a => {
    const attendanceDate = parseISO(a.date);
    return isAfter(attendanceDate, weekAgo) && !isAfter(attendanceDate, today);
  });

  const presentThisWeek = thisWeekAttendances.filter(a => a.present).length;
  const totalThisWeek = thisWeekAttendances.length;
  const attendanceRate = totalThisWeek > 0 ? Math.round((presentThisWeek / totalThisWeek) * 100) : 0;

  // Asistencias de la semana anterior
  const lastWeekAttendances = teacherAttendances.filter(a => {
    const attendanceDate = parseISO(a.date);
    return isAfter(attendanceDate, twoWeeksAgo) && !isAfter(attendanceDate, weekAgo);
  });

  const presentLastWeek = lastWeekAttendances.filter(a => a.present).length;
  const totalLastWeek = lastWeekAttendances.length;
  const lastWeekRate = totalLastWeek > 0 ? Math.round((presentLastWeek / totalLastWeek) * 100) : 0;

  // Tendencia
  const trend = attendanceRate > lastWeekRate ? "up" : attendanceRate < lastWeekRate ? "down" : "neutral";

  return (
    <div className="space-y-6">
      {/* KPIs y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Estudiantes"
          value={totalStudents.toString()}
          icon={Users}
          subtitle={`${totalCourses} cursos`}
          trend="up"
        />
        <StatsCard
          label="Asistencia Semanal"
          value={`${attendanceRate}%`}
          icon={Calendar}
          subtitle={`${presentThisWeek}/${totalThisWeek} presentes`}
          trend={trend}
        />
        <StatsCard
          label="Materias Activas"
          value={totalSubjects.toString()}
          icon={BookOpen}
          subtitle="Materias asignadas"
          trend="up"
        />
        <StatsCard
          label="Tendencia"
          value={`${attendanceRate - lastWeekRate > 0 ? '+' : ''}${attendanceRate - lastWeekRate}%`}
          icon={TrendingUp}
          subtitle="vs semana anterior"
          trend={trend}
        />
      </div>

      {/* Lista de cursos */}
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Mis Cursos ({teacherCourses.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>Cursos donde enseñas</span>
            </div>
          </div>
          <p className="text-gray-600 mt-1">
            Gestiona las asistencias de tus cursos y mantén un seguimiento del rendimiento
          </p>
        </div>

        {teacherCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos asignados</h3>
            <p className="text-gray-600">Contacta al administrador para que te asigne cursos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teacherCourses.map((course) => {
              // Calcular estadísticas del curso
              const courseStudents = teacherStudents.filter(s => s.cursoId === course.firestoreId);
              const courseAttendances = teacherAttendances.filter(a => a.courseId === course.firestoreId);
              const coursePresent = courseAttendances.filter(a => a.present).length;
              const courseTotal = courseAttendances.length;
              const courseRate = courseTotal > 0 ? Math.round((coursePresent / courseTotal) * 100) : 0;

              return (
                <CourseCard
                  key={course.firestoreId}
                  course={{
                    nombre: course.nombre,
                    division: course.division,
                    firestoreId: course.firestoreId || '',
                  }}
                  descripcion={`${courseStudents.length} estudiantes • ${courseRate}% asistencia`}
                  link={`/asistencias/detalles?id=${course.firestoreId}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
