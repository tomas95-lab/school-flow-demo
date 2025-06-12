import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { Calendar, BookOpen, GraduationCap } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminAttendanceOverview from "@/components/AdminAttendanceOverview";

export default function Asistencias() {
  // Mock data para el demo
  const { user } = useContext(AuthContext)
  const { data: courses, loading = false } =  useFirestoreCollection("courses");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen ">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white shadow-sm border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Control de Asistencias
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Gestiona la asistencia por curso de manera eficiente
              </p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>{courses?.length || 0} cursos disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <span>Sistema académico integrado</span>
            </div>
          </div>
        </div>
      </div>

      {user?.role === "admin" ? (
        <AdminAttendanceOverview></AdminAttendanceOverview>
      ): (
        <h1>Construyendo para tu rol {user?.role}</h1>
      )}
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
  );
}