import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { 
  Users, 
  Plus, 
  Brain, 
  Award, 
  TrendingUp, 
  MessageCircle,
  Video,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccessDenied } from "@/components/AccessDenied";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import AdminComunicacionOverview from "@/components/AdminComunicacionOverview";
import TeacherComunicacionOverview from "@/components/TeacherComunicacionOverview";
import FamiliarComunicacionOverview from "@/components/FamiliarComunicacionOverview";
import ChatFamilias from "@/components/ChatFamilias";
import ReunionesFamilias from "@/components/ReunionesFamilias";
import NotificacionesFamilias from "@/components/NotificacionesFamilias";

import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function ComunicacionFamilias() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const roleScope = user?.role;
  
  const { loading: coursesLoading } = useFirestoreCollection("courses", {
    constraints: roleScope === 'familiar'
      ? []
      : roleScope === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    dependencies: [roleScope, user?.teacherId]
  });


  const [activeView, setActiveView] = useState("overview");

  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Resumen",
      icon: MessageCircle,
      description: "Vista general de comunicaciones"
    },
    {
      id: "chat",
      label: "Mensajes",
      icon: MessageCircle,
      description: "Chat con familias"
    },
    {
      id: "reuniones",
      label: "Reuniones",
      icon: Video,
      description: "Programar y gestionar reuniones"
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: Bell,
      description: "Enviar notificaciones masivas"
    },
    {
      id: "observaciones",
      label: "Observaciones IA",
      icon: Brain,
      description: "Análisis inteligente automático"
    }
  ];

  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa toda la comunicación entre docentes y familias de EduNova.";
      case "docente":
        return "Comunícate con las familias de tus estudiantes para mantenerlas informadas.";
      case "familiar":
        return "Mantente informado sobre el progreso de tu hijo/a y comunícate con los docentes.";
      default:
        return "Panel de comunicación con familias de EduNova.";
    }
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return Users;
      case "docente":
        return Award;
      case "familiar":
        return TrendingUp;
      default:
        return MessageCircle;
    }
  };

  const canAccessComunicacion = Boolean(user);

  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission && tab.permissionCheck) {
      return tab.permissionCheck(user?.role);
    }
    return true;
  });

  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de comunicación..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  if (!canAccessComunicacion) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de comunicación." />
  }

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
                    Comunicación con Familias
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                      {user?.role === "docente" && "Docente"}
                      {user?.role === "familiar" && "Familiar"}
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
              {user?.role === 'docente' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => navigate("/app/comunicacion-familias/nueva")}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shrink-0 min-w-0"
                    >
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span className="hidden sm:inline">Nuevo Mensaje</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Enviar un nuevo mensaje a una familia
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

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

        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {activeView === "overview" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {user?.role === "admin" && <AdminComunicacionOverview />}
              {user?.role === "docente" && <TeacherComunicacionOverview />}
              {user?.role === "familiar" && <FamiliarComunicacionOverview />}
            </div>
          )}

          {activeView === "chat" && (
            <ChatFamilias />
          )}

          {activeView === "reuniones" && (
            <ReunionesFamilias />
          )}

          {activeView === "notificaciones" && (
            <NotificacionesFamilias />
          )}

          {activeView === "observaciones" && user?.role && (
            <ObservacionesAutomaticasPanel 
              role={user.role as 'admin' | 'docente' | 'alumno'}
              context="comunicacion"
            />
          )}
        </div>
      </div>
    </div>
  );
}

