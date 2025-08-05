import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar, MessageSquare, Megaphone, Layout, AlertTriangle, Info, Settings, HelpCircle } from "lucide-react";
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
        return "Gestiona y supervisa los muros de todos los cursos, docentes y estudiantes del sistema educativo.";
      case "docente":
        return "Registra y administra los muros de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta los muros de tus cursos y mantente al día con las comunicaciones.";
      default:
        return "Panel de gestión de muros y mensajería del sistema educativo.";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Panel de Mensajería
              </h1>
              <p className="text-gray-600 text-lg">
                {getRoleMessage(user?.role)}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {quickStats.availableFeatures} funcionalidades disponibles
                </Badge>
                {quickStats.developmentFeatures > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    {quickStats.developmentFeatures} en desarrollo
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>

        {/* Navegación mejorada */}
        <Card className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isAccessible = hasRoleAccess(tab);
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={!isAccessible || !tab.enabled}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${
                      isActive
                        ? "border-indigo-500 text-indigo-600"
                        : isAccessible && tab.enabled
                        ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        : "border-transparent text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.development && (
                      <Badge variant="outline" className="ml-1 text-xs bg-yellow-50 text-yellow-700">
                        Dev
                      </Badge>
                    )}
                    {!isAccessible && (
                      <Badge variant="outline" className="ml-1 text-xs bg-red-50 text-red-700">
                        Sin acceso
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </Card>

        {/* Panel de ayuda mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Centro de Ayuda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                ¿Necesitas ayuda con la administración del sistema?
              </p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Info className="h-4 w-4 mr-2" />
                  Guía de usuario
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Soporte técnico
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Funcionalidades activas</span>
                  <span className="text-sm font-medium text-green-600">{quickStats.availableFeatures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">En desarrollo</span>
                  <span className="text-sm font-medium text-yellow-600">{quickStats.developmentFeatures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Última actualización</span>
                  <span className="text-sm font-medium">Hace 5 min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
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
                    className="w-full justify-start"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 