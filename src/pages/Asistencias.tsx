import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminAttendanceOverview from "@/components/AdminAttendanceOverview";
import { Calendar } from "lucide-react";
import TeacherAttendanceOverview from "@/components/TeacherAttendanceOverview";
import AlumnoAttendanceOverview from "@/components/AlumnoAttendanceOverview";

export default function Asistencias() {
  // Mock data para el demo
  const { user, loading: userLoading } = useContext(AuthContext)
  const { loading: coursesLoading } =  useFirestoreCollection("courses");

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa las asistencias de todos los cursos, docentes y estudiantes del sistema educativo.";
      case "docente":
        return "Registra y administra las asistencias de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta tu historial de asistencias y mantente al día con tu rendimiento académico.";
      default:
        return "Panel de gestión de asistencias del sistema educativo.";
    }
  };

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <SchoolSpinner text="Cargando panel administrativo..." fullScreen={true} />
        <p className="text-gray-500 mt-4">Preparando información del sistema</p>
      </div>
    </div>
    );
  }

  return (
      <div className="min-h-screen">
          <div className="min-h-screen bg-gray-50">
            <div className="p-8">
              {/* Header del Dashboard */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Panel de Asistencias
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {getRoleMessage(user?.role)}
                    </p>
                  </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-white px-6 py-3 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-600">Período Actual</p>
                            <p className="font-semibold text-gray-900">2025 - Semestre I</p>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

            {user?.role === "admin" ? (
                <AdminAttendanceOverview></AdminAttendanceOverview>
            ): user?.role === "docente" ? (
                <TeacherAttendanceOverview></TeacherAttendanceOverview>
            ): <AlumnoAttendanceOverview></AlumnoAttendanceOverview>}
            
            <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Centro de Ayuda</h3>
                  <p className="text-gray-600 mb-4">
                    ¿Necesitas ayuda con la administración del sistema? Consulta nuestros recursos.
                  </p>
                  <div className="flex gap-3">
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      Guía de usuario
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      Soporte técnico
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Última Actualización</h3>
                  <p className="text-gray-600">
                    Los datos fueron actualizados por última vez hace pocos minutos. 
                    El sistema se sincroniza automáticamente cada 5 minutos.
                  </p>
                </div>
              </div>
            </div>
            {/* Custom Styles */}
            <style>{`
              @keyframes slideInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            `}</style>
          </div>
        </div>
      </div>
  );
}
