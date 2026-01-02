import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { 
  BookCheck, 
  Plus, 
  Calendar, 
  Brain, 
  Award, 
  TrendingUp, 
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccessDenied } from "@/components/AccessDenied";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermission } from "@/hooks/usePermission";

import AdminTareasOverview from "@/components/AdminTareasOverview";
import TeacherTareasOverview from "@/components/TeacherTareasOverview";
import AlumnoTareasOverview from "@/components/AlumnoTareasOverview";
import CreateTareaModal from "@/components/CreateTareaModal";
import TareaCalendar from "@/components/TareaCalendar";

import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function Tareas() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const roleScope = user?.role;
  
  const { loading: coursesLoading } = useFirestoreCollection("courses", {
    constraints: roleScope === 'alumno'
      ? [where('alumnos', 'array-contains', user?.studentId || '')]
      : roleScope === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    dependencies: [roleScope, user?.studentId, user?.teacherId]
  });

  const [activeView, setActiveView] = useState("overview");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Resumen",
      icon: BookCheck,
      description: "Vista general de tareas"
    },
    {
      id: "calendar",
      label: "Calendario",
      icon: Calendar,
      description: "Calendario de entregas"
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
        return "Gestiona y supervisa las tareas de todos los cursos, docentes y estudiantes de EduNova.";
      case "docente":
        return "Crea y administra las tareas de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta y completa tus tareas para mantenerte al día con tu rendimiento académico.";
      default:
        return "Panel de gestión de tareas de EduNova.";
    }
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return Users;
      case "docente":
        return Award;
      case "alumno":
        return TrendingUp;
      default:
        return BookCheck;
    }
  };

  const { can } = usePermission();
  const canAccessTareas = Boolean(user);
  const canCreateTareas = can("canEditGrades");

  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission && tab.permissionCheck) {
      return tab.permissionCheck(user?.role);
    }
    return true;
  });

  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de tareas..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  if (!canAccessTareas) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de tareas." />
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
                  <BookCheck className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Tareas y Deberes
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
              {canCreateTareas && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setCreateModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shrink-0 min-w-0"
                    >
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span className="hidden sm:inline">Nueva Tarea</span>
                      <span className="sm:hidden">Nueva</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Crear una nueva tarea para tus estudiantes
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
              {user?.role === "admin" && <AdminTareasOverview />}
              {user?.role === "docente" && <TeacherTareasOverview />}
              {user?.role === "alumno" && <AlumnoTareasOverview />}
            </div>
          )}

          {activeView === "calendar" && (
            <TareaCalendar key={refreshKey} />
          )}

          {activeView === "observaciones" && user?.role && (
            <ObservacionesAutomaticasPanel 
              role={user.role as 'admin' | 'docente' | 'alumno'}
              context="tareas"
            />
          )}
        </div>

        {canCreateTareas && (
          <CreateTareaModal 
            open={createModalOpen} 
            onOpenChange={setCreateModalOpen}
            onSuccess={() => setRefreshKey(prev => prev + 1)}
          />
        )}
      </div>
    </div>
  );
}

