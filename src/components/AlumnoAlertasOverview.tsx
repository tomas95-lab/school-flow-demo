import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
} from "lucide-react";
import { Badge } from "./ui/badge";
import { StatsCard } from "./StatCards";
import { SchoolSpinner } from "./SchoolSpinner";

export default function AlumnoAlertasOverview() {
  const { user } = useContext(AuthContext);
  const studentId = user?.studentId;

  const { data: alerts, loading: alertsLoading } = useFirestoreCollection("alerts");
  const { data: students } = useFirestoreCollection("students");
  const { data: courses } = useFirestoreCollection("courses");

  const studentInfo = students.find((student) => student.firestoreId === studentId);
  const course = courses.find((c) => c.firestoreId === studentInfo?.cursoId);

  // Filtrar alertas del alumno actual
  const studentAlerts = alerts.filter((a) => {
    // Alerta dirigida específicamente a este estudiante
    if (a.selectedStudents && a.selectedStudents.includes(studentId)) return true;
    // Alerta para un curso específico y este estudiante está en ese curso
    if (a.selectedCourse && a.selectedCourse !== 'all' && studentInfo?.cursoId === a.selectedCourse) return true;
    // Alerta para todos los estudiantes (general)
    if (a.recipients && a.recipients.includes('all_students') && (!a.selectedCourse || a.selectedCourse === 'all')) return true;
    return false;
  });



  if (alertsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolSpinner text="Cargando tus alertas..." fullScreen={true} />
          <p className="text-gray-500 mt-4">Preparando información de notificaciones</p>
        </div>
      </div>
    );
  }

  if (studentAlerts.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Mis Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes alertas pendientes
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                ¡Excelente! No tienes alertas o notificaciones pendientes en este momento. 
                Mantente al día con tu rendimiento académico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular estadísticas
  const totalAlerts = studentAlerts.length;
  const unreadAlerts = studentAlerts.filter((a) => !a.isRead).length;
  const criticalAlerts = studentAlerts.filter((a) => a.priority === "critical").length;
  const academicAlerts = studentAlerts.filter((a) => a.type === "academic").length;

  return (
    <div className="space-y-6">
      {/* Header con información del curso */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Mis Alertas
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  {course?.nombre} - División {course?.division}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {totalAlerts} alertas
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total de Alertas"
          value={totalAlerts}
          icon={Bell}
          color="blue"
          subtitle="Todas tus notificaciones"
        />
        <StatsCard
          label="No leídas"
          value={unreadAlerts}
          icon={AlertTriangle}
          color="red"
          subtitle="Alertas pendientes de revisión"
        />
        <StatsCard
          label="Críticas"
          value={criticalAlerts}
          icon={AlertTriangle}
          color="red"
          subtitle="Alertas de prioridad crítica"
        />
        <StatsCard
          label="Académicas"
          value={academicAlerts}
          icon={CheckCircle}
          color="green"
          subtitle="Alertas relacionadas con tu rendimiento"
        />
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Tus Notificaciones</h3>
                  {studentAlerts.map((alert) => (
          <Card key={alert.firestoreId || alert.id} className={`${!alert.isRead ? 'border-l-4 border-l-red-500' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{alert.title}</h4>
                    <div className="flex gap-2">
                      <Badge className={`text-xs ${
                        alert.priority === "critical" ? "bg-red-100 text-red-800 border-red-200" :
                        alert.priority === "high" ? "bg-orange-100 text-orange-800 border-orange-200" :
                        alert.priority === "medium" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {alert.priority === "critical" ? "Crítica" :
                         alert.priority === "high" ? "Alta" :
                         alert.priority === "medium" ? "Media" :
                         alert.priority === "low" ? "Baja" : alert.priority}
                      </Badge>
                      <Badge className={`text-xs ${
                        alert.type === "academic" ? "bg-purple-100 text-purple-800 border-purple-200" :
                        alert.type === "attendance" ? "bg-green-100 text-green-800 border-green-200" :
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }`}>
                        {alert.type === "academic" ? "Académica" :
                         alert.type === "attendance" ? "Asistencia" :
                         alert.type === "behavior" ? "Comportamiento" :
                         alert.type === "general" ? "General" : alert.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{alert.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Creada: {alert.createdAt?.toDate ? 
                      alert.createdAt.toDate().toLocaleDateString() : 
                      new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!alert.isRead && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Nueva</span>
                    </div>
                  )}
                  {alert.isRead && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Leída</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
