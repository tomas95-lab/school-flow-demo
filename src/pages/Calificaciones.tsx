import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { BookOpen, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componentes de vista por rol
import AdminCalificacionesOverview from "@/components/AdminCalificacionesOverview";
import TeacherCalificacionesOverview from "@/components/TeacherCalificacionesOverView";
import AlumnoCalificacionesOverview from "@/components/AlumnoCalificacionesOverview";

// Nuevos componentes
import QuickGradeRegister from "@/components/QuickGradeRegister";
import GradesCalendar from "@/components/GradesCalendar";


export default function Calificaciones() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { loading: coursesLoading } = useFirestoreCollection("courses");
  const [activeView, setActiveView] = useState("overview");

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa las calificaciones de todos los cursos, docentes y estudiantes del sistema educativo.";
      case "docente":
        return "Registra y administra las calificaciones de tus materias y cursos asignados.";
      case "alumno":
        return "Consulta tu historial de calificaciones y mantente al día con tu rendimiento académico.";
      default:
        return "Panel de gestión de calificaciones del sistema educativo.";
    }
  };

  
  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading) {
    return (
      <LoadingState 
        text="Cargando panel de calificaciones..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Panel de Calificaciones
              </h1>
              <p className="text-gray-600 text-lg">
                {getRoleMessage(user?.role)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white px-6 py-3 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm text-gray-600">Período Actual</p>
                    <p className="font-semibold text-gray-900">2025 - Semestre I</p>
                  </div>
                </div>
              </div>
              {user?.role === "docente" && (
                <Button 
                  onClick={() => setActiveView("register")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Calificaciones
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navegación por tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeView === "overview" ? "default" : "outline"}
              onClick={() => setActiveView("overview")}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Resumen
            </Button>
            {user?.role === "docente" && (
              <Button
                variant={activeView === "register" ? "default" : "outline"}
                onClick={() => setActiveView("register")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Registrar
              </Button>
            )}
            <Button
              variant={activeView === "calendar" ? "default" : "outline"}
              onClick={() => setActiveView("calendar")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendario
            </Button>
          </div>
        </div>

        {/* Contenido según vista activa */}
        <div className="space-y-6">
          {activeView === "overview" && (
            <>
              {/* Vista según rol */}
              {user?.role === "admin" ? (
                <AdminCalificacionesOverview />
              ) : user?.role === "docente" ? (
                <TeacherCalificacionesOverview />
              ) : (
                <AlumnoCalificacionesOverview />
              )}
            </>
          )}

          {activeView === "register" && user?.role === "docente" && (
            <QuickGradeRegister />
          )}

          {activeView === "calendar" && (
            <GradesCalendar />
          )}
        </div>

        {/* Footer con información adicional */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Centro de Ayuda</h3>
              <p className="text-gray-600 mb-4">
                ¿Necesitas ayuda con la gestión de calificaciones? Consulta nuestros recursos.
              </p>
              <div className="flex gap-3">
                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  Guía de calificaciones
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
  );
}
