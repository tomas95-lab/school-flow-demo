import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { CourseCard } from "./CourseCard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Activity,
  MessageCircle,
  Clock,
  Star,
  BookOpen
} from "lucide-react";
import { StatsCard } from "./StatCards";
import { useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { Message, Course, Subject } from "@/types";

export default function TeacherMensajesOverview() {
    const { user } = useContext(AuthContext);
    const { data: messages } = useFirestoreCollection<Message>("messages");
    
    // Usar hooks estandarizados
    const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
    const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);

    // Calcular estadísticas del docente
    const stats = useMemo(() => {
        if (!teacherCourses || !messages || !teacherStudents || !user?.teacherId) {
            return {
                totalMessages: 0,
                totalReplies: 0,
                myCourses: 0,
                totalStudents: 0,
                avgMessagesPerCourse: 0,
                mostActiveCourse: null as Course | null,
                recentActivity: 0
            };
        }

        const activeMessages = messages.filter(m => m.status === 'active');
        const teacherMessages = activeMessages.filter(m => 
            teacherCourses.some(c => c.firestoreId === m.courseId)
        );
        
        const totalReplies = teacherMessages.reduce((acc, msg) => acc + (msg.replies?.length || 0), 0);
        
        // Calcular mensajes por curso del docente
        const messagesPerCourse = teacherCourses.map(course => {
            const courseMessages = activeMessages.filter(m => m.courseId === course.firestoreId);
            return {
                course,
                messageCount: courseMessages.length,
                replyCount: courseMessages.reduce((acc, msg) => acc + (msg.replies?.length || 0), 0)
            };
        });

        const mostActiveCourse = messagesPerCourse.length > 0 
            ? messagesPerCourse.reduce((max, current) => 
                current.messageCount > max.messageCount ? current : max
              ).course
            : null;

        // Actividad reciente (últimos 7 días)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentActivity = teacherMessages.filter(m => 
            new Date(m.createdAt) > oneWeekAgo
        ).length;

        return {
            totalMessages: teacherMessages.length,
            totalReplies,
            myCourses: teacherCourses.length,
            totalStudents: teacherStudents.length,
            avgMessagesPerCourse: teacherCourses.length > 0 ? Math.round(teacherMessages.length / teacherCourses.length) : 0,
            mostActiveCourse,
            recentActivity
        };
    }, [teacherCourses, messages, teacherStudents, user?.teacherId]);

    // Obtener cursos con actividad
    const coursesWithActivity = useMemo(() => {
        if (!teacherCourses || !messages) return [];

        return teacherCourses.map(course => {
            const courseMessages = messages.filter(m => m.courseId === course.firestoreId && m.status === 'active');
            const recentMessages = courseMessages.filter(m => {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return new Date(m.createdAt) > oneWeekAgo;
            });

            return {
                ...course,
                messageCount: courseMessages.length,
                recentMessages: recentMessages.length,
                lastActivity: courseMessages.length > 0 && courseMessages.some(m => m.createdAt)
                    ? new Date(Math.max(...courseMessages.map(m => new Date(m.createdAt).getTime() || 0)))
                    : null
            };
        }).sort((a, b) => b.messageCount - a.messageCount);
    }, [teacherCourses, messages]);

    if (!user?.teacherId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h2>
                    <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
                </div>
            </div>
        );
    }

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
                    label="Mis Mensajes"
                    value={stats.totalMessages.toString()}
                    icon={MessageSquare}
                    subtitle={`${stats.totalReplies} respuestas`}
                    trend="up"
                />
                <StatsCard
                    label="Mis Cursos"
                    value={stats.myCourses.toString()}
                    icon={BookOpen}
                    subtitle={`${stats.totalStudents} estudiantes`}
                    trend="up"
                />
                <StatsCard
                    label="Actividad Reciente"
                    value={stats.recentActivity.toString()}
                    icon={Activity}
                    subtitle="Últimos 7 días"
                    trend="up"
                />
                <StatsCard
                    label="Promedio por Curso"
                    value={stats.avgMessagesPerCourse.toString()}
                    icon={TrendingUp}
                    subtitle="Mensajes promedio"
                    trend="neutral"
                />
            </div>

            {/* Resumen de actividad */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Curso más activo */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Mi Curso Más Activo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.mostActiveCourse ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">
                                        {stats.mostActiveCourse.nombre} - {stats.mostActiveCourse.division}
                                    </h3>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Activo
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        {stats.totalMessages} mensajes
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="h-4 w-4" />
                                        {stats.totalReplies} respuestas
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No hay actividad registrada</p>
                        )}
                    </CardContent>
                </Card>

                {/* Actividad reciente */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Mi Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-gray-900">
                                    {stats.recentActivity}
                                </span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    +{Math.round(stats.recentActivity * 0.15)} esta semana
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Mensajes en los últimos 7 días
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min((stats.recentActivity / 50) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Participación */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-green-500" />
                            Mis Estudiantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Estudiantes</span>
                                <span className="font-semibold">{stats.totalStudents}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cursos</span>
                                <span className="font-semibold">{stats.myCourses}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Mensajes</span>
                                <span className="font-semibold">{stats.totalMessages}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Promedio mensajes/curso</span>
                                    <span className="font-semibold text-green-600">
                                        {stats.avgMessagesPerCourse}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de mis cursos */}
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
                        Gestiona los muros de tus cursos y mantén comunicación con tus estudiantes
                    </p>
                </div>

                {coursesWithActivity.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos asignados</h3>
                            <p className="text-gray-600">Contacta al administrador para que te asigne cursos.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {coursesWithActivity.map((course) => (
                            <CourseCard
                                key={course.firestoreId}
                                course={{
                                    ...course,
                                    nombre: course.nombre,
                                    division: course.division,
                                    firestoreId: course.firestoreId || '',
                                }}
                                descripcion={`${course.messageCount} mensajes • ${course.recentMessages} recientes`}
                                link={`/mensajes/detalles?id=${course.firestoreId}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 