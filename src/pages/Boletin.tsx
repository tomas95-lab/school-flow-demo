import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import AdminBoletinesOverview from "@/components/AminBoletinesOverview";
import AlumnoBoletinesOverview from "@/components/AlumnoBoletinesOverview";

export default function Boletines() {
  const { user, loading: userLoading } = useContext(AuthContext)
  const { data:courses, loading: coursesLoading, error: coursesError } =  useFirestoreCollection("courses");

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel administrativo..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Mostrar error si hay un problema al cargar los cursos
  if (coursesError) {
    return (
      <ErrorState 
        title="Error al cargar cursos"
        message="No se pudieron cargar los cursos. Esto puede afectar la funcionalidad del sistema."
        onRetry={() => window.location.reload()}
      />
    );
  }

  console.log("Boletin page - User role:", user?.role);
  console.log("Boletin page - User:", user);  
  return (
      <div className="min-h-screen">
          <div className="min-h-screen bg-gray-50">
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {user?.role === "alumno" ? "Mi Boletin" : "Panel de Boletines"}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {user?.role === "alumno" 
                        ? "Consulta tu rendimiento académico y descarga tu boletín" 
                        : "Genera y revisa los boletines de tus alumnos"
                      }
                    </p>
                  </div>
                </div>
              </div>
            {(user?.role === "admin" || user?.role === "docente") && (
              <>
                <AdminBoletinesOverview  />
              </>
            )}
            {user?.role === "alumno" && (
                <AlumnoBoletinesOverview />
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