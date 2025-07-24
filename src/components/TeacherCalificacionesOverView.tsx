import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { CourseCard } from "./CourseCard";
import { StatsCard } from "./StatCards";
import { Percent, TriangleAlert, BookOpen, Users, TrendingUp } from "lucide-react";
import { useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function TeacherCalificacionesOverview() {
    const { user } = useContext(AuthContext)
    
    // All hooks at the top level
    const { data: courses } = useFirestoreCollection("courses");
    const { data: subjects } = useFirestoreCollection("subjects");
    const { data: teachers } = useFirestoreCollection("teachers")
    const { data: calificaciones } = useFirestoreCollection("calificaciones");
    const { data: students } = useFirestoreCollection("students");
    
    // Obtener información del docente
    const teacher = teachers?.find(t => t.firestoreId === user?.teacherId);
    
    // Obtener materias del docente
    const teacherSubjects = useMemo(() => 
        subjects?.filter(s => s.teacherId === user?.teacherId) || [], 
        [subjects, user?.teacherId]
    );

    // Obtener cursos donde enseña el docente
    const teacherCourses = useMemo(() => {
        if (!courses || !teacherSubjects.length) return [];
        
        const courseIds = new Set<string>();
        teacherSubjects.forEach(s => {
            if (Array.isArray(s.cursoId)) {
                s.cursoId.forEach(id => courseIds.add(id));
            } else if (s.cursoId) {
                courseIds.add(s.cursoId);
            }
        });
        
        return courses.filter(c => c.firestoreId && courseIds.has(c.firestoreId));
    }, [courses, teacherSubjects]);

    // Obtener estudiantes de los cursos del docente
    const teacherStudents = useMemo(() => {
        if (!students || !teacherCourses.length) return [];
        
        const courseIds = teacherCourses.map(c => c.firestoreId);
        return students.filter(s => courseIds.includes(s.cursoId));
    }, [students, teacherCourses]);

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

    // Calcular estadísticas por materia
    const subjectStats = useMemo(() => {
        return teacherSubjects.map(subject => {
            const subjectGrades = teacherGrades.filter(g => g.subjectId === subject.firestoreId);
            const totalGrades = subjectGrades.length;
            const averageGrade = totalGrades > 0 
                ? subjectGrades.reduce((sum, g) => sum + g.valor, 0) / totalGrades 
                : 0;
            const passingGrades = subjectGrades.filter(g => g.valor >= 7).length;
            
            return {
                firestoreId: subject.firestoreId,
                nombre: subject.nombre,
                totalGrades,
                averageGrade: averageGrade.toFixed(2),
                passingGrades,
                passingRate: totalGrades > 0 ? ((passingGrades / totalGrades) * 100).toFixed(1) : "0.0"
            };
        });
    }, [teacherSubjects, teacherGrades]);

    // Verificar permisos de acceso
    if (!user || user.role !== 'docente') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-white p-8 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
                        <p className="text-gray-600">Solo los docentes pueden acceder a esta vista.</p>
                        <p className="text-gray-500 text-sm mt-2">Contacta al administrador si crees que esto es un error.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Observaciones Automáticas */}

            {/* Header con información del docente */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Panel de Calificaciones - Docente
                        </h2>
                        <p className="text-gray-600">
                            {teacher?.nombre} {teacher?.apellido} • {teacherSubjects.length} materia{teacherSubjects.length !== 1 ? 's' : ''} asignada{teacherSubjects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                
                {/* Estadísticas generales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatsCard
                        label="Total Calificaciones"
                        value={teacherGrades.length.toString()}
                        icon={BookOpen}
                        subtitle="Registradas este período"
                        trend="up"
                    />
                    <StatsCard
                        label="Promedio General"
                        value={averageGrade}
                        icon={TrendingUp}
                        subtitle="Promedio de todas las materias"
                        trend="up"
                    />
                    <StatsCard
                        label="Porcentaje Aprobación"
                        value={`${pctAprob}%`}
                        icon={Percent}
                        subtitle="Estudiantes aprobados"
                        trend="up"
                    />
                    <StatsCard
                        label="Estudiantes"
                        value={teacherStudents.length.toString()}
                        icon={Users}
                        subtitle="En mis cursos"
                        trend="neutral"
                    />
                </div>
            </div>

            {/* Estadísticas por materia */}
            {subjectStats.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Rendimiento por Materia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectStats.map((subject) => (
                            <div key={subject.firestoreId} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{subject.nombre}</h4>
                                    <span className="text-sm text-gray-500">
                                        {subject.totalGrades} calif.
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Promedio:</span>
                                        <span className="font-medium text-gray-900">{subject.averageGrade}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Aprobación:</span>
                                        <span className="font-medium text-gray-900">{subject.passingRate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${subject.passingRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cursos asignados */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="m-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Mis Cursos ({teacherCourses.length})
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            <span>Cursos donde enseño</span>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Gestiona calificaciones y revisa el rendimiento de tus estudiantes
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                    {teacherCourses.map((course) => (
                        <CourseCard
                            key={course.firestoreId}
                            course={{
                                ...course,
                                nombre: course.nombre || "",
                                division: course.division || "",
                                firestoreId: course.firestoreId || "",
                            }}
                            descripcion="Ver y gestionar calificaciones"
                            link={`/calificaciones/detalles?id=${course.firestoreId}`}
                        />
                    ))}
                </div>
            </div>

            {/* Alerta si no hay datos */}
            {teacherGrades.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <TriangleAlert className="h-5 w-5 text-yellow-600" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">
                                No hay calificaciones registradas
                            </p>
                            <p className="text-sm text-yellow-700">
                                Comienza a registrar calificaciones para ver estadísticas y análisis.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
