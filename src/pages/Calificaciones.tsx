import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminCalificacionesOverview from "@/components/AdminCalificacionesOverview";

export default function Calificaciones() {
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Panel de Calificaciones
                </h1>
                <p className="text-gray-600 text-lg">
                   Marca y revisa las calificaciones de tus alumnos
                </p>
              </div>
            </div>
          </div>
        {user?.role === "admin" ? (
          <AdminCalificacionesOverview></AdminCalificacionesOverview>
        ):(
        null
        )}      
      </div>
    </div>
  </div>
  );
}