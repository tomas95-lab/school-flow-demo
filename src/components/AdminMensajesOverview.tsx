import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { CourseCard } from "./CourseCard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Activity,
  MessageCircle,
  Clock,
  Star,
  BookOpen,
  MessageCircle as MessageCircleIcon,
  ArrowRight,
  Shield,
  Settings,
  BarChart3
} from "lucide-react";
import { StatsCard } from "./StatCards";
import { useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { Message, Course } from "@/types";
import { useNavigate } from "react-router-dom";

export default function AdminMensajesOverview() {
    const { user } = useContext(AuthContext);
    const { data: messages } = useFirestoreCollection<Message>("messages");
    const { data: courses } = useFirestoreCollection<Course>("courses");
    const { data: students } = useFirestoreCollection("students");
    const { data: teachers } = useFirestoreCollection("teachers");
    const navigate = useNavigate();

    // Calcular estadísticas del sistema
    const stats = useMemo(() => {
        if (!courses || !messages || !students || !teachers) {
            return {
                totalMessages: 0,
                totalReplies: 0,
                totalCourses: 0,
                totalStudents: 0,
                totalTeachers: 0,
                avgMessagesPerCourse: 0,
                mostActiveCourse: null as Course | null,
                recentActivity: 0
            };
        }

        const activeMessages = messages.filter(m => m.status === 'active');
        const totalReplies = activeMessages.reduce((acc, msg) => acc + (msg.replies?.length || 0), 0);
        
        // Calcular mensajes por curso
        const messagesPerCourse = courses.map(course => {
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
        const recentActivity = activeMessages.filter(m => 
            new Date(m.createdAt) > oneWeekAgo
        ).length;

        return {
            totalMessages: activeMessages.length,
            totalReplies,
            totalCourses: courses.length,
            totalStudents: students.length,
            totalTeachers: teachers.length,
            avgMessagesPerCourse: courses.length > 0 ? Math.round(activeMessages.length / courses.length) : 0,
            mostActiveCourse,
            recentActivity
        };
    }, [courses, messages, students, teachers]);

    // Obtener cursos con actividad
    const coursesWithActivity = useMemo(() => {
        if (!courses || !messages) return [];

        return courses.map(course => {
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
    }, [courses, messages]);

    if (!user?.role || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h2>
                    <p className="text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs y Estadísticas del Sistema */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Mensajes"
                    value={stats.totalMessages.toString()}
                    icon={MessageSquare}
                    subtitle={`${stats.totalReplies} respuestas`}
                    trend="up"
                />
                <StatsCard
                    label="Cursos Activos"
                    value={stats.totalCourses.toString()}
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

            {/* Resumen del sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Curso más activo */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Curso Más Activo
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

                {/* Estadísticas del sistema */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Estadísticas del Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Docentes</span>
                                <span className="font-semibold">{stats.totalTeachers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Estudiantes</span>
                                <span className="font-semibold">{stats.totalStudents}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cursos</span>
                                <span className="font-semibold">{stats.totalCourses}</span>
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

                {/* Actividad reciente */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5 text-purple-500" />
                            Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-gray-900">
                                    {stats.recentActivity}
                                </span>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    +{Math.round(stats.recentActivity * 0.15)} esta semana
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Mensajes en los últimos 7 días
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min((stats.recentActivity / 100) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de todos los cursos */}
            <div>
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Todos los Cursos ({courses.length})
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            <span>Gestión completa del sistema</span>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Supervisa y gestiona los muros de todos los cursos del sistema educativo
                    </p>
                </div>

                {coursesWithActivity.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos registrados</h3>
                            <p className="text-gray-600">Crea cursos para comenzar a usar el sistema de mensajería.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {coursesWithActivity.map((course) => (
                            <div key={course.firestoreId} className="relative">
                                <CourseCard
                                    course={{
                                        ...course,
                                        nombre: course.nombre,
                                        division: course.division,
                                        firestoreId: course.firestoreId || '',
                                    }}
                                    descripcion={`${course.messageCount} mensajes • ${course.recentMessages} recientes`}
                                    link={`/mensajes?tab=wall&id=${course.firestoreId}`}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
