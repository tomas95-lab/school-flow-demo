import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { LoadingState } from "@/components/LoadingState";
import { AccessDenied } from "@/components/AccessDenied";
import { ErrorState } from "@/components/ErrorState";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { BookOpen, AlertTriangle, Award, TrendingUp, Users, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AdminBoletinesOverview from "@/components/AdminBoletinesOverview";
import AlumnoBoletinesOverview from "@/components/AlumnoBoletinesOverview";
import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";

export default function Boletines() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { loading: coursesLoading, error: coursesError } = useFirestoreCollection("courses");

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa los boletines de todos los cursos, docentes y estudiantes del sistema educativo.";
      case "docente":
        return "Genera y administra los boletines de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta tu boletín académico y mantente al día con tu rendimiento.";
      default:
        return "Panel de gestión de boletines del sistema educativo.";
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
        return BookOpen;
    }
  };

  // Verificar permisos de acceso
  const canAccessBoletines = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de boletines..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Mostrar error si hay un problema al cargar los cursos
  if (coursesError) {
    return (
      <ErrorState 
        title="Error al cargar cursos"
        message="No se pudieron cargar los cursos. Esto puede afectar la funcionalidad del sistema."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessBoletines) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de boletines." />
  }

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Boletines
                  </h1>
                  <p className="text-sm text-gray-500">Revisa el estado de los boletines por curso. Los datos se actualizan cada 5 minutos.</p>
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
            </div>
          </div>
        </div>

        {/* Contenido principal con animaciones */}
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Vista según rol */}
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {(user?.role === "admin" || user?.role === "docente") ? (
              <AdminBoletinesOverview />
            ) : (
              <AlumnoBoletinesOverview />
            )}
          </div>

          {/* Observaciones automáticas */}
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <ObservacionesAutomaticasPanel 
              role={user?.role as "admin" | "docente" | "alumno"} 
              context="boletines" 
              className="mb-8" 
            />
          </div>
        </div>

        {/* Footer con información adicional */}
        <Separator className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con la gestión de boletines? Consulta nuestros recursos.
            </p>
            <div className="flex gap-3">
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Guía de boletines
              </button>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Soporte técnico
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
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
          <Card className="mt-6 border-purple-200 bg-purple-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">
                    Consejos para administradores y docentes
                  </h4>
                  <p className="text-sm text-purple-800">
                    • Genera los boletines al final de cada período académico<br/>
                    • Revisa las calificaciones antes de generar los boletines<br/>
                    • Utiliza las observaciones automáticas para mejorar el análisis<br/>
                    • Mantén comunicación constante con los estudiantes sobre su progreso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === "alumno" && (
          <Card className="mt-6 border-purple-200 bg-purple-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">
                    Información para estudiantes
                  </h4>
                  <p className="text-sm text-purple-800">
                    • Revisa tu boletín regularmente para mantener un seguimiento de tu progreso<br/>
                    • Los boletines se actualizan automáticamente cuando los docentes los generan<br/>
                    • Utiliza los filtros para analizar tu rendimiento por materia o período<br/>
                    • Contacta a tus docentes si tienes dudas sobre tu boletín
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
