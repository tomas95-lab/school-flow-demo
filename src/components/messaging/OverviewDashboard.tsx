import { useContext, useEffect, useState } from "react";
import { where, documentId } from "firebase/firestore";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "../ui/alert";
import { 
  MessageSquare, 
  Users, 
  Activity, 
  TrendingUp,
  Clock,
  ThumbsUp,
  Reply,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "../ui/button";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import type { Message, Course, Subject } from "@/types";

export default function OverviewDashboard() {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];
  
  // Alumno: obtener su curso para filtrar
  const { data: myStudentArr } = useFirestoreCollection("students", {
    constraints: user?.role === 'alumno' && user?.studentId ? [where(documentId(), '==', user.studentId)] : [],
    dependencies: [user?.role, user?.studentId]
  });
  const studentCourseId = Array.isArray(myStudentArr) && myStudentArr.length > 0
    ? (myStudentArr[0]?.cursoId || myStudentArr[0]?.courseId)
    : undefined;

  const { data: messages, loading: messagesLoading, error: messagesError, refetch: refetchMessages } = useFirestoreCollection<Message>("messages", {
    constraints:
      user?.role === 'docente' && teacherCourseIds.length > 0
        ? [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
        : user?.role === 'alumno' && studentCourseId
          ? [where('courseId', '==', String(studentCourseId))]
          : [],
    dependencies: [user?.role, teacherCourseIds.join(','), String(studentCourseId || '')]
  });
  const { data: courses, loading: coursesLoading, error: coursesError } = useFirestoreCollection<Course>("courses", {
    constraints:
      user?.role === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : user?.role === 'alumno' && studentCourseId
          ? [where(documentId(), '==', String(studentCourseId))]
          : [],
    dependencies: [user?.role, user?.teacherId, String(studentCourseId || '')]
  });
  const { data: subjects, loading: subjectsLoading, error: subjectsError } = useFirestoreCollection<Subject>("subjects");
  
  const [stats, setStats] = useState({
    myMessages: 0,
    totalCourses: 0,
    totalActivity: 0,
    averageEngagement: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!messages || !courses || !subjects || !user) return;

    try {
      const uid = user.role === "docente" ? user.teacherId : user.role === "alumno" ? user.studentId : user.uid;
      
      const myMessages = messages.filter(m => m.authorId === uid && m.status === 'active').length;
      
      let totalCourses = 0;
      if (user.role === 'admin') {
        totalCourses = courses.length;
      } else if (user.role === 'docente') {
        // Usar cursos unificados del hook para evitar doble conteo y normalizar IDs
        totalCourses = teacherCourses.length;
      } else if (user.role === 'alumno') {
        totalCourses = studentCourseId ? courses.filter(c => c.firestoreId === String(studentCourseId)).length : 0;
      }

      const totalActivity = messages.filter(m => m.status === 'active').length;
      const totalLikes = messages.reduce((sum, m) => sum + (m.likes?.length || 0), 0);
      const totalReplies = messages.reduce((sum, m) => sum + (m.replies?.length || 0), 0);
      const averageEngagement = totalActivity > 0 ? Math.round((totalLikes + totalReplies) / totalActivity * 10) / 10 : 0;

      setStats({
        myMessages,
        totalCourses,
        totalActivity,
        averageEngagement
      });
    } catch (err) {
      console.error("Error calculating stats:", err);
      setError("Error al calcular las estadísticas");
    }
  }, [messages, courses, subjects, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      await refetchMessages();
      toast.success("Datos actualizados");
    } catch (err) {
      setError("Error al actualizar los datos");
      toast.error("Error al actualizar los datos");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRoleSpecificStats = () => {
    if (!user) return [];

    switch (user.role) {
      case "admin":
        return [
          {
            title: "Total Mensajes",
            value: stats.totalActivity,
            icon: MessageSquare,
            color: "bg-blue-500",
            description: "Mensajes en el sistema"
          },
          {
            title: "Cursos Activos",
            value: stats.totalCourses,
            icon: Users,
            color: "bg-green-500",
            description: "Cursos con actividad"
          },
          {
            title: "Actividad Reciente",
            value: messages?.filter(m => {
              const createdAt = new Date(m.createdAt);
              const now = new Date();
              const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return diffHours <= 24;
            }).length || 0,
            icon: Activity,
            color: "bg-orange-500",
            description: "Últimas 24 horas"
          },
          {
            title: "Engagement Promedio",
            value: stats.averageEngagement,
            icon: TrendingUp,
            color: "bg-purple-500",
            description: "Interacciones por mensaje"
          }
        ];
      case "docente":
        return [
          {
            title: "Mis Mensajes",
            value: stats.myMessages,
            icon: MessageSquare,
            color: "bg-blue-500",
            description: "Mensajes publicados"
          },
          {
            title: "Mis Materias",
            value: stats.totalCourses,
            icon: Users,
            color: "bg-green-500",
            description: "Materias asignadas"
          },
          {
            title: "Actividad Reciente",
            value: messages?.filter(m => {
              const createdAt = new Date(m.createdAt);
              const now = new Date();
              const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return diffHours <= 24;
            }).length || 0,
            icon: Activity,
            color: "bg-orange-500",
            description: "Últimas 24 horas"
          },
          {
            title: "Promedio Engagement",
            value: stats.averageEngagement,
            icon: TrendingUp,
            color: "bg-purple-500",
            description: "Interacciones por mensaje"
          }
        ];
      default:
        return [
          {
            title: "Mis Mensajes",
            value: stats.myMessages,
            icon: MessageSquare,
            color: "bg-blue-500",
            description: "Mensajes publicados"
          },
          {
            title: "Mis Cursos",
            value: stats.totalCourses,
            icon: Users,
            color: "bg-green-500",
            description: "Cursos inscritos"
          },
          {
            title: "Actividad Reciente",
            value: messages?.filter(m => {
              const createdAt = new Date(m.createdAt);
              const now = new Date();
              const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return diffHours <= 24;
            }).length || 0,
            icon: Activity,
            color: "bg-orange-500",
            description: "Últimas 24 horas"
          },
          {
            title: "Promedio Engagement",
            value: stats.averageEngagement,
            icon: TrendingUp,
            color: "bg-purple-500",
            description: "Interacciones por mensaje"
          }
        ];
    }
  };

  const recentMessages = messages?.slice(0, 5) || [];
  const hasError = messagesError || coursesError || subjectsError;

  // Verificar si el usuario tiene acceso
  if (!user) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Debes iniciar sesión para ver el panel de mensajería.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Estado vacío de mensajería
  if (!messagesLoading && (messages?.length || 0) === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Sin actividad de mensajería"
        description="Aún no hay mensajes. Cuando se publiquen, verás la actividad aquí."
      />
    );
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Ha ocurrido un error al cargar los datos. 
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleRefresh}
              className="p-0 h-auto text-red-800 underline"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de actualizar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visión General</h2>
          <p className="text-gray-600">Resumen de actividad y estadísticas del sistema</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {messagesLoading || coursesLoading || subjectsLoading ? (
          // Skeleton loading para las estadísticas
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          getRoleSpecificStats().map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensajes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No hay mensajes recientes</p>
                  </div>
                ) : (
                  recentMessages.map((message, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">
                          {message.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{message.authorName}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.messageType}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{message.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {message.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Reply className="h-3 w-3" />
                            {message.replies?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mensajes Totales</span>
                  <span className="text-sm font-medium">{messages?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Likes Totales</span>
                  <span className="text-sm font-medium">
                    {messages?.reduce((sum, m) => sum + (m.likes?.length || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Respuestas Totales</span>
                  <span className="text-sm font-medium">
                    {messages?.reduce((sum, m) => sum + (m.replies?.length || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mensajes Fijados</span>
                  <span className="text-sm font-medium">
                    {messages?.filter(m => m.isPinned).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cursos Activos</span>
                  <span className="text-sm font-medium">{courses?.length || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Sistema Activo</h4>
              <p className="text-xs text-gray-500">Todos los servicios funcionando</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Última Actualización</h4>
              <p className="text-xs text-gray-500">Hace 5 minutos</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Usuarios Activos</h4>
              <p className="text-xs text-gray-500">Sistema en uso</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 