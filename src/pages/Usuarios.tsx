import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { 
  Users, 
  GraduationCap, 
  UserCheck,
  Shield,
  Plus,
  Lock,
  AlertTriangle,
  Award,
  TrendingUp,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReutilizableCard } from "@/components/ReutilizableCard";
import { StatsCard } from "@/components/StatCards";
import { DataTable } from "@/components/data-table";
import { useColumnsUsuarios } from "../app/usuarios/columns";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { UserModal } from "@/components/UserModal";
import { DeleteUserModal } from "@/components/DeleteUserModal";
import { useGlobalError } from "@/components/GlobalErrorProvider";
import ImportStudentsModal from "@/components/ImportStudentsModal";

// Tipos para las pestañas
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function Usuarios() {
  const { user } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("overview");
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: "admin" | "docente" | "alumno";
    status: "active" | "inactive";
    lastLogin?: string;
    createdAt?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    firestoreId: string;
    nombre: string;
    apellido: string;
    email: string;
    role: string;
    name: string;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { handleError } = useGlobalError();

  // Configuración de pestañas
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Resumen",
      icon: Users,
      description: "Vista general de usuarios"
    },
    {
      id: "create",
      label: "Crear",
      icon: Plus,
      description: "Crear nuevos usuarios",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin"
    },
    {
      id: "import",
      label: "Importar",
      icon: UserPlus,
      description: "Importar usuarios masivamente",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin"
    }
  ];

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa todos los usuarios del sistema educativo, administradores, docentes y estudiantes.";
      case "docente":
        return "Consulta información de usuarios relacionados con tus cursos y estudiantes.";
      case "alumno":
        return "Consulta información básica de usuarios del sistema educativo.";
      default:
        return "Panel de gestión de usuarios del sistema educativo.";
    }
  };

  // Función para obtener el icono del rol
  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return Shield;
      case "docente":
        return Award;
      case "alumno":
        return TrendingUp;
      default:
        return Users;
    }
  };

  // Verificar permisos de acceso
  const canAccessUsuarios = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";
  const canCreateUsuarios = user?.role === "admin";
  const canImportUsuarios = user?.role === "admin";

  // Filtrar pestañas según permisos
  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission && tab.permissionCheck) {
      return tab.permissionCheck(user?.role);
    }
    return true;
  });

  // Función para recargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          role: data.role || "alumno",
          status: data.status || "active",
          lastLogin: data.lastLogin,
          createdAt: data.createdAt
        };
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      handleError(error, "Cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  // Obtener usuarios de Firestore
  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para manejar la edición de usuarios
  const handleEditUser = (user: { id: string; name: string; email: string; role: string }) => {
    setSelectedUser({
      id: user.id,
      firestoreId: user.id,
      nombre: user.name,
      apellido: "",
      email: user.email,
      role: user.role,
      name: user.name
    });
    setShowEditModal(true);
  };

  // Función para manejar la eliminación de usuarios
  const handleDeleteUser = (user: { id: string; name: string; email: string; role: string }) => {
    setSelectedUser({
      id: user.id,
      firestoreId: user.id,
      nombre: user.name,
      apellido: "",
      email: user.email,
      role: user.role,
      name: user.name
    });
    setShowDeleteModal(true);
  };

  // Get columns for the table
  const columns = useColumnsUsuarios(handleEditUser, handleDeleteUser);

  // Mostrar loading si el usuario está cargando
  if (!user) {
    return (
      <LoadingState 
        text="Cargando panel de usuarios..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessUsuarios) {
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
                  No tienes permisos para acceder al módulo de usuarios.
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

  // Stats calculadas con datos reales
  const userStats: Array<{
    label: string;
    value: string;
    subtitle: string;
    icon: unknown;
    color: "blue" | "purple" | "green" | "orange" | "red" | "indigo" | "emerald" | "yellow" | "pink" | "gray";
  }> = [
    {
      label: "Total Usuarios",
      value: users.length.toString(),
      subtitle: "Usuarios registrados",
      icon: Users,
      color: "blue"
    },
    {
      label: "Docentes",
      value: users.filter(u => u.role === "docente").length.toString(), 
      subtitle: "Personal docente",
      icon: GraduationCap,
      color: "purple"
    },
    {
      label: "Estudiantes",
      value: users.filter(u => u.role === "alumno").length.toString(),
      subtitle: "Alumnos activos", 
      icon: UserCheck,
      color: "green"
    },
    {
      label: "Administradores",
      value: users.filter(u => u.role === "admin").length.toString(),
      subtitle: "Personal administrativo",
      icon: Shield,
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Gestión de Usuarios
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                      {user?.role === "docente" && "Docente"}
                      {user?.role === "alumno" && "Estudiante"}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">Sistema Educativo</span>
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
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Usuarios Activos</p>
                      <p className="font-bold text-gray-900">{users.filter(u => u.status === "active").length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {canCreateUsuarios && (
                <Button 
                  onClick={() => setActiveView("create")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navegación por tabs mejorada */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {availableTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeView === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                      : 'hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Contenido según vista activa con animaciones */}
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {activeView === "overview" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {userStats.map((stat, index) => (
                  <StatsCard
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    subtitle={stat.subtitle}
                    icon={stat.icon}
                    color={stat.color}
                  />
                ))}
              </div>

              {/* Main Content */}
              <ReutilizableCard
                title="Lista de Usuarios"
                description="Gestiona y administra todos los usuarios del sistema"
              >
                {/* Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-500">Cargando usuarios...</p>
                        </div>
                      </div>
                    ) : (
                      <DataTable 
                        columns={columns} 
                        data={users}
                        placeholder="usuario"
                        filters={[
                          {
                            type: "select",
                            columnId: "role",
                            label: "Rol",
                            placeholder: "Filtrar por rol",
                            options: [
                              { label: "Todos los roles", value: "all" },
                              { label: "Administradores", value: "admin" },
                              { label: "Docentes", value: "docente" },
                              { label: "Estudiantes", value: "alumno" }
                            ]
                          },
                          {
                            type: "select",
                            columnId: "status",
                            label: "Estado",
                            placeholder: "Filtrar por estado",
                            options: [
                              { label: "Todos los estados", value: "all" },
                              { label: "Activos", value: "active" },
                              { label: "Inactivos", value: "inactive" }
                            ]
                          },
                          {
                            type: "button",
                            label: "Conectados hoy",
                            onClick: table => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              table.getColumn("lastLogin")?.setFilterValue(today.toISOString());
                            }
                          },
                        ]}
                        exportable={false}
                        emptyMessage="No se encontraron usuarios. Comienza creando el primer usuario del sistema."
                      />
                    )}
                  </div>
                </div>
              </ReutilizableCard>
            </div>
          )}

          {activeView === "create" && canCreateUsuarios && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <UserModal 
                mode="create" 
                onUserCreated={fetchUsers}
              />
            </div>
          )}

          {activeView === "import" && canImportUsuarios && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <ImportStudentsModal />
            </div>
          )}
          
          {/* Estado vacío para creación sin permisos */}
          {activeView === "create" && !canCreateUsuarios && (
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
                    Solo los administradores pueden crear usuarios.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Estado vacío para importación sin permisos */}
          {activeView === "import" && !canImportUsuarios && (
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
                    Solo los administradores pueden importar usuarios.
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
              <Users className="h-5 w-5 text-blue-600" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con la gestión de usuarios? Consulta nuestros recursos.
            </p>
            <div className="flex gap-3">
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Guía de usuarios
              </button>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Soporte técnico
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Última Actualización
            </h3>
            <p className="text-gray-600">
              Los datos fueron actualizados por última vez hace pocos minutos. 
              El sistema se sincroniza automáticamente cada 5 minutos.
            </p>
          </div>
        </div>

        {/* Alertas informativas según el rol */}
        {user?.role === "admin" && (
          <Card className="mt-6 border-blue-200 bg-blue-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Consejos para administradores
                  </h4>
                  <p className="text-sm text-blue-800">
                    • Gestiona los usuarios de forma responsable y segura<br/>
                    • Utiliza la importación masiva para agregar múltiples usuarios<br/>
                    • Revisa regularmente los permisos y roles de los usuarios<br/>
                    • Mantén un registro actualizado de todos los usuarios del sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(user?.role === "docente" || user?.role === "alumno") && (
          <Card className="mt-6 border-blue-200 bg-blue-50/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Información para usuarios
                  </h4>
                  <p className="text-sm text-blue-800">
                    • Consulta información básica de usuarios del sistema<br/>
                    • Los datos se actualizan automáticamente cuando los administradores realizan cambios<br/>
                    • Contacta al administrador si necesitas información específica<br/>
                    • Mantén tu información de perfil actualizada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        {showEditModal && selectedUser && (
          <UserModal
            mode="edit"
            user={selectedUser}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onUserUpdated={() => {
              fetchUsers();
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />
        )}

        {showDeleteModal && selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            onUserDeleted={() => {
              fetchUsers();
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
} 
