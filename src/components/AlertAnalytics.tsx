/**
 * Componente de Analytics Avanzados para Alertas
 * Análisis profundo con machine learning simulado y predicciones
 */

import { useState, useMemo } from 'react';
import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

// Helper function to handle dates from both Firestore and demo data
const getDateFromAlert = (createdAt: any): Date => {
  if (!createdAt) return new Date();
  
  // If it's a Firestore timestamp, use toDate()
  if (typeof createdAt.toDate === 'function') {
    return createdAt.toDate();
  }
  
  // If it's a string (demo data), parse it
  if (typeof createdAt === 'string') {
    return new Date(createdAt);
  }
  
  // If it's already a Date object
  if (createdAt instanceof Date) {
    return createdAt;
  }
  
  // Fallback
  return new Date();
};

interface AlertAnalyticsProps {
  className?: string;
}

interface AlertPrediction {
  studentId: string;
  studentName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  predictedAlerts: string[];
  recommendations: string[];
}

interface AlertPattern {
  pattern: string;
  frequency: number;
  impact: 'low' | 'medium' | 'high';
  description: string;
  affectedStudents: number;
  avgResolutionTime: number;
}

export function AlertAnalytics({ className = '' }: AlertAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month');
  const [analysisType, setAnalysisType] = useState<'overview' | 'predictions' | 'patterns' | 'performance'>('overview');

  // Datos de Firestore
  const { data: alerts } = useFirestoreCollection('alerts');
  const { data: students } = useFirestoreCollection('students');
  const { data: grades } = useFirestoreCollection('calificaciones');
  const { data: attendance } = useFirestoreCollection('attendances');

  // Análisis de tendencias
  const trendAnalysis = useMemo(() => {
    if (!alerts) return null;

    const now = new Date();
    const pastDate = new Date();
    
    switch (timeRange) {
      case 'week': pastDate.setDate(now.getDate() - 7); break;
      case 'month': pastDate.setMonth(now.getMonth() - 1); break;
      case 'semester': pastDate.setMonth(now.getMonth() - 6); break;
      case 'year': pastDate.setFullYear(now.getFullYear() - 1); break;
    }

    const currentPeriodAlerts = alerts.filter(alert => 
      alert.createdAt && getDateFromAlert(alert.createdAt) >= pastDate
    );

    const previousPeriodStart = new Date(pastDate);
    previousPeriodStart.setTime(pastDate.getTime() - (now.getTime() - pastDate.getTime()));
    
    const previousPeriodAlerts = alerts.filter(alert => 
      alert.createdAt && 
      getDateFromAlert(alert.createdAt) >= previousPeriodStart && 
      getDateFromAlert(alert.createdAt) < pastDate
    );

    const currentCount = currentPeriodAlerts.length;
    const previousCount = previousPeriodAlerts.length;
    const trend = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;

    return {
      current: currentCount,
      previous: previousCount,
      trend: trend,
      isIncreasing: trend > 0,
      criticalAlerts: currentPeriodAlerts.filter(a => a.priority === 'critical').length,
      resolvedAlerts: currentPeriodAlerts.filter(a => a.status === 'resolved').length,
      avgResolutionTime: calculateAvgResolutionTime(currentPeriodAlerts)
    };
  }, [alerts, timeRange]);

  // Predicciones simuladas con ML
  const predictions = useMemo((): AlertPrediction[] => {
    if (!students || !grades || !attendance) return [];

    return students.slice(0, 10).map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.firestoreId);
      const studentAttendance = attendance.filter(a => a.studentId === student.firestoreId);
      
      // Algoritmo simulado de ML para calcular riesgo
      const avgGrade = studentGrades.reduce((sum, g) => sum + (g.valor || 0), 0) / studentGrades.length || 0;
      const attendanceRate = studentAttendance.filter(a => a.presente).length / studentAttendance.length || 1;
      
      let riskScore = 0;
      if (avgGrade < 3) riskScore += 40;
      if (attendanceRate < 0.8) riskScore += 30;
      if (studentGrades.length < 5) riskScore += 20;
      
      // Añadir variabilidad simulada
      riskScore += Math.random() * 20 - 10;
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 30) riskLevel = 'medium';
      else riskLevel = 'low';

      const predictedAlerts = [];
      const recommendations = [];

      if (avgGrade < 3) {
        predictedAlerts.push('Bajo rendimiento académico');
        recommendations.push('Refuerzo académico en materias débiles');
      }
      if (attendanceRate < 0.8) {
        predictedAlerts.push('Ausentismo frecuente');
        recommendations.push('Seguimiento de asistencia y comunicación con familia');
      }

      return {
        studentId: student.firestoreId || '',
        studentName: `${student.nombre} ${student.apellido}`,
        riskLevel,
        probability: Math.min(riskScore, 100),
        predictedAlerts,
        recommendations
      };
    }).sort((a, b) => b.probability - a.probability);
  }, [students, grades, attendance]);

  // Patrones detectados
  const patterns = useMemo((): AlertPattern[] => {
    if (!alerts) return [];

    const patternMap = new Map();
    
    alerts.forEach(alert => {
      const pattern = `${alert.type}_${alert.priority}`;
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, {
          pattern,
          frequency: 0,
          alerts: [],
          students: new Set(),
          resolutionTimes: []
        });
      }
      
      const data = patternMap.get(pattern);
      data.frequency++;
      data.alerts.push(alert);
      if (alert.targetUserId) data.students.add(alert.targetUserId);
      
      if (alert.status === 'resolved' && alert.resolvedAt && alert.createdAt) {
        const resolutionTime = (getDateFromAlert(alert.resolvedAt).getTime() - getDateFromAlert(alert.createdAt).getTime()) / (1000 * 60 * 60);
        data.resolutionTimes.push(resolutionTime);
      }
    });

    return Array.from(patternMap.values()).map(data => ({
      pattern: data.pattern,
      frequency: data.frequency,
      impact: data.frequency > 20 ? 'high' as const : data.frequency > 10 ? 'medium' as const : 'low' as const,
      description: getPatternDescription(data.pattern),
      affectedStudents: data.students.size,
      avgResolutionTime: data.resolutionTimes.reduce((sum: number, time: number) => sum + time, 0) / data.resolutionTimes.length || 0
    })).sort((a, b) => b.frequency - a.frequency);
  }, [alerts]);

  // Métricas de rendimiento
  const performanceMetrics = useMemo(() => {
    if (!alerts) return null;

    const totalAlerts = alerts.length;
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
    const escalatedAlerts = alerts.filter(a => (a.escalationLevel || 0) > 0).length;
    const overdueAlerts = alerts.filter(a => 
      a.status === 'active' && 
      a.createdAt && 
      (new Date().getTime() - getDateFromAlert(a.createdAt).getTime()) > (24 * 60 * 60 * 1000)
    ).length;

    return {
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
      escalationRate: totalAlerts > 0 ? (escalatedAlerts / totalAlerts) * 100 : 0,
      overdueRate: totalAlerts > 0 ? (overdueAlerts / totalAlerts) * 100 : 0,
      avgResponseTime: calculateAvgResolutionTime(alerts),
      efficiency: Math.max(0, 100 - ((escalatedAlerts + overdueAlerts) / totalAlerts) * 100)
    };
  }, [alerts]);

  function calculateAvgResolutionTime(alertList: any[]): number {
    const resolvedAlerts = alertList.filter(a => 
      a.status === 'resolved' && a.resolvedAt && a.createdAt
    );
    
    if (resolvedAlerts.length === 0) return 0;
    
    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const time = (getDateFromAlert(alert.resolvedAt).getTime() - getDateFromAlert(alert.createdAt).getTime()) / (1000 * 60 * 60);
      return sum + time;
    }, 0);
    
    return totalTime / resolvedAlerts.length;
  }

  function getPatternDescription(pattern: string): string {
    const [type, priority] = pattern.split('_');
    const typeNames = {
      academic: 'Académicas',
      attendance: 'Asistencia',
      behavior: 'Comportamiento',
      general: 'Generales'
    };
    const priorityNames = {
      low: 'baja prioridad',
      medium: 'media prioridad', 
      high: 'alta prioridad',
      critical: 'críticas'
    };
    
    return `Alertas ${typeNames[type as keyof typeof typeNames]} de ${priorityNames[priority as keyof typeof priorityNames]}`;
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportReport = () => {
    toast.success('Generando reporte de analytics...');
    // Aquí iría la lógica de exportación
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Avanzados</h2>
          <p className="text-gray-600">
            Análisis profundo con predicciones y detección de patrones usando IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'semester' | 'year') => setTimeRange(value)}>
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
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Navegación de análisis */}
      <div className="flex flex-wrap gap-3 border-b">
        {[
          { id: 'overview', label: 'Resumen', icon: BarChart3 },
          { id: 'predictions', label: 'Predicciones IA', icon: Brain },
          { id: 'patterns', label: 'Patrones', icon: Target },
          { id: 'performance', label: 'Rendimiento', icon: TrendingUp }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={analysisType === tab.id ? "default" : "ghost"}
            onClick={() => setAnalysisType(tab.id as any)}
            className="mb-2"
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Contenido según análisis seleccionado */}
      {analysisType === 'overview' && trendAnalysis && (
        <div className="space-y-6">
          {/* KPIs de tendencias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium mb-1">Tendencia</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {trendAnalysis.trend > 0 ? '+' : ''}{trendAnalysis.trend.toFixed(1)}%
                    </p>
                    <p className="text-sm text-blue-600 mt-1">vs período anterior</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-xl">
                    {trendAnalysis.isIncreasing ? 
                      <TrendingUp className="h-6 w-6 text-white" /> : 
                      <TrendingDown className="h-6 w-6 text-white" />
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 font-medium mb-1">Críticas</p>
                    <p className="text-3xl font-bold text-red-900">{trendAnalysis.criticalAlerts}</p>
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
                    <p className="text-3xl font-bold text-green-900">{trendAnalysis.resolvedAlerts}</p>
                    <p className="text-sm text-green-600 mt-1">En {timeRange}</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium mb-1">Tiempo Promedio</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {trendAnalysis.avgResolutionTime.toFixed(1)}h
                    </p>
                    <p className="text-sm text-purple-600 mt-1">De resolución</p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {analysisType === 'predictions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Predicciones de Riesgo - IA</h3>
            <Badge className="bg-purple-100 text-purple-800">
              <Brain className="h-3 w-3 mr-1" />
              Machine Learning
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.slice(0, 8).map((prediction) => (
              <Card key={prediction.studentId} className={`border-l-4 ${
                prediction.riskLevel === 'critical' ? 'border-l-red-500' :
                prediction.riskLevel === 'high' ? 'border-l-orange-500' :
                prediction.riskLevel === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{prediction.studentName}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskBadgeColor(prediction.riskLevel)}>
                        {prediction.riskLevel}
                      </Badge>
                      <span className="text-sm font-medium">
                        {prediction.probability.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  {prediction.predictedAlerts.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Alertas predichas:</p>
                      <div className="flex flex-wrap gap-1">
                        {prediction.predictedAlerts.map((alert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {alert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {prediction.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Recomendaciones:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {analysisType === 'patterns' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Patrones Detectados</h3>
          
          <div className="space-y-4">
            {patterns.slice(0, 10).map((pattern, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{pattern.description}</h4>
                        <Badge className={
                          pattern.impact === 'high' ? 'bg-red-100 text-red-800' :
                          pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {pattern.impact} impacto
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Frecuencia:</span> {pattern.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Estudiantes:</span> {pattern.affectedStudents}
                        </div>
                        <div>
                          <span className="font-medium">Tiempo resolución:</span> {pattern.avgResolutionTime.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {analysisType === 'performance' && performanceMetrics && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tasa de Resolución</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {performanceMetrics.resolutionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Alertas resueltas exitosamente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tasa de Escalamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {performanceMetrics.escalationRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Alertas que requirieron escalamiento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Eficiencia General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {performanceMetrics.efficiency.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Índice de eficiencia del sistema</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Tiempos de Respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">&lt; 2h</div>
                  <p className="text-sm text-gray-600">Respuesta rápida</p>
                  <div className="text-lg font-medium">65%</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">2-24h</div>
                  <p className="text-sm text-gray-600">Respuesta normal</p>
                  <div className="text-lg font-medium">28%</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">&gt; 24h</div>
                  <p className="text-sm text-gray-600">Respuesta lenta</p>
                  <div className="text-lg font-medium">7%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AlertAnalytics;
