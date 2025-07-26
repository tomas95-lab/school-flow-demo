import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
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
  Star
} from "lucide-react";
import { StatsCard } from "./StatCards";
import { useMemo } from "react";
import type { Message, Course, Subject } from "@/types";

export default function AdminMensajesOverview() {
    const { data: courses } = useFirestoreCollection<Course>("courses");
    const { data: subjects } = useFirestoreCollection<Subject>("subjects");
    const { data: messages } = useFirestoreCollection<Message>("messages");
    const { data: students } = useFirestoreCollection("students");
    const { data: teachers } = useFirestoreCollection("teachers");

    // Calcular estadísticas
    const stats = useMemo(() => {
        if (!courses || !subjects || !messages || !students || !teachers) {
            return {
                totalMessages: 0,
                totalReplies: 0,
                activeCourses: 0,
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
            activeCourses: courses.length,
            totalStudents: students.length,
            totalTeachers: teachers.length,
            avgMessagesPerCourse: courses.length > 0 ? Math.round(activeMessages.length / courses.length) : 0,
            mostActiveCourse,
            recentActivity
        };
    }, [courses, subjects, messages, students, teachers]);

    // Obtener cursos con más actividad
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

    return (
    <div className="space-y-6">
        {/* KPIs y Estadísticas */}
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
                value={stats.activeCourses.toString()}
                icon={Users}
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

            {/* Actividad reciente */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Actividad Reciente
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
                        Participación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Estudiantes</span>
                            <span className="font-semibold">{stats.totalStudents}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Docentes</span>
                            <span className="font-semibold">{stats.totalTeachers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Cursos</span>
                            <span className="font-semibold">{stats.activeCourses}</span>
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

        {/* Lista de cursos */}
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
                    Administra los muros de cada curso y revisa su actividad
                </p>
            </div>

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
        </div>
    </div>
    );
}
