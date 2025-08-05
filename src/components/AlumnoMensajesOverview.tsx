import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { CourseCard } from "./CourseCard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  MessageSquare, 
  Activity,
  MessageCircle,
  Clock,
  Star,
  BookOpen,
  MessageCircle as MessageCircleIcon,
  ArrowRight,
  GraduationCap,
  Bell,
  Eye
} from "lucide-react";
import { StatsCard } from "./StatCards";
import { useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { Message, Course } from "@/types";
import { useNavigate } from "react-router-dom";

export default function AlumnoMensajesOverview() {
    const { user } = useContext(AuthContext);
    const { data: messages } = useFirestoreCollection<Message>("messages");
    const { data: courses } = useFirestoreCollection<Course>("courses");
    const { data: students } = useFirestoreCollection("students");
    const navigate = useNavigate();

    // Obtener información del estudiante
    const student = students?.find(s => s.firestoreId === user?.studentId);
    const studentCourses = courses?.filter(course => 
        student?.cursos?.includes(course.firestoreId)
    ) || [];

    // Calcular estadísticas del estudiante
    const stats = useMemo(() => {
        if (!studentCourses || !messages || !user?.studentId) {
            return {
                totalMessages: 0,
                totalReplies: 0,
                myCourses: 0,
                recentActivity: 0,
                mostActiveCourse: null as Course | null
            };
        }

        const activeMessages = messages.filter(m => m.status === 'active');
        const studentMessages = activeMessages.filter(m => 
            studentCourses.some(c => c.firestoreId === m.courseId)
        );
        
        const totalReplies = studentMessages.reduce((acc, msg) => acc + (msg.replies?.length || 0), 0);
        
        // Calcular mensajes por curso del estudiante
        const messagesPerCourse = studentCourses.map(course => {
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
        const recentActivity = studentMessages.filter(m => 
            new Date(m.createdAt) > oneWeekAgo
        ).length;

        return {
            totalMessages: studentMessages.length,
            totalReplies,
            myCourses: studentCourses.length,
            recentActivity,
            mostActiveCourse
        };
    }, [studentCourses, messages, user?.studentId]);

    // Obtener cursos del estudiante con actividad
    const coursesWithActivity = useMemo(() => {
        if (!studentCourses || !messages) return [];

        return studentCourses.map(course => {
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
    }, [studentCourses, messages]);

    if (!user?.studentId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h2>
                    <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header del estudiante */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            ¡Hola, {student?.nombre} {student?.apellido}!
                        </h1>
                        <p className="text-gray-600">
                            Mantente al día con las comunicaciones de tus cursos
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIs y Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Mis Cursos"
                    value={stats.myCourses.toString()}
                    icon={BookOpen}
                    subtitle="Cursos inscritos"
                    trend="up"
                />
                <StatsCard
                    label="Mensajes Recientes"
                    value={stats.totalMessages.toString()}
                    icon={MessageSquare}
                    subtitle={`${stats.totalReplies} respuestas`}
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
                    label="Notificaciones"
                    value="3"
                    icon={Bell}
                    subtitle="Sin leer"
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
                            <Eye className="h-5 w-5 text-green-500" />
                            Mi Participación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cursos</span>
                                <span className="font-semibold">{stats.myCourses}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Mensajes</span>
                                <span className="font-semibold">{stats.totalMessages}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Respuestas</span>
                                <span className="font-semibold">{stats.totalReplies}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Promedio mensajes/curso</span>
                                    <span className="font-semibold text-green-600">
                                        {stats.myCourses > 0 ? Math.round(stats.totalMessages / stats.myCourses) : 0}
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
                            Mis Cursos ({studentCourses.length})
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Cursos donde estás inscrito</span>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Accede a los muros de tus cursos y mantente informado de las comunicaciones
                    </p>
                </div>

                {coursesWithActivity.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos asignados</h3>
                            <p className="text-gray-600">Contacta a tu coordinador para que te asigne a cursos.</p>
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
                                <div className="absolute top-3 right-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/mensajes?tab=wall&id=${course.firestoreId}`)}
                                        className="flex items-center gap-1 bg-white/90 backdrop-blur-sm hover:bg-white"
                                    >
                                        <MessageCircleIcon className="h-3 w-3" />
                                        Ver Muro
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Panel de notificaciones */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notificaciones Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Nuevo mensaje en Matemáticas</p>
                                <p className="text-xs text-gray-600">Hace 2 horas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Recordatorio: Tarea de Historia</p>
                                <p className="text-xs text-gray-600">Hace 1 día</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Anuncio importante en Ciencias</p>
                                <p className="text-xs text-gray-600">Hace 2 días</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 