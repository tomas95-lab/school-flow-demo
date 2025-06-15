import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminAttendanceOverview from "@/components/AdminAttendanceOverview";

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