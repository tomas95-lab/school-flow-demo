import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { BookOpen, Plus, Calendar, Lock, AlertTriangle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Componentes de vista por rol
import AdminCalificacionesOverview from "@/components/AdminCalificacionesOverview";
import TeacherCalificacionesOverview from "@/components/TeacherCalificacionesOverView";
import AlumnoCalificacionesOverview from "@/components/AlumnoCalificacionesOverview";

// Nuevos componentes
import QuickGradeRegister from "@/components/QuickGradeRegister";
import GradesCalendar from "@/components/GradesCalendar";
import ObservacionesAutomaticasPanel from "@/components/ObservacionesAutomaticasPanel";

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

  // Verificar permisos de acceso
  const canAccessGrades = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";
  const canRegisterGrades = user?.role === "docente";
  const canViewCalendar = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";

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

  // Si no tiene permisos de acceso
  if (!canAccessGrades) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600">
                  No tienes permisos para acceder al módulo de calificaciones.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Contacta al administrador del sistema si crees que esto es un error.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  Panel de Calificaciones
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {user?.role === "admin" && "Administrador"}
                  {user?.role === "docente" && "Docente"}
                  {user?.role === "alumno" && "Estudiante"}
                </Badge>
              </div>
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
              {canRegisterGrades && (
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
            {canRegisterGrades && (
              <Button
                variant={activeView === "register" ? "default" : "outline"}
                onClick={() => setActiveView("register")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Registrar
              </Button>
            )}
            {canViewCalendar && (
              <Button
                variant={activeView === "calendar" ? "default" : "outline"}
                onClick={() => setActiveView("calendar")}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Calendario
              </Button>
            )}
            <Button
                variant={activeView === "observaciones" ? "default" : "outline"}
                onClick={() => setActiveView("observaciones")}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                Observaciones Inteligentes
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

          {activeView === "register" && canRegisterGrades && (
            <QuickGradeRegister />
          )}

          {activeView === "calendar" && canViewCalendar && (
            <GradesCalendar />
          )}

          {activeView === "observaciones" && (
            <ObservacionesAutomaticasPanel role={user?.role as any} context="calificaciones" className="mb-8" />
          )}
          
          {/* Estado vacío cuando no hay vista activa */}
          {!activeView && (
            <div className="text-center py-12">
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay vista seleccionada
                </h3>
                <p className="text-gray-600">
                  Selecciona una opción del menú para comenzar.
                </p>
              </div>
            </div>
          )}
          
          {/* Estado vacío para registro sin permisos */}
          {activeView === "register" && !canRegisterGrades && (
            <div className="text-center py-12">
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600">
                  Solo los docentes pueden registrar calificaciones.
                </p>
              </div>
            </div>
          )}
          
          {/* Estado vacío para calendario sin permisos */}
          {activeView === "calendar" && !canViewCalendar && (
            <div className="text-center py-12">
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600">
                  No tienes permisos para ver el calendario de calificaciones.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con información adicional */}
        <div className="mt-12 pt-8 border-t border-gray-200">
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

        {/* Alertas informativas según el rol */}
        {user?.role === "docente" && (
          <div className="mt-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Consejos para docentes
                    </h4>
                    <p className="text-sm text-blue-800">
                      • Registra las calificaciones dentro de las 48 horas posteriores a la evaluación<br/>
                      • Utiliza el registro rápido para evaluaciones masivas<br/>
                      • Revisa el calendario para planificar futuras evaluaciones<br/>
                      • Mantén comunicación constante con los estudiantes sobre su progreso
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {user?.role === "alumno" && (
          <div className="mt-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">
                      Información para estudiantes
                    </h4>
                    <p className="text-sm text-green-800">
                      • Revisa regularmente tus calificaciones para mantener un seguimiento de tu progreso<br/>
                      • Las calificaciones se actualizan automáticamente cuando los docentes las registran<br/>
                      • Utiliza los filtros para analizar tu rendimiento por materia o período<br/>
                      • Contacta a tus docentes si tienes dudas sobre alguna evaluación
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
