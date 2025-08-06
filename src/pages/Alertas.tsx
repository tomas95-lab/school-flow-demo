import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { Bell, Lock, AlertTriangle, Award, TrendingUp, Users, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AdminAlertasOverview from "@/components/AdminAlertasOverview";
import TeacherAlertasOverview from "@/components/TeacherAlertasOverview";
import AlumnoAlertasOverview from "@/components/AlumnoAlertasOverview";
import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";

export default function Alertas() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { loading: coursesLoading } = useFirestoreCollection("courses");

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa todas las alertas del sistema educativo, notificaciones y comunicaciones importantes.";
      case "docente":
        return "Revisa alertas relacionadas con tus cursos y estudiantes asignados.";
      case "alumno":
        return "Consulta tus notificaciones personales y mantente informado sobre tu rendimiento académico.";
      default:
        return "Panel de gestión de alertas y notificaciones del sistema educativo.";
    }
  };

  // Función para obtener el icono del rol
  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return Users;
      case "docente":
        return Award;
      case "alumno":
        return TrendingUp;
      default:
        return Bell;
    }
  };

  // Verificar permisos de acceso
  const canAccessAlertas = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de alertas..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessAlertas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600 mb-4">
                  No tienes permisos para acceder al módulo de alertas.
                </p>
                <p className="text-gray-500 text-sm">
                  Contacta al administrador del sistema si crees que esto es un error.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Panel de Alertas
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                      {user?.role === "docente" && "Docente"}
                      {user?.role === "alumno" && "Estudiante"}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">EduNova</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                {getRoleMessage(user?.role)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg">
                      <Bell className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Sistema de Alertas</p>
                      <p className="font-bold text-gray-900">Notificaciones Activas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contenido principal con animaciones */}
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Vista según rol */}
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {user?.role === "admin" ? (
              <AdminAlertasOverview />
            ) : user?.role === "docente" ? (
              <TeacherAlertasOverview />
            ) : (
              <AlumnoAlertasOverview />
            )}
          </div>

          {/* Observaciones automáticas */}
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <ObservacionesAutomaticasPanel 
              role={user?.role as "admin" | "docente" | "alumno"} 
              context="general" 
              className="mb-8" 
            />
          </div>
        </div>

        {/* Footer con información adicional */}
        <Separator className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con el sistema de alertas? Consulta nuestros recursos.
            </p>
            <div className="flex gap-3">
              <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                Guía de alertas
              </button>
              <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                Soporte técnico
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Última Actualización
            </h3>
            <p className="text-gray-600">
              Los datos fueron actualizados por última vez hace pocos minutos. 
              El sistema se sincroniza automáticamente cada 5 minutos.
            </p>
          </div>
        </div>

        {/* Alertas informativas según el rol */}
        {(user?.role === "admin" || user?.role === "docente") && (
          <Card className="mt-6 border-red-200 bg-red-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900 mb-1">
                    Consejos para administradores y docentes
                  </h4>
                  <p className="text-sm text-red-800">
                    • Crea alertas específicas y relevantes para tu audiencia<br/>
                    • Utiliza las observaciones automáticas para detectar patrones<br/>
                    • Revisa el calendario para planificar notificaciones importantes<br/>
                    • Mantén comunicación constante con los estudiantes sobre alertas críticas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === "alumno" && (
          <Card className="mt-6 border-red-200 bg-red-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900 mb-1">
                    Información para estudiantes
                  </h4>
                  <p className="text-sm text-red-800">
                    • Revisa tus alertas regularmente para mantenerte informado<br/>
                    • Las alertas se actualizan automáticamente cuando se crean<br/>
                    • Utiliza los filtros para organizar tus notificaciones por prioridad<br/>
                    • Contacta a tus docentes si tienes dudas sobre alguna alerta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
