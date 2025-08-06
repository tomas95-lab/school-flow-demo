import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar, MessageSquare, Megaphone, Layout, AlertTriangle, Info, Settings, HelpCircle, MessageCircle, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import OverviewDashboard from "./messaging/OverviewDashboard";
import ConversationsView from "./messaging/ConversationsView";
import AnnouncementsView from "./messaging/AnnouncementsView";
import WallView from "./messaging/WallView";
import AdminMensajesOverview from "./AdminMensajesOverview";
import TeacherMensajesOverview from "./TeacherMensajesOverview";
import AlumnoMensajesOverview from "./AlumnoMensajesOverview";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type TabType = "overview" | "conversations" | "announcements" | "wall";

interface TabConfig {
  id: TabType;
  label: string;
  icon: unknown;
  description: string;
  enabled: boolean;
  development?: boolean;
  roleAccess?: string[];
}

export default function MessagingModule() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
      enabled: false,
      development: true,
      roleAccess: ["admin", "docente", "alumno"]
    },
    {
      id: "announcements",
      label: "Anuncios",
      icon: Megaphone,
      description: "Comunicaciones generales",
      enabled: false,
      development: true,
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
      if (targetTab && targetTab.enabled && hasRoleAccess(targetTab)) {
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
      toast.info("Esta funcionalidad está en desarrollo");
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

  // Renderizar contenido de la pestaña activa
  const renderTabContent = () => {
    if (isLoading) {
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
        return <ConversationsView />;
      case "announcements":
        return <AnnouncementsView />;
      case "wall":
        return <WallView />;
      default:
        return <OverviewDashboard />;
    }
  };

  // Verificar si el usuario tiene acceso al módulo
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Debes iniciar sesión para acceder al módulo de mensajería.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="p-8">
        {/* Header moderno siguiendo el patrón de otros módulos */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl shadow-2xl mb-8">
          <div className="p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">Mensajería</h1>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const RoleIcon = getRoleIcon(user?.role);
                        return <RoleIcon className="h-6 w-6 text-purple-200" />;
                      })()}
                      <Badge className="bg-white/20 text-white border-white/30">
                        {user?.role === "admin" && "Administrador"}
                        {user?.role === "docente" && "Docente"}
                        {user?.role === "alumno" && "Estudiante"}
                      </Badge>
                      <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">EduNova</span>
                    </div>
                  </div>
                  <p className="text-purple-100 text-lg max-w-2xl">
                    {getRoleMessage(user?.role)}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge variant="outline" className="bg-green-500/20 text-green-100 border-green-300/30">
                      {quickStats.availableFeatures} funcionalidades disponibles
                    </Badge>
                    {quickStats.developmentFeatures > 0 && (
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30">
                        {quickStats.developmentFeatures} en desarrollo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas moderna */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-0">
              {tabs.filter(tab => hasRoleAccess(tab)).map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isFirst = index === 0;
                const isLast = index === tabs.filter(tab => hasRoleAccess(tab)).length - 1;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={!tab.enabled}
                    className={`
                      flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 relative
                      ${isFirst ? 'rounded-tl-2xl' : ''} 
                      ${isLast ? 'rounded-tr-2xl' : ''}
                      ${isActive 
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-b-2 border-purple-500' 
                        : tab.enabled 
                          ? 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50' 
                          : 'text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : ''}`} />
                    <span>{tab.label}</span>
                    {tab.development && (
                      <Badge variant="outline" className="ml-1 text-xs bg-yellow-50 text-yellow-600 border-yellow-200">
                        En desarrollo
                      </Badge>
                    )}
                    {!tab.enabled && (
                      <Badge variant="outline" className="ml-1 text-xs bg-gray-50 text-gray-500 border-gray-200">
                        Próximamente
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
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