import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { where } from "firebase/firestore";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { Calendar, BookOpen, Plus, AlertTriangle, Brain, Award, TrendingUp, Users, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AccessDenied } from "@/components/AccessDenied";
import { EmptyState } from "@/components/EmptyState";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
// Registro rápido se realiza en DetalleAsistencia

// Componentes de vista por rol
import AdminAttendanceOverview from "@/components/AdminAttendanceOverview";
import TeacherAttendanceOverview from "@/components/TeacherAttendanceOverview";
import AlumnoAttendanceOverview from "@/components/AlumnoAttendanceOverview";

// Componente de alerta de asistencias pendientes
import AttendanceAlert from "@/components/AttendanceAlert";

// Componente de calendario
import AttendanceCalendar from "@/components/AttendanceCalendar";
import ImportAttendanceCSV from "../components/ImportAttendanceCSV";
import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";
import AttendanceThresholdsCard from "@/components/AttendanceThresholdsCard";
import { BarChartComponent, LineChartComponent, PieChartComponent } from "@/components/charts";
import { usePermission } from "@/hooks/usePermission";

// Tipos para las pestañas
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function Asistencias() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const roleScope = user?.role;
  const { teacherCourses } = useTeacherCourses(user?.teacherId);

  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];
  // La selección de curso y registro rápido se realiza desde el panel (overview) → DetalleAsistencia

  const { loading: coursesLoading } = useFirestoreCollection("courses", {
    constraints: roleScope === 'alumno'
      ? [where('alumnos', 'array-contains', user?.studentId || '')]
      : roleScope === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    dependencies: [roleScope, user?.studentId, user?.teacherId]
  });

  const { data: asistencias } = useFirestoreCollection("attendances", {
    constraints: roleScope === 'alumno'
      ? [where('studentId', '==', user?.studentId || '')]
      : roleScope === 'docente' && teacherCourseIds.length > 0
        ? [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
        : [],
    dependencies: [roleScope, user?.studentId, teacherCourseIds.join(',')]
  });

  const { data: students } = useFirestoreCollection("students", {
    constraints: roleScope === 'alumno'
      ? [where('firestoreId', '==', user?.studentId || '')]
      : roleScope === 'docente' && teacherCourseIds.length > 0
        ? [where('cursoId', 'in', teacherCourseIds.slice(0, 10))]
        : [],
    dependencies: [roleScope, user?.studentId, teacherCourseIds.join(',')]
  });

  const { data: courses } = useFirestoreCollection("courses", {
    constraints: roleScope === 'alumno'
      ? [where('alumnos', 'array-contains', user?.studentId || '')]
      : roleScope === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    dependencies: [roleScope, user?.studentId, user?.teacherId]
  });
  const { data: subjects } = useFirestoreCollection("subjects");
  const [activeView, setActiveView] = useState("overview");

  // Configuración de pestañas
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Resumen",
      icon: BookOpen,
      description: "Vista general de asistencias"
    },
    {
      id: "import",
      label: "Importar",
      icon: Upload,
      description: "Importar asistencias desde CSV",
      requiresPermission: true,
      permissionCheck: (role) => role === "docente" || role === 'admin'
    },
    {
      id: "charts",
      label: "Gráficos",
      icon: TrendingUp,
      description: "Visualizaciones de asistencias"
    },
    {
      id: "register",
      label: "Registrar",
      icon: Plus,
      description: "Registrar nuevas asistencias",
      requiresPermission: true,
      permissionCheck: (role) => role === "docente"
    },
    {
      id: "calendar",
      label: "Calendario",
      icon: Calendar,
      description: "Calendario de asistencias"
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
        return "Gestiona y supervisa las asistencias de todos los cursos, docentes y estudiantes de EduNova.";
      case "docente":
        return "Registra y administra las asistencias de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta tu historial de asistencias y mantente al día con tu rendimiento académico.";
      default:
        return "Panel de gestión de asistencias de EduNova.";
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
  const canAccessAttendance = Boolean(user);
  const canRegisterAttendance = can("canEditAttendance");
  const canViewCalendar = Boolean(user);

  // Filtrar pestañas según permisos
  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission) {
      return can("canEditAttendance");
    }
    return true;
  });

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de asistencias..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessAttendance) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de asistencias." />
  }

  // Generar datos para charts
  const generateAttendanceChartData = () => {
    if (!asistencias || !students || !courses || !subjects) {
      return null;
    }

    // Datos para line chart de asistencia por día de la semana
    const attendanceByDayOfWeek = [
      { dia: 'Lun', asistencia: 0 },
      { dia: 'Mar', asistencia: 0 },
      { dia: 'Mié', asistencia: 0 },
      { dia: 'Jue', asistencia: 0 },
      { dia: 'Vie', asistencia: 0 },
      { dia: 'Sáb', asistencia: 0 },
      { dia: 'Dom', asistencia: 0 }
    ];

    // Calcular asistencia por día de la semana
    asistencias.forEach(attendance => {
      if (attendance.fecha) {
        const date = new Date(attendance.fecha);
        const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir a índice 0-6 (Lun-Dom)
        
        if (dayIndex >= 0 && dayIndex < 7) {
          attendanceByDayOfWeek[dayIndex].asistencia += attendance.present ? 1 : 0;
        }
      }
    });

    // Datos para bar chart de asistencia por curso
    const attendanceByCourse = courses.map(course => {
      const courseAttendances = asistencias.filter(a => a.courseId === course.firestoreId);
      const presentCount = courseAttendances.filter(a => a.present).length;
      const attendancePercentage = courseAttendances.length > 0 
        ? Math.round((presentCount / courseAttendances.length) * 100)
        : 0;
      
      return {
        curso: course.nombre || course.name || 'Sin nombre',
        asistencia: attendancePercentage
      };
    }).filter(item => item.asistencia > 0);

    // Datos para pie chart de distribución de asistencias
    const attendanceDistribution = [
      { estado: 'Presente', cantidad: asistencias.filter(a => a.present).length },
      { estado: 'Ausente', cantidad: asistencias.filter(a => !a.present).length }
    ].filter(item => item.cantidad > 0);

    return {
      attendanceByDayOfWeek,
      attendanceByCourse,
      attendanceDistribution
    };
  };

  const chartData = generateAttendanceChartData();

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Asistencias
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
              {canRegisterAttendance && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setActiveView("register")}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shrink-0 min-w-0"
                    >
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span className="hidden sm:inline">Registrar Asistencias</span>
                      <span className="sm:hidden">Registrar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Registra asistencias para tus cursos asignados
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Alerta de asistencias pendientes */}
          <div className="mb-6">
            <AttendanceAlert />
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
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg' 
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
              {/* Estado vacío solo para alumno; docentes/admin ven su panel aunque no haya datos */}
              {user?.role === 'alumno' && Array.isArray(asistencias) && asistencias.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="Sin asistencias registradas"
                  description={
                    'Todavía no se cargaron asistencias para tu cuenta.'
                  }
                />
              ) : (
                <>
                  {(user?.role === 'admin' || user?.role === 'docente') && (
                    <div className="mb-6">
                      <AttendanceThresholdsCard />
                    </div>
                  )}
                  {user?.role === "admin" ? (
                    <AdminAttendanceOverview />
                  ) : user?.role === "docente" ? (
                    <TeacherAttendanceOverview />
                  ) : (
                    <AlumnoAttendanceOverview />
                  )}
                </>
              )}
            </div>
          )}

          {activeView === "charts" && (chartData ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Chart de Asistencia por Día de la Semana */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
                   <LineChartComponent
                     data={chartData.attendanceByDayOfWeek}
                     xKey="dia"
                     yKey="asistencia"
                     title="Asistencia por Día de la Semana"
                     description="Número de asistencias por día"
                     className="h-80"
                     color="#10b981"
                   />
                 </div>

                                 {/* Chart de Asistencia por Curso */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
                   <BarChartComponent
                     data={chartData.attendanceByCourse}
                     xKey="curso"
                     yKey="asistencia"
                     title="Asistencia por Curso"
                     description="Porcentaje de asistencia por curso"
                     className="h-80"
                   />
                 </div>

                                 {/* Chart de Distribución de Asistencias */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
                   <PieChartComponent
                     data={chartData.attendanceDistribution}
                     dataKey="cantidad"
                     nameKey="estado"
                     title="Distribución de Asistencias"
                     description="Estado general de asistencias"
                     className="h-80"
                     colors={["#10b981", "#ef4444"]}
                   />
                 </div>

                                 {/* Estadísticas Generales */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Generales</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {asistencias?.filter(a => a.present).length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Asistencias</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600">
                            {asistencias?.filter(a => !a.present).length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Ausencias</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {students?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Estudiantes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {courses?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Cursos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                <div className="text-center max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos de asistencias</h3>
                  <p className="text-gray-600 mb-4">Los charts aparecerán cuando haya datos disponibles</p>
                  <p className="text-gray-400 text-sm">Datos cargados desde Firestore</p>
                </div>
              </div>
            </div>
          ))}

          {activeView === "register" && canRegisterAttendance && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <EmptyState
                    icon={BookOpen}
                    title={'Registrar asistencias'}
                    description={'Usa el calendario o importa un CSV si tienes registros externos.'}
                    actionText={'Ir al Calendario'}
                    onAction={() => setActiveView('calendar')}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === "calendar" && canViewCalendar && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <AttendanceCalendar />
            </div>
          )}

          {activeView === "import" && canRegisterAttendance && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ImportAttendanceCSV />
            </div>
          )}

          {activeView === "observaciones" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ObservacionesAutomaticasPanel 
                role={user?.role as "admin" | "docente" | "alumno"} 
                context="asistencias" 
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
          
          {/* Estado vacío para registro sin permisos */}
          {activeView === "register" && !canRegisterAttendance && (
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
                    Solo los docentes pueden registrar asistencias.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
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
                    No tienes permisos para ver el calendario de asistencias.
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
              <CheckCircle className="h-5 w-5 text-green-600" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con la gestión de asistencias? Consulta nuestros recursos.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Guía de asistencias
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
          <Card className="mt-6 border-green-200 bg-green-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    Consejos para docentes
                  </h4>
                  <p className="text-sm text-green-800">
                    • Registra las asistencias dentro de las primeras horas de clase<br/>
                    • Utiliza el registro rápido para clases masivas<br/>
                    • Revisa el calendario para planificar futuras clases<br/>
                    • Mantén comunicación constante con los estudiantes sobre su asistencia
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
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    Información para estudiantes
                  </h4>
                  <p className="text-sm text-green-800">
                    • Revisa regularmente tu asistencia para mantener un seguimiento de tu participación<br/>
                    • Las asistencias se actualizan automáticamente cuando los docentes las registran<br/>
                    • Utiliza los filtros para analizar tu asistencia por materia o período<br/>
                    • Contacta a tus docentes si tienes dudas sobre alguna asistencia
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
