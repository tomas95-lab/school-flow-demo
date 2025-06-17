import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminAttendanceOverview from "@/components/AdminAttendanceOverview";
import { Calendar } from "lucide-react";
import TeacherAttendanceOverview from "@/components/TeacherAttendanceOverview";
import AlumnoAttendanceOverview from "@/components/AlumnoAttendanceOverview";

export default function Asistencias() {
  // Mock data para el demo
  const { user } = useContext(AuthContext)
  const { loading = false } =  useFirestoreCollection("courses");

  if (loading) {
    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <SchoolSpinner text="Cargando panel administrativo..." />
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
                   Marca y revisa la asistencia de tus alumnos
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