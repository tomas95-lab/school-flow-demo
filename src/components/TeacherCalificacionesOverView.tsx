import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { CourseCard } from "./CourseCard";
import { StatsCard } from "./StatCards";
import { Percent, BookOpen, Users, TrendingUp, AlertCircle, Award, Sparkles, Target } from "lucide-react";
import { useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

// Tipos TypeScript
interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  totalSubjects: number;
  averageGrade: string;
  approvalRate: string;
  totalGrades: number;
}

interface CourseStats {
  courseId: string;
  studentCount: number;
  averageGrade: string;
}

export default function TeacherCalificacionesOverview() {
  const { user } = useContext(AuthContext);
  
  // Hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);
  const { data: calificaciones, loading: gradesLoading } = useFirestoreCollection("calificaciones");

  // Calcular estadísticas del docente
  const teacherStats = useMemo((): TeacherStats => {
    if (!calificaciones || !teacherSubjects.length || !teacherStudents.length) {
      return {
        totalStudents: 0,
        totalCourses: 0,
        totalSubjects: 0,
        averageGrade: "Sin datos",
        approvalRate: "Sin datos",
        totalGrades: 0
      };
    }

    const subjectIds = teacherSubjects.map(s => s.firestoreId);
    const studentIds = teacherStudents.map(s => s.firestoreId);
    
    const teacherGrades = calificaciones.filter(g => 
      subjectIds.includes(g.subjectId) && 
      studentIds.includes(g.studentId)
    );

    const totalGrades = teacherGrades.length;
    const averageGrade = totalGrades > 0 
      ? (teacherGrades.reduce((sum, { valor }) => sum + (valor || 0), 0) / totalGrades).toFixed(2)
      : "Sin datos";

    const approvedGrades = teacherGrades.filter(c => c.valor >= 7).length;
    const approvalRate = totalGrades > 0 
      ? ((approvedGrades / totalGrades) * 100).toFixed(2)
      : "Sin datos";

    return {
      totalStudents: teacherStudents.length,
      totalCourses: teacherCourses.length,
      totalSubjects: teacherSubjects.length,
      averageGrade,
      approvalRate,
      totalGrades
    };
  }, [calificaciones, teacherSubjects, teacherStudents, teacherCourses]);

  // Calcular estadísticas por curso
  const courseStats = useMemo((): CourseStats[] => {
    if (!teacherCourses.length || !teacherStudents.length || !calificaciones) {
      return [];
    }

    return teacherCourses.map(course => {
      const courseStudents = teacherStudents.filter(s => s.cursoId === course.firestoreId);
      const courseGrades = calificaciones.filter(g => 
        courseStudents.some(s => s.firestoreId === g.studentId)
      );
      
      const averageGrade = courseGrades.length > 0 
        ? (courseGrades.reduce((sum, g) => sum + (g.valor || 0), 0) / courseGrades.length).toFixed(2)
        : "Sin datos";

      return {
        courseId: course.firestoreId || '',
        studentCount: courseStudents.length,
        averageGrade
      };
    });
  }, [teacherCourses, teacherStudents, calificaciones]);

  // Estados de carga
  if (coursesLoading || studentsLoading || gradesLoading) {
    return (
      <LoadingState 
        text="Cargando información del docente..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión."
      />
    );
  }

  // Estado vacío si no hay datos
  if (!teacherCourses.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No tienes cursos asignados"
        description="Contacta al administrador para que te asigne cursos."
        actionText="Contactar administrador"
                        onAction={() => window.location.href = '/app/usuarios'}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con estadísticas rápidas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel del Docente</h2>
            <p className="text-gray-600">Resumen de tu actividad académica</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{teacherStats.totalStudents}</div>
            <div className="text-sm text-gray-600">Estudiantes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{teacherStats.totalCourses}</div>
            <div className="text-sm text-gray-600">Cursos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{teacherStats.totalSubjects}</div>
            <div className="text-sm text-gray-600">Materias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{teacherStats.totalGrades}</div>
            <div className="text-sm text-gray-600">Calificaciones</div>
          </div>
        </div>
      </div>

      {/* KPIs y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Estudiantes"
          value={teacherStats.totalStudents.toString()}
          icon={Users}
          subtitle={`${teacherStats.totalCourses} cursos`}
          trend="up"
          color="blue"
        />
        <StatsCard
          label="Promedio General"
          value={teacherStats.averageGrade}
          icon={Percent}
          subtitle={`${teacherStats.totalGrades} calificaciones`}
          trend="neutral"
          color="green"
        />
        <StatsCard
          label="Materias Activas"
          value={teacherStats.totalSubjects.toString()}
          icon={BookOpen}
          subtitle="Materias asignadas"
          trend="up"
          color="purple"
        />
        <StatsCard
          label="Aprobación"
          value={`${teacherStats.approvalRate}%`}
          icon={TrendingUp}
          subtitle="Estudiantes aprobados"
          trend="up"
          color="orange"
        />
      </div>

      {/* Lista de cursos con diseño mejorado */}
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Mis Cursos ({teacherCourses.length})
                </h2>
                <p className="text-gray-600">
                  Gestiona las calificaciones de tus cursos y mantén un seguimiento del rendimiento académico
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teacherCourses.map((course, index) => {
            const stats = courseStats.find(s => s.courseId === course.firestoreId);
            
            return (
              <div key={course.firestoreId} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                <CourseCard
                  course={{
                    nombre: course.nombre,
                    division: course.division,
                    firestoreId: course.firestoreId || '',
                  }}
                  descripcion={`${stats?.studentCount || 0} estudiantes • Promedio: ${stats?.averageGrade || 'Sin datos'}`}
                  link={`/calificaciones/detalles?id=${course.firestoreId}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas informativas */}
      {teacherStats.totalGrades === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Comienza a registrar calificaciones
                </h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Aún no hay calificaciones registradas. Utiliza el registro rápido para comenzar a evaluar a tus estudiantes. 
                  El sistema te guiará paso a paso en el proceso.
                </p>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Registro Rápido
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Seguimiento
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas adicionales */}
      {teacherStats.totalGrades > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Rendimiento General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-1">{teacherStats.averageGrade}</div>
                <div className="text-sm text-gray-600">Promedio General</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1">{teacherStats.approvalRate}%</div>
                <div className="text-sm text-gray-600">Tasa de Aprobación</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-1">{teacherStats.totalGrades}</div>
                <div className="text-sm text-gray-600">Total Calificaciones</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
