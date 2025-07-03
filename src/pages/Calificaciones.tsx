import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminCalificacionesOverview from "@/components/AdminCalificacionesOverview";
import TeacherCalificacionesOverview from "@/components/TeacherCalificacionesOverView";
import AlumnoCalificacionesOverview from "@/components/AlumnoCalificacionesOverview";

export default function Calificaciones() {
  const { user } = useContext(AuthContext)
  const { data:courses, loading = false } =  useFirestoreCollection("courses");

  if (courses.length==0 && loading) {
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
            ):user?.role === "docente" ?(
              <TeacherCalificacionesOverview></TeacherCalificacionesOverview>
            ):(
              <AlumnoCalificacionesOverview></AlumnoCalificacionesOverview>
            )}      
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
          </div>
        </div>
      </div>
  );
}