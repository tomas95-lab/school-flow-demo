import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { AlertCircle, CheckCircle, Clock, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolSpinner } from "@/components/SchoolSpinner";

interface Alert {
  id: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  targetUserId: string;
  targetUserRole: string;
  courseId?: string;
  createdBy: string;
  createdByRole: string;
  createdAt: any;
  isRead: boolean;
  isActive: boolean;
  metadata?: any;
}

export default function Alertas() {
  const { user } = useContext(AuthContext);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "alerts"));
      let allAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Alert[];
      
      // Filtrar alertas según el rol
      if (user?.role === "docente" && user?.teacherId) {
        allAlerts = allAlerts.filter(a => a.createdBy === user.teacherId || a.targetUserRole === "docente");
      } else if (user?.role === "alumno" && user?.studentId) {
        allAlerts = allAlerts.filter(a => a.targetUserId === user.studentId);
      }
      // Admin ve todas las alertas
      
      setAlerts(allAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
        isRead: true,
        updatedAt: new Date()
      });
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesPriority = filterPriority === "all" || alert.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando alertas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600 mt-1">
            {filteredAlerts.length} de {alerts.length} alertas
          </p>
        </div>
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
        </div>
      </div>
      <div className="flex gap-4">
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
            <option value="general">General</option>
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

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || filterType !== "all" || filterPriority !== "all" 
                  ? "No se encontraron alertas con los filtros aplicados"
                  : "No tienes alertas pendientes"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className={`${!alert.isRead ? 'border-l-4 border-l-red-500' : ''}`}>
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
                        <Badge className={`text-xs ${getStatusColor(alert.status)}`}>
                          {alert.status}
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
                        onClick={() => markAsRead(alert.id)}
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