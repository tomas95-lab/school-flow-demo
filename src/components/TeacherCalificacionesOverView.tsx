import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { CourseCard } from "./CourseCard";
import { StatsCard } from "./StatCards";
import { Percent, TriangleAlert, BookOpen, Users, TrendingUp } from "lucide-react";
import { useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function TeacherCalificacionesOverview() {
    const { user } = useContext(AuthContext);
    
    // Usar hooks estandarizados
    const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
    const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);
    
    const { data: calificaciones } = useFirestoreCollection("calificaciones");

    // Filtrar calificaciones del docente
    const teacherGrades = useMemo(() => {
        if (!calificaciones || !teacherSubjects.length) return [];
        
        const subjectIds = teacherSubjects.map(s => s.firestoreId);
        const studentIds = teacherStudents.map(s => s.firestoreId);
        
        return calificaciones.filter(g => 
            subjectIds.includes(g.subjectId) && 
            studentIds.includes(g.studentId)
        );
    }, [calificaciones, teacherSubjects, teacherStudents]);

    // Calcular estadísticas
    const averageGrade = useMemo(() => {
        if (!teacherGrades.length) return "Sin datos";
        const total = teacherGrades.reduce(
            (sum: number, { valor }) => sum + (valor || 0),
            0
        );
        return (total / teacherGrades.length).toFixed(2);
    }, [teacherGrades]);

    const [pctAprob] = useMemo(() => {
        const total = teacherGrades.length;
        if (!total) return ["Sin datos", "Sin datos"];
        const aprobCount = teacherGrades.filter(c => c.valor >= 7).length;
        const pctA = ((aprobCount / total) * 100).toFixed(2);
        const pctR = (100 - parseFloat(pctA)).toFixed(2);
        return [pctA, pctR];
    }, [teacherGrades]);

    const totalStudents = teacherStudents.length;
    const totalCourses = teacherCourses.length;
    const totalSubjects = teacherSubjects.length;

    if (coursesLoading || studentsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando información del docente...</p>
                </div>
            </div>
        );
    }

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
                    label="Promedio General"
                    value={averageGrade}
                    icon={Percent}
                    subtitle={`${teacherGrades.length} calificaciones`}
                    trend="neutral"
                />
                <StatsCard
                    label="Materias Activas"
                    value={totalSubjects.toString()}
                    icon={BookOpen}
                    subtitle="Materias asignadas"
                    trend="up"
                />
                <StatsCard
                    label="Aprobación"
                    value={`${pctAprob}%`}
                    icon={TrendingUp}
                    subtitle="Estudiantes aprobados"
                    trend="up"
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
                        Gestiona las calificaciones de tus cursos y mantén un seguimiento del rendimiento académico
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
                            const courseGrades = teacherGrades.filter(g => 
                                courseStudents.some(s => s.firestoreId === g.studentId)
                            );
                            const courseAverage = courseGrades.length > 0 
                                ? (courseGrades.reduce((sum, g) => sum + (g.valor || 0), 0) / courseGrades.length).toFixed(2)
                                : "Sin datos";

                            return (
                                <CourseCard
                                    key={course.firestoreId}
                                    course={{
                                        nombre: course.nombre,
                                        division: course.division,
                                        firestoreId: course.firestoreId || '',
                                    }}
                                    descripcion={`${courseStudents.length} estudiantes • Promedio: ${courseAverage}`}
                                    link={`/calificaciones/detalles?id=${course.firestoreId}`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
