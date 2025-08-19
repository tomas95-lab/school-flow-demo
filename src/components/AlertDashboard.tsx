/**
 * Dashboard Unificado de Alertas - Reemplaza todos los overview components
 * Interfaz moderna y responsiva con métricas avanzadas
 */

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { alertService, type AlertMetrics } from '@/services/alertService';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Search, 
  Plus,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChartComponent, LineChartComponent, PieChartComponent } from './charts';
import { CreateAlertModal } from './CreateAlertModal';
import AlertAnalytics from './AlertAnalytics';
import ReutilizableDialog from './DialogReutlizable';
import { toast } from 'sonner';

interface AlertDashboardProps {
  className?: string;
}

type TabType = 'overview' | 'alerts' | 'analytics' | 'workflows';

export function AlertDashboard({ className = '' }: AlertDashboardProps) {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all'
  });

  // Datos de Firestore
  const { data: alerts } = useFirestoreCollection('alerts', {
    constraints: [],
    dependencies: [user?.uid]
  });

  // Cargar métricas
  useEffect(() => {
    loadMetrics();
  }, [selectedTimeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const alertMetrics = await alertService.getAlertMetrics(selectedTimeRange);
      setMetrics(alertMetrics);
    } catch (error) {
      console.error('Error cargando métricas:', error);
      toast.error('Error cargando métricas de alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
    toast.success('Datos actualizados');
  };

  // Filtrar alertas según rol y filtros
  const filteredAlerts = React.useMemo(() => {
    if (!alerts) return [];

    return alerts.filter(alert => {
      // Filtro por rol
      let roleFilter = true;
      if (user?.role === 'docente') {
        roleFilter = alert.createdBy === user.uid || 
                    alert.recipients?.includes('all_teachers') ||
                    alert.targetUserRole === 'docente';
      } else if (user?.role === 'alumno') {
        roleFilter = alert.selectedStudents?.includes(user.studentId) ||
                    alert.recipients?.includes('all_students') ||
                    alert.targetUserId === user.studentId;
      }

      // Filtros de búsqueda
      const searchFilter = !searchTerm || 
        alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtros adicionales
      const typeFilter = filters.type === 'all' || alert.type === filters.type;
      const priorityFilter = filters.priority === 'all' || alert.priority === filters.priority;
      const statusFilter = filters.status === 'all' || alert.status === filters.status;

      return roleFilter && searchFilter && typeFilter && priorityFilter && statusFilter;
    });
  }, [alerts, user, searchTerm, filters]);

  // Datos para charts
  const chartData = React.useMemo(() => {
    if (!metrics) return null;

    return {
      alertsByType: Object.entries(metrics.alertsByType).map(([type, count]) => ({
        tipo: type,
        cantidad: count
      })),
      alertsByPriority: Object.entries(metrics.alertsByPriority).map(([priority, count]) => ({
        prioridad: priority,
        cantidad: count
      })),
      trendData: metrics.trendData
    };
  }, [metrics]);

  const handleAlertAction = async (alertId: string, action: 'resolve' | 'escalate' | 'archive') => {
    try {
      switch (action) {
        case 'resolve':
          await alertService.resolveAlert(alertId, 'Resuelto desde dashboard', user?.uid || 'unknown');
          toast.success('Alerta resuelta exitosamente');
          break;
        case 'escalate':
          await alertService.escalateAlert(alertId, user?.uid || 'unknown', 'Escalado desde dashboard');
          toast.success('Alerta escalada exitosamente');
          break;
        case 'archive':
          // Implementar archivo
          toast.success('Alerta archivada');
          break;
      }
      await loadMetrics(); // Recargar datos
    } catch (error) {
      console.error('Error en acción de alerta:', error);
      toast.error('Error procesando la acción');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Alertas</h2>
          <p className="text-gray-600">
            Vista unificada del sistema de alertas con métricas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={(value: 'week' | 'month' | 'semester' | 'year') => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="semester">Este semestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {(user?.role === 'admin' || user?.role === 'docente') && (
            <CreateAlertModal
              trigger={
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Alerta
                </Button>
              }
              onAlertCreated={loadMetrics}
            />
          )}
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium mb-1">Total Alertas</p>
                <p className="text-3xl font-bold text-blue-900">{metrics?.totalAlerts || 0}</p>
                <p className="text-sm text-blue-600 mt-1">En {selectedTimeRange}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Bell className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium mb-1">Críticas</p>
                <p className="text-3xl font-bold text-red-900">
                  {metrics?.alertsByPriority.critical || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">Requieren atención</p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium mb-1">Resueltas</p>
                <p className="text-3xl font-bold text-green-900">
                  {metrics?.alertsByStatus.resolved || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">Tiempo prom: {metrics?.resolutionTime.average.toFixed(1) || 0}h</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 font-medium mb-1">Escalamiento</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {metrics?.escalationRate.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-yellow-600 mt-1">Tasa de escalamiento</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegación por tabs */}
      <div className="flex flex-wrap gap-3 border-b">
        {(['overview', 'alerts', 'analytics', 'workflows'] as TabType[]).map((tab) => (
          <Button
            key={tab}
            variant={selectedTab === tab ? "default" : "ghost"}
            onClick={() => setSelectedTab(tab)}
            className="mb-2"
          >
            {tab === 'overview' && 'Resumen'}
            {tab === 'alerts' && 'Alertas'}
            {tab === 'analytics' && 'Analytics'}
            {tab === 'workflows' && 'Workflows'}
          </Button>
        ))}
      </div>

      {/* Contenido de las tabs */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts de métricas */}
          {chartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertas por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChartComponent
                    data={chartData.alertsByType}
                    dataKey="cantidad"
                    nameKey="tipo"
                    className="h-64"
                    colors={["#3b82f6", "#ef4444", "#f59e0b", "#10b981"]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertas por Prioridad</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent
                    data={chartData.alertsByPriority}
                    xKey="prioridad"
                    yKey="cantidad"
                    className="h-64"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tendencia Temporal</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChartComponent
                    data={chartData.trendData}
                    xKey="date"
                    yKey="count"
                    className="h-64"
                    color="#3b82f6"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertas recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.firestoreId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={alert.priority === 'critical' ? 'destructive' : 'secondary'}
                        className="shrink-0"
                      >
                        {alert.priority}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{alert.type}</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div className="space-y-6">
          {/* Filtros y búsqueda */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar alertas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="academic">Académica</SelectItem>
                      <SelectItem value="attendance">Asistencia</SelectItem>
                      <SelectItem value="behavior">Comportamiento</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="archived">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de alertas */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.firestoreId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={alert.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="shrink-0"
                        >
                          {alert.priority}
                        </Badge>
                        <Badge variant="outline">{alert.type}</Badge>
                        <span className="text-sm text-gray-500">
                          {alert.createdAt?.toDate?.()?.toLocaleDateString() || 'Fecha no disponible'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                      <p className="text-gray-600 text-sm">{alert.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      {alert.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAlertAction(alert.firestoreId || '', 'resolve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAlertAction(alert.firestoreId || '', 'escalate')}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Escalar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div>
          <AlertAnalytics />
        </div>
      )}

      {selectedTab === 'workflows' && (
        <Card>
          <CardHeader>
            <CardTitle>Workflows Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Sistema de workflows en desarrollo...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles de alerta */}
      <ReutilizableDialog
        open={!!selectedAlert}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
        title="Detalles de Alerta"
        description="Información completa de la alerta seleccionada"
        small={true}
        content={
          selectedAlert && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Título</h4>
                <p className="text-gray-700">{selectedAlert.title}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                <p className="text-gray-600">{selectedAlert.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Prioridad</h4>
                  <Badge variant={selectedAlert.priority === 'critical' ? 'destructive' : 'secondary'}>
                    {selectedAlert.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Estado</h4>
                  <Badge variant="outline">{selectedAlert.status}</Badge>
                </div>
              </div>
            </div>
          )
        }
        footer={
          <Button onClick={() => setSelectedAlert(null)}>
            Cerrar
          </Button>
        }
      />
    </div>
  );
}

export default AlertDashboard;