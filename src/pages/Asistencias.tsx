import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar, Users, BookOpen, Plus, Clock, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

// Componentes de vista por rol
import AdminAttendanceOverview from "@/components/AdminAttendanceOverview";
import TeacherAttendanceOverview from "@/components/TeacherAttendanceOverview";
import AlumnoAttendanceOverview from "@/components/AlumnoAttendanceOverview";

// Nuevo componente de registro rápido
import QuickAttendanceRegister from "@/components/QuickAttendanceRegister";

// Componente de alerta de asistencias pendientes
import AttendanceAlert from "@/components/AttendanceAlert";

// Componente de calendario
import AttendanceCalendar from "@/components/AttendanceCalendar";

export default function Asistencias() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { loading: coursesLoading } = useFirestoreCollection("courses");
  const [activeView, setActiveView] = useState("overview");

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
          <SchoolSpinner text="Cargando panel de asistencias..." fullScreen={true} />
          <p className="text-gray-500 mt-4">Preparando información del sistema</p>
        </div>
      </div>
    );
  }

  // Calcular semana actual para el calendario
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
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
              {user?.role === "docente" && (
                <Button 
                  onClick={() => setActiveView("register")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Asistencia
                </Button>
              )}
            </div>
          </div>

          {/* Alerta de asistencias pendientes */}
          <div className="mb-6">
            <AttendanceAlert />
          </div>

          {/* Calendario semanal mejorado */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Semana del {format(weekStart, 'dd MMM', { locale: es })} al {format(weekEnd, 'dd MMM yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      isToday(day)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(day, 'dd')}
                    </div>
                    {isToday(day) && (
                      <div className="text-xs text-indigo-600 font-medium mt-1">
                        Hoy
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navegación simplificada */}
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
                <AdminAttendanceOverview />
              ) : user?.role === "docente" ? (
                <TeacherAttendanceOverview />
              ) : (
                <AlumnoAttendanceOverview />
              )}
            </>
          )}

          {activeView === "register" && user?.role === "docente" && (
            <QuickAttendanceRegister />
          )}

          {activeView === "calendar" && (
            <AttendanceCalendar />
          )}
        </div>

        {/* Footer con información adicional */}
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
  );
}
