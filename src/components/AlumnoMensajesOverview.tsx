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
  Star,
  GraduationCap
} from "lucide-react";
import { StatsCard } from "./StatCards";
import { useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { Message, Course, Subject } from "@/types";

export default function AlumnoMensajesOverview() {
    const { user } = useContext(AuthContext);
    const { data: courses } = useFirestoreCollection<Course>("courses");
    const { data: subjects } = useFirestoreCollection<Subject>("subjects");
    const { data: messages } = useFirestoreCollection<Message>("messages");
    const { data: students } = useFirestoreCollection("students");

    // Obtener información del estudiante
    const studentInfo = students?.find(s => s.firestoreId === user?.studentId);
    
    // Obtener curso del estudiante
    const studentCourse = useMemo(() => {
        if (!courses || !studentInfo) return null;
        return courses.find(c => c.firestoreId === studentInfo.cursoId);
    }, [courses, studentInfo]);

    // Calcular estadísticas del estudiante
    const stats = useMemo(() => {
        if (!studentCourse || !messages || !user?.studentId) {
            return {
                totalMessages: 0,
                totalReplies: 0,
                myMessages: 0,
                recentActivity: 0,
                unreadMessages: 0
            };
        }

        const activeMessages = messages.filter(m => m.status === 'active');
        const courseMessages = activeMessages.filter(m => m.courseId === studentCourse.firestoreId);
        const myMessages = courseMessages.filter(m => m.authorId === user.studentId);
        
        const totalReplies = courseMessages.reduce((acc, msg) => acc + (msg.replies?.length || 0), 0);
        
        // Actividad reciente (últimos 7 días)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentActivity = courseMessages.filter(m => 
            new Date(m.createdAt) > oneWeekAgo
        ).length;

        return {
            totalMessages: courseMessages.length,
            totalReplies,
            myMessages: myMessages.length,
            recentActivity,
            unreadMessages: 0 // TODO: Implementar sistema de mensajes leídos
        };
    }, [studentCourse, messages, user?.studentId]);

    if (!studentInfo || !studentCourse) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Información no encontrada</h2>
                    <p className="text-gray-600">No se encontró información de tu curso.</p>
                    <p className="text-gray-500 text-sm mt-2">Contacta al administrador del sistema.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs y Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Mensajes del Curso"
                    value={stats.totalMessages.toString()}
                    icon={MessageSquare}
                    subtitle={`${stats.totalReplies} respuestas`}
                    trend="up"
                />
                <StatsCard
                    label="Mis Mensajes"
                    value={stats.myMessages.toString()}
                    icon={GraduationCap}
                    subtitle="Mensajes publicados"
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
                    label="Sin Leer"
                    value={stats.unreadMessages.toString()}
                    icon={MessageCircle}
                    subtitle="Mensajes nuevos"
                    trend="neutral"
                />
            </div>

            {/* Información del curso */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mi curso */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Mi Curso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    {studentCourse.nombre} - {studentCourse.division}
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

                {/* Mi participación */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <GraduationCap className="h-5 w-5 text-green-500" />
                            Mi Participación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Mis mensajes</span>
                                <span className="font-semibold">{stats.myMessages}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total del curso</span>
                                <span className="font-semibold">{stats.totalMessages}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Sin leer</span>
                                <span className="font-semibold">{stats.unreadMessages}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Participación</span>
                                    <span className="font-semibold text-green-600">
                                        {stats.totalMessages > 0 ? Math.round((stats.myMessages / stats.totalMessages) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Acceso al muro del curso */}
            <div>
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Muro de mi Curso
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Comunicación con el curso</span>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Accede al muro de tu curso para ver mensajes y comunicarte con docentes y compañeros
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <CourseCard
                        course={{
                            nombre: studentCourse.nombre,
                            division: studentCourse.division,
                            firestoreId: studentCourse.firestoreId || '',
                        }}
                        descripcion={`${stats.totalMessages} mensajes • ${stats.recentActivity} recientes`}
                        link={`/mensajes/detalles?id=${studentCourse.firestoreId}`}
                    />
                </div>
            </div>

            {/* Consejos para el estudiante */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <MessageSquare className="h-5 w-5" />
                        Consejos para usar el muro
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div className="space-y-2">
                            <p className="font-medium">📝 Participa activamente</p>
                            <p>Comparte dudas, preguntas y comentarios constructivos con tu curso.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium">👥 Respeta a otros</p>
                            <p>Mantén un ambiente respetuoso y colaborativo en todas las comunicaciones.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium">🔔 Mantente al día</p>
                            <p>Revisa regularmente los mensajes para no perderte información importante.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium">💬 Usa las respuestas</p>
                            <p>Responde a mensajes específicos para mantener conversaciones organizadas.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 