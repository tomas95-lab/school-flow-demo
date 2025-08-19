import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { BookOpen, Plus, Calendar, AlertTriangle, Brain, Award, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AccessDenied } from "@/components/AccessDenied";
import { EmptyState } from "@/components/EmptyState";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Componentes de vista por rol
import AdminCalificacionesOverview from "@/components/AdminCalificacionesOverview";
import TeacherCalificacionesOverview from "@/components/TeacherCalificacionesOverView";
import AlumnoCalificacionesOverview from "@/components/AlumnoCalificacionesOverview";

// Nuevos componentes
// import QuickGradeRegister from "@/components/QuickGradeRegister";
import GradesCalendar from "@/components/GradesCalendar";
import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";
// Charts import no utilizado en esta vista
import { usePermission } from "@/hooks/usePermission";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";

// Tipos para las pestañas
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function Calificaciones() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const roleScope = user?.role;
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  const { loading: coursesLoading } = useFirestoreCollection("courses", {
    constraints: roleScope === 'alumno'
      ? [where('alumnos', 'array-contains', user?.studentId || '')]
      : roleScope === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    dependencies: [roleScope, user?.studentId, user?.teacherId]
  });
  // Datos mínimos para estado vacío en overview (solo alumno)
  const { data: calificaciones } = useFirestoreCollection("calificaciones", {
    constraints: roleScope === 'alumno'
      ? [where('studentId', '==', user?.studentId || '')]
      : roleScope === 'docente' && teacherCourseIds.length > 0
        ? [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
        : [],
    enableCache: true,
    dependencies: [roleScope, user?.studentId, teacherCourseIds.join(',')]
  });
  const [activeView, setActiveView] = useState("overview");

  // Configuración de pestañas
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Resumen",
      icon: BookOpen,
      description: "Vista general de calificaciones"
    },
    // Registro rápido se movió al detalle; se elimina la pestaña Registrar
    {
      id: "calendar",
      label: "Calendario",
      icon: Calendar,
      description: "Calendario de evaluaciones"
    },
    {
      id: "observaciones",
      label: "Observaciones IA",
      icon: Brain,
      description: "Análisis inteligente automático"
    }
  ];

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa las calificaciones de todos los cursos, docentes y estudiantes de EduNova.";
      case "docente":
        return "Registra y administra las calificaciones de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta tu historial de calificaciones y mantente al día con tu rendimiento académico.";
      default:
        return "Panel de gestión de calificaciones de EduNova.";
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

  // Verificar permisos de acceso (centralizado)
  const { can } = usePermission();
  const canAccessGrades = Boolean(user);
  const canRegisterGrades = can("canEditGrades");
  const canViewCalendar = Boolean(user);

  // Filtrar pestañas según permisos
  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission) {
      return can("canEditGrades");
    }
    return true;
  });

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de calificaciones..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessGrades) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de calificaciones." />
  }

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Calificaciones
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                      {user?.role === "docente" && "Docente"}
                      {user?.role === "alumno" && "Estudiante"}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full hidden sm:block"></div>
                    <span className="text-xs sm:text-sm text-gray-500">EduNova</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
                {getRoleMessage(user?.role)}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap max-w-full overflow-hidden">
              {canRegisterGrades && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setActiveView("register")}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shrink-0 min-w-0"
                    >
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span className="hidden sm:inline">Registrar Calificaciones</span>
                      <span className="sm:hidden">Registrar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Registra notas para tus evaluaciones
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Navegación por tabs mejorada */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 max-w-full overflow-hidden">
            {availableTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeView === tab.id;
              
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      onClick={() => setActiveView(tab.id)}
                      className={`flex items-center gap-2 transition-all duration-300 shrink-0 min-w-0 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                          : 'hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <TabIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tab.description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Contenido según vista activa con animaciones */}
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {activeView === "overview" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {/* Estado vacío para alumno sin calificaciones */}
              {user?.role === 'alumno' && Array.isArray(calificaciones) && calificaciones.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Sin calificaciones registradas"
                  description="Aún no hay calificaciones disponibles. Vuelve más tarde."
                />
              ) : (
                <>
                  {user?.role === "admin" ? (
                    <AdminCalificacionesOverview />
                  ) : user?.role === "docente" ? (
                    <TeacherCalificacionesOverview />
                  ) : (
                    <AlumnoCalificacionesOverview />
                  )}
                </>
              )}
            </div>
          )}

          {/* Registro rápido eliminado: ahora va dentro de DetallesCalificaciones */}

          {activeView === "calendar" && canViewCalendar && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <GradesCalendar />
            </div>
          )}

          {activeView === "observaciones" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ObservacionesAutomaticasPanel 
                role={user?.role as "admin" | "docente" | "alumno"} 
                context="calificaciones" 
                className="mb-8" 
              />
            </div>
          )}
          
          {/* Estado vacío cuando no hay vista activa */}
          {!activeView && (
            <div className="text-center py-12 animate-in fade-in-50 duration-500">
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay vista seleccionada
                  </h3>
                  <p className="text-gray-600">
                    Selecciona una opción del menú para comenzar.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Sin estado de registrar */}
          
          {/* Estado vacío para calendario sin permisos */}
          {activeView === "calendar" && !canViewCalendar && (
            <div className="text-center py-12 animate-in fade-in-50 duration-500">
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="p-4 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Acceso Restringido
                  </h3>
                  <p className="text-gray-600">
                    No tienes permisos para ver el calendario de calificaciones.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer con información adicional */}
        <Separator className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con la gestión de calificaciones? Consulta nuestros recursos.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Guía de calificaciones
              </Button>
              <Button variant="outline" size="sm">
                Soporte técnico
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Última Actualización
            </h3>
            <p className="text-gray-600">
              Los datos fueron actualizados por última vez hace pocos minutos. 
              El sistema se sincroniza automáticamente cada 5 minutos.
            </p>
          </div>
        </div>

        {/* Alertas informativas según el rol */}
        {user?.role === "docente" && (
          <Card className="mt-6 border-blue-200 bg-blue-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Consejos para docentes
                  </h4>
                  <p className="text-sm text-blue-800">
                    • Registra las calificaciones dentro de las 48 horas posteriores a la evaluación<br/>
                    • Utiliza el registro rápido para evaluaciones masivas<br/>
                    • Revisa el calendario para planificar futuras evaluaciones<br/>
                    • Mantén comunicación constante con los estudiantes sobre su progreso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === "alumno" && (
          <Card className="mt-6 border-green-200 bg-green-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    Información para estudiantes
                  </h4>
                  <p className="text-sm text-green-800">
                    • Revisa regularmente tus calificaciones para mantener un seguimiento de tu progreso<br/>
                    • Las calificaciones se actualizan automáticamente cuando los docentes las registran<br/>
                    • Utiliza los filtros para analizar tu rendimiento por materia o período<br/>
                    • Contacta a tus docentes si tienes dudas sobre alguna evaluación
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
