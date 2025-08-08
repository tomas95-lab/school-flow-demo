import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar, MessageSquare, Megaphone, Layout, AlertTriangle, Info, Settings, HelpCircle, MessageCircle, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { LoadingState } from "@/components/LoadingState";
import OverviewDashboard from "./messaging/OverviewDashboard";
import ConversationsView from "./messaging/ConversationsView";
import AnnouncementsView from "./messaging/AnnouncementsView";
import AnnouncementsPlaceholder from "./messaging/AnnouncementsPlaceholder";
import ConversationsPlaceholder from "./messaging/ConversationsPlaceholder";
import WallView from "./messaging/WallView";
import AdminMensajesOverview from "./AdminMensajesOverview";
import TeacherMensajesOverview from "./TeacherMensajesOverview";
import AlumnoMensajesOverview from "./AlumnoMensajesOverview";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { trackEvent } from "@/services/analytics";

type TabType = "overview" | "conversations" | "announcements" | "wall";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
  enabled: boolean;
  development?: boolean;
  roleAccess?: string[];
}

export default function MessagingModule() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración de pestañas con control de acceso y estado de desarrollo
  const getTabs = (): TabConfig[] => [
    {
      id: "overview",
      label: "Visión General",
      icon: Calendar,
      description: "Resumen y estadísticas",
      enabled: true,
      roleAccess: ["admin", "docente", "alumno"]
    },
    {
      id: "conversations",
      label: "Conversaciones",
      icon: MessageSquare,
      description: "Chats y mensajes directos",
      enabled: true,
      development: false,
      roleAccess: ["admin", "docente", "alumno"]
    },
    {
      id: "announcements",
      label: "Anuncios",
      icon: Megaphone,
      description: "Comunicaciones generales",
      enabled: true,
      development: false,
      roleAccess: ["admin", "docente"]
    },
    {
      id: "wall",
      label: "Muro",
      icon: Layout,
      description: "Mensajes del curso",
      enabled: true,
      roleAccess: ["admin", "docente", "alumno"]
    }
  ];

  const tabs = getTabs();

  // Manejar parámetros de URL para cambiar de pestaña
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      const targetTab = tabs.find(tab => tab.id === tabParam);
      if (targetTab && hasRoleAccess(targetTab)) {
        // Permitir navegar también a pestañas en desarrollo para mostrar placeholder
        setActiveTab(tabParam);
      } else {
        // Si la pestaña no está habilitada o no tiene acceso, redirigir a overview
        setActiveTab("overview");
        setSearchParams({ tab: "overview" });
      }
    }
  }, [searchParams, tabs]);

  // Verificar acceso por rol
  const hasRoleAccess = (tab: TabConfig): boolean => {
    if (!tab.roleAccess) return true;
    return tab.roleAccess.includes(user?.role || "");
  };

  // Manejar cambio de pestaña
  const handleTabChange = (tabId: TabType) => {
    const tab = tabs.find(t => t.id === tabId);
    
    if (!tab) {
      setError("Pestaña no encontrada");
      return;
    }

    if (!tab.enabled) {
      // Permitir seleccionar y mostrar placeholder en desarrollo
      setActiveTab(tabId);
      setSearchParams({ tab: tabId });
      toast.info("Esta funcionalidad está en desarrollo");
      trackEvent("messaging_tab_dev_selected", { tab: tabId });
      return;
    }

    if (!hasRoleAccess(tab)) {
      toast.error("No tienes permisos para acceder a esta sección");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setActiveTab(tabId);
      setSearchParams({ tab: tabId });
      toast.success(`Cambiado a ${tab.label}`);
      trackEvent("messaging_tab_selected", { tab: tabId });
    } catch (err) {
      setError("Error al cambiar de pestaña");
      console.error("Error changing tab:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener mensaje específico del rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa los muros de todos los cursos, docentes y estudiantes de EduNova.";
      case "docente":
        return "Registra y administra los muros de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta los muros de tus cursos y mantente al día con las comunicaciones.";
      default:
        return "Panel de gestión de muros y mensajería de EduNova.";
    }
  };

  // Obtener estadísticas rápidas
  const getQuickStats = () => {
    const enabledTabs = tabs.filter(tab => tab.enabled && hasRoleAccess(tab));
    const developmentTabs = tabs.filter(tab => tab.development && hasRoleAccess(tab));
    
    return {
      availableFeatures: enabledTabs.length,
      developmentFeatures: developmentTabs.length,
      totalFeatures: tabs.filter(tab => hasRoleAccess(tab)).length
    };
  };

  const quickStats = getQuickStats();

  // Spinner de carga global (misma lógica y componente que otros módulos)
  if (authLoading || user?.role === undefined) {
    return (
      <LoadingState
        text="Cargando módulo de mensajería..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Renderizar contenido de la pestaña activa
  const renderTabContent = () => {
    if (isLoading && user?.role !== undefined) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          user?.role === 'admin' ? <AdminMensajesOverview /> :
          user?.role === 'docente' ? <TeacherMensajesOverview /> :
          user?.role === 'alumno' ? <AlumnoMensajesOverview /> :
          <OverviewDashboard />
        );
      case "conversations":
        return tabs.find(t => t.id === "conversations")?.enabled ? <ConversationsView /> : <ConversationsPlaceholder />;
      case "announcements":
        return tabs.find(t => t.id === "announcements")?.enabled ? <AnnouncementsView /> : <AnnouncementsPlaceholder />;
      case "wall":
        return <WallView />;
      default:
        return <OverviewDashboard />;
    }
  };

  // Función para obtener el icono del rol
  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin": return Users;
      case "docente": return MessageCircle;
      case "alumno": return MessageSquare;
      default: return MessageSquare;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header moderno siguiendo el patrón de otros módulos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Mensajería
                  </h1>
                  <p className="text-sm text-gray-500">Selecciona una pestaña para comenzar. Las secciones marcadas como "En desarrollo" estarán disponibles pronto.</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {(() => {
                        const RoleIcon = getRoleIcon(user?.role);
                        return <RoleIcon className="h-3 w-3 mr-1" />;
                      })()}
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
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {quickStats.availableFeatures} funcionalidades disponibles
                </Badge>
                {quickStats.developmentFeatures > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {quickStats.developmentFeatures} en desarrollo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas moderna */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-x-auto">
          <div className="border-b border-gray-200">
            <div className="flex space-x-0 min-w-max">
              {tabs.filter(tab => hasRoleAccess(tab)).map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isFirst = index === 0;
                const isLast = index === tabs.filter(tab => hasRoleAccess(tab)).length - 1;
                
                return (
                  <div key={tab.id} className="relative">
                    <div className="absolute -top-1 right-2">
                      {tab.development && (
                        <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-600 border-yellow-200">Dev</Badge>
                      )}
                    </div>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      title={tab.description}
                      className={`
                        flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 relative
                        ${isFirst ? 'rounded-tl-2xl' : ''} 
                        ${isLast ? 'rounded-tr-2xl' : ''}
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-b-2 border-purple-500' 
                          : tab.enabled 
                            ? 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50' 
                            : 'text-gray-400'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : ''}`} />
                      <span>{tab.label}</span>
                      {!tab.enabled && (
                        <Badge variant="outline" className="ml-1 text-xs bg-gray-50 text-gray-500 border-gray-200">
                          Próximamente
                        </Badge>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {renderTabContent()}
          </div>
        </div>

        {/* Panel de estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <MessageSquare className="h-5 w-5" />
                Estado del Módulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Funcionalidades activas</span>
                  <Badge className="bg-green-100 text-green-700">{quickStats.availableFeatures}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En desarrollo</span>
                  <Badge className="bg-yellow-100 text-yellow-700">{quickStats.developmentFeatures}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total disponibles</span>
                  <Badge className="bg-purple-100 text-purple-700">{quickStats.totalFeatures}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5" />
                Acceso Rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tabs.filter(tab => tab.enabled && hasRoleAccess(tab)).map(tab => (
                  <Button
                    key={tab.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTabChange(tab.id)}
                    className="w-full justify-start hover:bg-green-50 hover:border-green-300"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <HelpCircle className="h-5 w-5" />
                Centro de Ayuda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                ¿Necesitas ayuda con la mensajería?
              </p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300">
                  <Info className="h-4 w-4 mr-2" />
                  Guía de mensajería
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 