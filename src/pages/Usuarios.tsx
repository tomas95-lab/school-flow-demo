import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { ReutilizableCard } from "@/components/ReutilizableCard";
import { StatsCard } from "@/components/StatCards";

import { 
  Users, 
  GraduationCap, 
  UserCheck,
  Shield
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { useColumnsUsuarios } from "../app/usuarios/columns";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { UserModal } from "@/components/UserModal";
import { DeleteUserModal } from "@/components/DeleteUserModal";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useGlobalError } from "@/components/GlobalErrorProvider";
import ImportStudentsModal from "@/components/ImportStudentsModal";

export default function Usuarios() {
  const { user } = useContext(AuthContext);
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

  if (user === null) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <SchoolSpinner text="Cargando usuarios..." fullScreen={true} />
            <p className="text-gray-500 mt-4">Preparando información de usuarios</p>
          </div>
        </div>
      );
    }
  
  // Stats calculadas con datos reales
  const userStats = [
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
      color: "red"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 text-lg">
                Administra todos los usuarios del sistema educativo
              </p>
            </div>
            <div className="flex gap-3">
              <ImportStudentsModal />
              <UserModal 
                mode="create" 
                onUserCreated={fetchUsers}
              />
            </div>
          </div>
        </div>

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
