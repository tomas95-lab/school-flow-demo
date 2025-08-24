import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";

import { where } from "firebase/firestore";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { Bell, Plus, AlertTriangle, Award, TrendingUp, Users, MessageSquare, BarChart3, Brain, Settings, FileText, Cog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AccessDenied } from "@/components/AccessDenied";
import AlertDashboard from "@/components/AlertDashboard";
import AlertRulesManager from "@/components/AlertRulesManager";
import AlertTemplatesManager from "@/components/AlertTemplatesManager";
import AlertSystemSettings from "@/components/AlertSystemSettings";
import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";
import { BarChartComponent, LineChartComponent, PieChartComponent } from "@/components/charts";

// Tipos para las pestañas
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function Alertas() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const roleScope = user?.role;
  const [activeView, setActiveView] = useState("overview");

  // Obtener alertas según el rol
  const { data: alerts, loading: alertsLoading } = useFirestoreCollection("alerts", {
    constraints: roleScope === "alumno" ? [
      where("recipients", "array-contains", "all")
    ] : [],
    dependencies: [roleScope]
  });

  // Obtener estudiantes y cursos para generar charts
  const { data: students } = useFirestoreCollection("students");
  const { data: courses } = useFirestoreCollection("courses");

  // Configuración de pestañas
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Dashboard",
      icon: Bell,
      description: "Vista general de alertas y métricas"
    },
    {
      id: "rules",
      label: "Reglas",
      icon: Settings,
      description: "Configurar reglas automáticas de alertas",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin"
    },
    {
      id: "templates",
      label: "Plantillas",
      icon: FileText,
      description: "Gestionar plantillas de alertas",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin" || role === "docente"
    },
    {
      id: "charts",
      label: "Analytics",
      icon: BarChart3,
      description: "Análisis y estadísticas avanzadas"
    },
    {
      id: "observaciones",
      label: "IA",
      icon: Brain,
      description: "Observaciones automáticas con IA"
    },
    {
      id: "config",
      label: "Configuración",
      icon: Cog,
      description: "Configuración global del sistema",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin"
    }
  ];

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa todas las alertas del sistema educativo de EduNova.";
      case "docente":
        return "Administra las alertas de tus materias y cursos asignados.";
      case "alumno":
        return "Mantente informado sobre tus alertas académicas y notificaciones importantes.";
      default:
        return "Panel de gestión de alertas de EduNova.";
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
  const canAccessAlerts = Boolean(user);
  const canCreateAlerts = user?.role === "admin" || user?.role === "docente";

  // Filtrar pestañas según permisos
  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission && tab.permissionCheck) {
      return tab.permissionCheck(user?.role);
    }
    return true;
  });

  // Generar datos para charts de alertas
  const generateAlertChartData = () => {
    if (!alerts || !students || !courses) {
      return null;
    }

    // Datos para bar chart de alertas por prioridad
    const alertsByPriority = [
      { prioridad: 'Crítica', cantidad: alerts.filter(a => a.priority === 'critical').length },
      { prioridad: 'Alta', cantidad: alerts.filter(a => a.priority === 'high').length },
      { prioridad: 'Media', cantidad: alerts.filter(a => a.priority === 'medium').length },
      { prioridad: 'Baja', cantidad: alerts.filter(a => a.priority === 'low').length }
    ].filter(item => item.cantidad > 0);

    // Datos para line chart de alertas por mes
    const alertsByMonth = [
      { mes: 'Ene', alertas: 0 },
      { mes: 'Feb', alertas: 0 },
      { mes: 'Mar', alertas: 0 },
      { mes: 'Abr', alertas: 0 },
      { mes: 'May', alertas: 0 },
      { mes: 'Jun', alertas: 0 }
    ];

    // Calcular alertas por mes
    alerts.forEach(alert => {
      if (alert.createdAt) {
        const date = new Date(alert.createdAt);
        const month = date.getMonth();
        if (month >= 0 && month < 6) {
          alertsByMonth[month].alertas += 1;
        }
      }
    });

    // Datos para pie chart de distribución de tipos de alerta
    const alertTypeDistribution = [
      { tipo: 'Académica', cantidad: alerts.filter(a => a.type === 'academic').length },
      { tipo: 'Asistencia', cantidad: alerts.filter(a => a.type === 'attendance').length },
      { tipo: 'Comportamiento', cantidad: alerts.filter(a => a.type === 'behavior').length },
      { tipo: 'Sistema', cantidad: alerts.filter(a => a.type === 'system').length }
    ].filter(item => item.cantidad > 0);

    return {
      alertsByPriority,
      alertsByMonth,
      alertTypeDistribution
    };
  };

  const chartData = generateAlertChartData();

  // Renderizar contenido de la vista activa
  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <AlertDashboard className="mt-0" />;
      case "rules":
        return <AlertRulesManager className="mt-0" />;
      case "templates":
        return <AlertTemplatesManager className="mt-0" />;
      case "charts":
        return (
          <div className="space-y-6">
            {chartData ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Análisis de Alertas</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Visualizaciones y estadísticas de las alertas del sistema</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* Chart de Alertas por Prioridad */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full min-w-0">
                    <BarChartComponent
                      data={chartData.alertsByPriority}
                      xKey="prioridad"
                      yKey="cantidad"
                      title="Alertas por Prioridad"
                      description="Distribución de alertas según su nivel de urgencia"
                      className="h-64 sm:h-80 w-full"
                    />
                  </div>

                  {/* Chart de Alertas por Mes */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full min-w-0">
                    <LineChartComponent
                      data={chartData.alertsByMonth}
                      xKey="mes"
                      yKey="alertas"
                      title="Tendencia de Alertas"
                      description="Número de alertas generadas por mes"
                      className="h-64 sm:h-80 w-full"
                      color="#ef4444"
                    />
                  </div>

                  {/* Chart de Distribución de Tipos de Alerta */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full min-w-0">
                    <PieChartComponent
                      data={chartData.alertTypeDistribution}
                      dataKey="cantidad"
                      nameKey="tipo"
                      title="Distribución por Tipo"
                      description="Tipos de alertas en el sistema"
                      className="h-64 sm:h-80 w-full"
                      colors={["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"]}
                    />
                  </div>

                  {/* Estadísticas Generales de Alertas */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full min-w-0">
                    <div className="h-64 sm:h-80 flex items-center justify-center">
                      <div className="text-center w-full max-w-full">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 break-words">Estadísticas Generales</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6">
                          <div className="text-center">
                            <div className="text-xl sm:text-3xl font-bold text-red-600">
                              {alerts?.length || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Total Alertas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-3xl font-bold text-orange-600">
                              {alerts?.filter(a => a.priority === 'critical').length || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Críticas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-3xl font-bold text-blue-600">
                              {alerts?.filter(a => a.status === 'pending').length || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Pendientes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-3xl font-bold text-green-600">
                              {alerts?.filter(a => a.status === 'resolved').length || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Resueltas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-8 w-full">
                <div className="text-center max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">Sin datos disponibles</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">Los gráficos aparecerán cuando haya alertas en el sistema</p>
                </div>
              </div>
            )}
          </div>
        );
      case "observaciones":
        return (
          <ObservacionesAutomaticasPanel 
            role={user?.role as "admin" | "docente" | "alumno"} 
            context="general" 
            className="mb-6" 
          />
        );
      case "config":
        return <AlertSystemSettings className="mt-0" />;
      default:
        return null;
    }
  };

  if (userLoading || alertsLoading) {
    return (
      <LoadingState 
        text="Cargando panel de alertas..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessAlerts) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de alertas." />
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
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Alertas
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
              {canCreateAlerts && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shrink-0 min-w-0"
                    >
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span className="hidden sm:inline">Nueva Alerta</span>
                      <span className="sm:hidden">Nueva</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Crear nueva alerta
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
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg' 
                          : 'hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <TabIcon className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label}</span>
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

        {/* Contenido principal */}
        <div className="mb-8">
          {renderActiveView()}
        </div>

        {/* Footer con información adicional */}
        <Separator className="my-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full overflow-hidden">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              ¿Necesitas ayuda con el sistema de alertas? Consulta nuestros recursos.
            </p>
            <div className="flex flex-col xs:flex-row gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start p-0"
                onClick={() => navigate('/app/guia-alertas')}
              >
                Guía de alertas
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 justify-start p-0">
                Soporte técnico
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
              Estado del Sistema
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-3">
              Todos los sistemas funcionando correctamente.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-green-600 font-medium">Operativo</span>
            </div>
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