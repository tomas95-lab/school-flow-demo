import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { StatsCard } from "./StatCards";
import { AlertTriangle, Bell, CheckCircle, Search } from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { CreateAlertModal } from "./CreateAlertModal";

export default function TeacherAlertasOverview() {
  const { user } = useContext(AuthContext);
  const { data: alerts } = useFirestoreCollection("alerts");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  if (!alerts) {
    return <div>Cargando...</div>;
  }

  console.log("TeacherAlertasOverview - User role:", user?.role);
  console.log("TeacherAlertasOverview - Teacher ID:", user?.teacherId);

  // Filtrar alertas del docente
  const teacherAlerts = alerts.filter((a: any) => {
    // Alerta creada por este docente
    if (a.createdBy === user?.uid) return true;
    
    // Alerta para todos los docentes
    if (a.recipients && a.recipients.includes('all_teachers')) return true;
    
    // Alerta dirigida específicamente a docentes
    if (a.targetUserRole === "docente") return true;
    
    return false;
  });

  // Filtrar alertas
  const filteredAlerts = teacherAlerts.filter((alert: any) => {
    const matchesSearch = alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesPriority = filterPriority === "all" || alert.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  // Calcular estadísticas de alertas del docente
  const totalAlerts = teacherAlerts.length;
  const unreadAlerts = teacherAlerts.filter((a: any) => !a.isRead).length;
  const criticalAlerts = teacherAlerts.filter((a: any) => a.priority === "critical").length;
  const academicAlerts = teacherAlerts.filter((a: any) => a.type === "academic").length;

  const markAsRead = async (alertId: string) => {
    try {
      if (!alertId) {
        console.error("Alert ID is undefined");
        return;
      }
      await updateDoc(doc(db, "alerts", alertId), {
        isRead: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "academic": return "bg-purple-100 text-purple-800 border-purple-200";
      case "attendance": return "bg-green-100 text-green-800 border-green-200";
      case "behavior": return "bg-red-100 text-red-800 border-red-200";
      case "system": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Mis Alertas"
          value={totalAlerts}
          icon={Bell}
          subtitle="Alertas relacionadas con tus cursos."
        />
        <StatsCard
          label="No leídas"
          value={unreadAlerts}
          icon={AlertTriangle}
          color="red"
          subtitle="Alertas pendientes de revisión."
        />
        <StatsCard
          label="Críticas"
          value={criticalAlerts}
          icon={AlertTriangle}
          color="red"
          subtitle="Alertas de prioridad crítica."
        />
        <StatsCard
          label="Académicas"
          value={academicAlerts}
          icon={CheckCircle}
          color="green"
          subtitle="Alertas relacionadas con el rendimiento."
        />
      </div>

      {/* Filtros y búsqueda */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Mis Alertas ({filteredAlerts.length})
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <CreateAlertModal />
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="academic">Académico</option>
              <option value="attendance">Asistencia</option>
              <option value="behavior">Comportamiento</option>
              <option value="system">Sistema</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Prioridad</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || filterType !== "all" || filterPriority !== "all" 
                  ? "No se encontraron alertas con los filtros aplicados"
                  : "No tienes alertas pendientes"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert: any) => (
            <Card key={alert.firestoreId || alert.id} className={`${!alert.isRead ? 'border-l-4 border-l-red-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <div className="flex gap-2">
                        <Badge className={`text-xs ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </Badge>
                        <Badge className={`text-xs ${getTypeColor(alert.type)}`}>
                          {alert.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{alert.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Creada: {alert.createdAt?.toDate ? 
                        alert.createdAt.toDate().toLocaleDateString() : 
                        new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                      {alert.courseId && <span>Curso: {alert.courseId}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!alert.isRead && (
                      <Button
                        size="sm"
                        onClick={() => markAsRead(alert.firestoreId || alert.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como leída
                      </Button>
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
          ))
        )}
      </div>
    </div>
  );
} 