import React, { useState, useContext, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import ReutilizableDialog from '@/components/DialogReutlizable';
import { toast } from 'sonner';
import { 
  Bot, 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Lightbulb, 
  Download, 
  RefreshCw, 
  BookOpen, 
  Users, 
  Calendar,
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BotAnalysis {
  type: 'academic' | 'attendance' | 'behavioral' | 'predictive';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
  dataPoints: unknown[];
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

interface BotResponse {
  id: string;
  query: string;
  response: string;
  analysis: BotAnalysis[];
  timestamp: Date;
  userRole: string;
}

const BotOverview: React.FC = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'alumno';
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<BotAnalysis | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [botResponses, setBotResponses] = useState<BotResponse[]>([]);


  // Fetch all necessary data
  const { data: students, loading: loadingStudents, error: errorStudents } = useFirestoreCollection('students');
  const { data: courses, loading: loadingCourses, error: errorCourses } = useFirestoreCollection('courses');
  const { data: teachers, loading: loadingTeachers, error: errorTeachers } = useFirestoreCollection('teachers');
  const { data: subjects, loading: loadingSubjects, error: errorSubjects } = useFirestoreCollection('subjects');
  const { data: attendances, loading: loadingAttendances, error: errorAttendances } = useFirestoreCollection('attendances');
  const { data: calificaciones, loading: loadingCalificaciones, error: errorCalificaciones } = useFirestoreCollection('calificaciones');
  const { data: boletines, loading: loadingBoletines, error: errorBoletines } = useFirestoreCollection('boletines');
  const { data: alerts, loading: loadingAlerts, error: errorAlerts } = useFirestoreCollection('alerts');
  const { data: inscripciones, loading: loadingInscripciones, error: errorInscripciones } = useFirestoreCollection('inscripciones');

  // Predefined queries for the bot
  const predefinedQueries = [
    {
      id: 'performance-analysis',
      title: 'Análisis de Rendimiento General',
      description: 'Analiza el rendimiento académico de todos los estudiantes',
      icon: BarChart3
    },
    {
      id: 'attendance-patterns',
      title: 'Patrones de Asistencia',
      description: 'Identifica patrones y tendencias en la asistencia',
      icon: Calendar
    },
    {
      id: 'at-risk-students',
      title: 'Estudiantes en Riesgo',
      description: 'Detecta estudiantes que requieren atención especial',
      icon: AlertTriangle
    },
    {
      id: 'subject-performance',
      title: 'Rendimiento por Materia',
      description: 'Analiza el rendimiento específico por materia',
      icon: BookOpen
    },
    {
      id: 'predictive-insights',
      title: 'Insights Predictivos',
      description: 'Genera predicciones basadas en datos históricos',
      icon: TrendingUp
    },
    {
      id: 'teacher-effectiveness',
      title: 'Efectividad Docente',
      description: 'Analiza la efectividad de los docentes',
      icon: Users
    }
  ];

  // Intelligent bot analysis using real data
  const botAnalysis = useMemo(() => {
    if (loadingStudents || loadingCourses || loadingTeachers || loadingSubjects || 
        loadingAttendances || loadingCalificaciones || loadingBoletines || 
        loadingAlerts || loadingInscripciones) {
      return [];
    }

    const analyses: BotAnalysis[] = [];

    // 1. Academic Performance Analysis
    if (students && calificaciones && boletines) {
      const performanceData = students.map(student => {
        const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
        const studentBoletin = boletines.find(b => b.alumnoId === student.firestoreId);
        
        const averageGrade = studentGrades.length > 0 
          ? studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length 
          : 0;
        
        return {
          studentId: student.firestoreId,
          studentName: `${student.nombre} ${student.apellido}`,
          averageGrade,
          totalGrades: studentGrades.length,
          boletinAverage: studentBoletin?.promedioTotal || 0
        };
      });

      const highPerformers = performanceData.filter(p => p.averageGrade >= 8).length;
      const lowPerformers = performanceData.filter(p => p.averageGrade < 6).length;
      const totalStudents = performanceData.length;

      analyses.push({
        type: 'academic',
        title: 'Análisis de Rendimiento Académico',
        description: `Se analizaron ${totalStudents} estudiantes. ${highPerformers} estudiantes destacados (≥8), ${lowPerformers} en riesgo (<6).`,
        confidence: 0.85,
        recommendations: [
          'Implementar tutorías para estudiantes con bajo rendimiento',
          'Reconocer y motivar a estudiantes destacados',
          'Establecer metas personalizadas por estudiante'
        ],
        dataPoints: performanceData,
        priority: lowPerformers > totalStudents * 0.3 ? 'high' : 'medium',
        timestamp: new Date()
      });
    }

    // 2. Attendance Pattern Analysis
    if (attendances && students) {
      const attendanceBySubject = attendances.reduce((acc, att) => {
        const subject = att.subject || 'Sin materia';
        if (!acc[subject]) {
          acc[subject] = { present: 0, absent: 0, total: 0 };
        }
        if (att.present) {
          acc[subject].present++;
        } else {
          acc[subject].absent++;
        }
        acc[subject].total++;
        return acc;
      }, {} as Record<string, { present: number; absent: number; total: number }>);

      const attendanceRates = Object.entries(attendanceBySubject).map(([subject, data]) => ({
        subject,
        attendanceRate: (data.present / data.total) * 100,
        totalSessions: data.total
      }));

      const averageAttendance = attendanceRates.reduce((sum, item) => sum + item.attendanceRate, 0) / attendanceRates.length;

      analyses.push({
        type: 'attendance',
        title: 'Análisis de Patrones de Asistencia',
        description: `Asistencia promedio: ${averageAttendance.toFixed(1)}%. Se analizaron ${attendances.length} registros de asistencia.`,
        confidence: 0.78,
        recommendations: [
          'Identificar causas de ausentismo por materia',
          'Implementar estrategias de motivación para mejorar asistencia',
          'Establecer comunicación con familias de estudiantes con baja asistencia'
        ],
        dataPoints: attendanceRates,
        priority: averageAttendance < 80 ? 'high' : 'medium',
        timestamp: new Date()
      });
    }

    // 3. At-Risk Students Detection
    if (students && calificaciones && attendances) {
      const riskStudents = students.map(student => {
        const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
        const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
        
        const averageGrade = studentGrades.length > 0 
          ? studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length 
          : 0;
        
        const attendanceRate = studentAttendance.length > 0
          ? (studentAttendance.filter(a => a.present).length / studentAttendance.length) * 100
          : 100;

        const riskFactors = [];
        if (averageGrade < 6) riskFactors.push('Bajo rendimiento académico');
        if (attendanceRate < 80) riskFactors.push('Baja asistencia');
        if (studentGrades.length === 0) riskFactors.push('Sin calificaciones registradas');

        return {
          studentId: student.firestoreId,
          studentName: `${student.nombre} ${student.apellido}`,
          averageGrade,
          attendanceRate,
          riskFactors,
          riskLevel: riskFactors.length > 1 ? 'high' : riskFactors.length === 1 ? 'medium' : 'low'
        };
      }).filter(s => s.riskFactors.length > 0);

      analyses.push({
        type: 'behavioral',
        title: 'Detección de Estudiantes en Riesgo',
        description: `Se identificaron ${riskStudents.length} estudiantes que requieren atención especial.`,
        confidence: 0.82,
        recommendations: [
          'Programar reuniones con estudiantes en riesgo y sus familias',
          'Implementar planes de apoyo académico personalizados',
          'Establecer seguimiento semanal de progreso'
        ],
        dataPoints: riskStudents,
        priority: riskStudents.length > 0 ? 'high' : 'low',
        timestamp: new Date()
      });
    }

           // 4. Subject Performance Analysis
       if (subjects && calificaciones) {
         const subjectPerformance = subjects.map(subject => {
           const subjectGrades = calificaciones.filter(g => g.subjectId === subject.firestoreId);
           
           if (subjectGrades.length === 0) return null;

           const averageGrade = subjectGrades.reduce((sum, g) => sum + g.valor, 0) / subjectGrades.length;
           const passingRate = (subjectGrades.filter(g => g.valor >= 6).length / subjectGrades.length) * 100;

           return {
             subjectName: subject.nombre,
             teacherName: subject.profesor,
             averageGrade,
             passingRate,
             totalGrades: subjectGrades.length,
             difficulty: averageGrade < 6 ? 'Alta' : averageGrade < 7 ? 'Media' : 'Baja'
           };
         }).filter((s): s is NonNullable<typeof s> => s !== null);

      analyses.push({
        type: 'academic',
        title: 'Análisis de Rendimiento por Materia',
        description: `Se analizaron ${subjectPerformance.length} materias. Promedio general: ${(subjectPerformance.reduce((sum, s) => sum + s.averageGrade, 0) / subjectPerformance.length).toFixed(1)}.`,
        confidence: 0.79,
        recommendations: [
          'Identificar materias con mayor dificultad para implementar apoyo',
          'Compartir mejores prácticas entre docentes',
          'Desarrollar recursos adicionales para materias complejas'
        ],
        dataPoints: subjectPerformance,
        priority: 'medium',
        timestamp: new Date()
      });
    }

    // 5. Predictive Insights
    if (students && calificaciones && attendances) {
      const predictiveData = students.map(student => {
        const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
        const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
        
        const recentGrades = studentGrades.slice(-3); // Last 3 grades
        const recentAttendance = studentAttendance.slice(-5); // Last 5 attendance records
        
        const gradeTrend = recentGrades.length >= 2 
          ? recentGrades[recentGrades.length - 1].valor - recentGrades[0].valor
          : 0;
        
        const attendanceTrend = recentAttendance.length >= 2
          ? (recentAttendance[recentAttendance.length - 1].present ? 1 : 0) - (recentAttendance[0].present ? 1 : 0)
          : 0;

        return {
          studentId: student.firestoreId,
          studentName: `${student.nombre} ${student.apellido}`,
          gradeTrend,
          attendanceTrend,
          prediction: gradeTrend > 0 && attendanceTrend >= 0 ? 'Mejora' : 
                    gradeTrend < 0 || attendanceTrend < 0 ? 'Riesgo' : 'Estable'
        };
      });

      const improvingStudents = predictiveData.filter(s => s.prediction === 'Mejora').length;
      const atRiskStudents = predictiveData.filter(s => s.prediction === 'Riesgo').length;

      analyses.push({
        type: 'predictive',
        title: 'Insights Predictivos',
        description: `${improvingStudents} estudiantes muestran tendencia de mejora, ${atRiskStudents} requieren atención inmediata.`,
        confidence: 0.75,
        recommendations: [
          'Reforzar estrategias para estudiantes con tendencia positiva',
          'Intervenir tempranamente en casos de riesgo',
          'Establecer metas a corto plazo para estudiantes estables'
        ],
        dataPoints: predictiveData,
        priority: atRiskStudents > 0 ? 'high' : 'medium',
        timestamp: new Date()
      });
    }

    return analyses;
  }, [
    students, courses, teachers, subjects, attendances, calificaciones, boletines, alerts, inscripciones,
    loadingStudents, loadingCourses, loadingTeachers, loadingSubjects, loadingAttendances, 
    loadingCalificaciones, loadingBoletines, loadingAlerts, loadingInscripciones,
    errorStudents, errorCourses, errorTeachers, errorSubjects, errorAttendances, 
    errorCalificaciones, errorBoletines, errorAlerts, errorInscripciones
  ]);

  const handleQuery = (queryType: string) => {
    setSelectedQuery(queryType);
    setCustomQuery('');
    
    // Procesar la consulta seleccionada
    let analysisType = '';
    let message = '';
    
    switch (queryType) {
      case 'performance-analysis':
        analysisType = 'academic';
        message = 'Analizando rendimiento académico de todos los estudiantes...';
        break;
      case 'attendance-patterns':
        analysisType = 'attendance';
        message = 'Identificando patrones de asistencia...';
        break;
      case 'at-risk-students':
        analysisType = 'behavioral';
        message = 'Detectando estudiantes en riesgo...';
        break;
      case 'subject-performance':
        analysisType = 'academic';
        message = 'Analizando rendimiento por materia...';
        break;
      case 'predictive-insights':
        analysisType = 'predictive';
        message = 'Generando insights predictivos...';
        break;
      case 'teacher-effectiveness':
        analysisType = 'academic';
        message = 'Analizando efectividad docente...';
        break;
      default:
        message = 'Procesando consulta...';
    }
    
    toast.success(message);
    setLastUpdate(new Date());
    
    // Generar respuesta del bot
    const selectedQueryData = predefinedQueries.find(q => q.id === queryType);
    const queryTitle = selectedQueryData?.title || 'Consulta personalizada';
    
    const response: BotResponse = {
      id: Date.now().toString(),
      query: queryTitle,
      response: generateBotResponse(queryType, botAnalysis),
      analysis: botAnalysis.filter(a => a.type === analysisType || analysisType === ''),
      timestamp: new Date(),
      userRole: userRole
    };
    
    setBotResponses(prev => [response, ...prev]);
  };

  // Función para generar respuestas del bot
  const generateBotResponse = (queryType: string, analyses: BotAnalysis[]) => {
    const analysis = analyses.find(a => {
      switch (queryType) {
        case 'performance-analysis':
          return a.type === 'academic' && a.title.includes('Rendimiento Académico');
        case 'attendance-patterns':
          return a.type === 'attendance';
        case 'at-risk-students':
          return a.type === 'behavioral';
        case 'subject-performance':
          return a.type === 'academic' && a.title.includes('Materia');
        case 'predictive-insights':
          return a.type === 'predictive';
        default:
          return true;
      }
    });

    if (!analysis) {
      return 'No se encontraron datos suficientes para este análisis.';
    }

    const confidence = (analysis.confidence * 100).toFixed(0);
    const priority = analysis.priority === 'high' ? 'alta' : analysis.priority === 'medium' ? 'media' : 'baja';
    
    return `Basado en el análisis de ${analysis.dataPoints.length} elementos, he encontrado que ${analysis.description} La confianza del análisis es del ${confidence}% y la prioridad es ${priority}.`;
  };

  const handleCustomQuery = () => {
    if (!customQuery.trim()) {
      toast.error('Por favor ingresa una consulta');
      return;
    }
    
    // Analizar el tipo de consulta personalizada
    const query = customQuery.toLowerCase();
    let analysisType = '';
    let message = '';
    
    if (query.includes('rendimiento') || query.includes('notas') || query.includes('calificaciones')) {
      analysisType = 'academic';
      message = 'Analizando rendimiento académico...';
    } else if (query.includes('asistencia') || query.includes('ausencia')) {
      analysisType = 'attendance';
      message = 'Analizando patrones de asistencia...';
    } else if (query.includes('riesgo') || query.includes('problema') || query.includes('bajo')) {
      analysisType = 'behavioral';
      message = 'Detectando estudiantes en riesgo...';
    } else if (query.includes('materia') || query.includes('asignatura') || query.includes('curso')) {
      analysisType = 'academic';
      message = 'Analizando rendimiento por materia...';
    } else if (query.includes('predicción') || query.includes('tendencia') || query.includes('futuro')) {
      analysisType = 'predictive';
      message = 'Generando insights predictivos...';
    } else {
      analysisType = 'academic';
      message = 'Procesando consulta personalizada...';
    }
    
    toast.success(message);
    setLastUpdate(new Date());
    
    // Generar respuesta del bot para consulta personalizada
    const response: BotResponse = {
      id: Date.now().toString(),
      query: customQuery,
      response: generateBotResponse('custom', botAnalysis),
      analysis: botAnalysis.filter(a => a.type === analysisType || analysisType === ''),
      timestamp: new Date(),
      userRole: userRole
    };
    
    setBotResponses(prev => [response, ...prev]);
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    toast.success('Datos actualizados');
  };

  const handleViewAnalysis = (analysis: BotAnalysis) => {
    setSelectedAnalysis(analysis);
    setShowAnalysisModal(true);
  };

  const handleExportAnalysis = () => {
    const data = {
      analyses: botAnalysis,
      timestamp: new Date().toISOString(),
      user: user?.email,
      role: userRole
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-analysis-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Análisis exportado exitosamente');
  };

  // Access control
  if (userRole !== 'admin' && userRole !== 'docente') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acceso Restringido</CardTitle>
            <CardDescription className="text-center">
              Solo administradores y docentes pueden acceder al Bot IA.
              <br />
              Tu rol actual: {user?.role}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loadingStudents || loadingCourses || loadingTeachers || loadingSubjects || 
      loadingAttendances || loadingCalificaciones || loadingBoletines || 
      loadingAlerts || loadingInscripciones) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Cargando Bot IA</CardTitle>
            <CardDescription className="text-center">
              <div className="relative mx-auto mb-3 h-8 w-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-500 animate-spin-slow [mask-image:radial-gradient(transparent_58%,black_60%)]" />
              </div>
              Analizando datos del sistema educativo...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
             {/* Header */}
       <div className="mb-8">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-4">
             <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
               <Bot className="h-8 w-8 text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-bold text-gray-900">Bot IA</h1>
               <p className="text-gray-600">Asistente inteligente para análisis educativo</p>
             </div>
           </div>
           <div className="flex items-center space-x-2">
             <div className="flex items-center space-x-2 text-sm text-gray-600">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span>Conectado</span>
             </div>
             <Button
               variant="outline"
               size="sm"
               onClick={handleRefresh}
               className="flex items-center space-x-2"
             >
               <RefreshCw className="h-4 w-4" />
               <span>Actualizar</span>
             </Button>
           </div>
         </div>

         {/* Welcome Message */}
         <Card className="bg-white/80 backdrop-blur-sm">
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-semibold text-gray-900 mb-2">
                   ¡Hola {user?.email?.split('@')[0]}!
                 </h2>
                 <p className="text-gray-600">
                   Soy tu asistente IA para análisis educativo. Puedo ayudarte a entender patrones, 
                   detectar tendencias y generar insights valiosos sobre el rendimiento académico.
                 </p>
               </div>
               <div className="text-right">
                 <p className="text-sm text-gray-500">Última actualización</p>
                 <p className="text-sm font-medium text-gray-700">
                   {format(lastUpdate, 'dd/MM/yyyy HH:mm', { locale: es })}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>

      {/* Query Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Predefined Queries */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span>Consultas Predefinidas</span>
            </CardTitle>
            <CardDescription>
              Selecciona un tipo de análisis para obtener insights específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {predefinedQueries.map((query) => {
                const Icon = query.icon;
                return (
                  <Button
                    key={query.id}
                    variant={selectedQuery === query.id ? "default" : "outline"}
                    className="justify-start h-auto p-4"
                    onClick={() => handleQuery(query.id)}
                  >
                    <Icon className="h-5 w-5 mr-3 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium">{query.title}</div>
                      <div className="text-sm text-gray-600">{query.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Query */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Consulta Personalizada</span>
            </CardTitle>
            <CardDescription>
              Escribe tu propia consulta para análisis específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Ej: Analizar rendimiento de estudiantes en Matemáticas..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="mb-3"
                />
                <Button 
                  onClick={handleCustomQuery}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Procesar Consulta
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Ejemplos de consultas:</p>
                <ul className="space-y-1 text-xs">
                  <li>• "¿Cuáles estudiantes tienen mejor rendimiento?"</li>
                  <li>• "Analizar patrones de asistencia por materia"</li>
                  <li>• "Identificar estudiantes en riesgo académico"</li>
                  <li>• "Comparar rendimiento entre cursos"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Responses */}
      {botResponses.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Respuestas del Bot IA</h2>
            <Badge variant="secondary" className="text-sm">
              {botResponses.length} consulta{botResponses.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-4">
            {botResponses.map((response) => (
              <Card key={response.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-purple-600" />
                      <span>{response.query}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {format(response.timestamp, 'HH:mm', { locale: es })}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {response.analysis.length} análisis
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {response.response}
                      </p>
                    </div>
                    
                    {response.analysis.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Análisis Relacionados:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {response.analysis.slice(0, 2).map((analysis, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{analysis.title}</span>
                                <Badge 
                                  variant={analysis.priority === 'high' ? 'destructive' : 
                                         analysis.priority === 'medium' ? 'secondary' : 'default'}
                                  className="text-xs"
                                >
                                  {analysis.priority === 'high' ? 'Alta' : 
                                   analysis.priority === 'medium' ? 'Media' : 'Baja'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">{analysis.description}</p>
                              <div className="flex items-center justify-between mt-2 text-xs">
                                <span>Confianza: {(analysis.confidence * 100).toFixed(0)}%</span>
                                <span>{analysis.dataPoints.length} datos</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Análisis Inteligente</h2>
          <Button
            onClick={handleExportAnalysis}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Análisis</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {botAnalysis.map((analysis, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{analysis.title}</CardTitle>
                  <Badge 
                    variant={analysis.priority === 'high' ? 'destructive' : 
                           analysis.priority === 'medium' ? 'secondary' : 'default'}
                  >
                    {analysis.priority === 'high' ? 'Alta' : 
                     analysis.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {analysis.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Confianza:</span>
                    <span className="font-medium">{(analysis.confidence * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Datos analizados:</span>
                    <span className="font-medium">{analysis.dataPoints.length}</span>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => handleViewAnalysis(analysis)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ver Análisis Detallado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


             {/* Analysis Modal */}
       <ReutilizableDialog
         open={showAnalysisModal}
         onOpenChange={setShowAnalysisModal}
         title={selectedAnalysis?.title || 'Análisis Detallado'}
         description="Información completa del análisis realizado por el Bot IA"
         content={
           selectedAnalysis ? (
             <div className="space-y-6">
               <div>
                 <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                 <p className="text-gray-600">{selectedAnalysis.description}</p>
               </div>

               <div>
                 <h3 className="font-semibold text-gray-900 mb-2">Recomendaciones</h3>
                 <ul className="space-y-2">
                   {selectedAnalysis.recommendations.map((rec, index) => (
                     <li key={index} className="flex items-start space-x-2">
                       <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                       <span className="text-gray-600">{rec}</span>
                     </li>
                   ))}
                 </ul>
               </div>

               <div>
                 <h3 className="font-semibold text-gray-900 mb-2">Datos Analizados</h3>
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <pre className="text-sm text-gray-700 overflow-auto max-h-40">
                     {JSON.stringify(selectedAnalysis.dataPoints, null, 2)}
                   </pre>
                 </div>
               </div>

               <div className="flex items-center justify-between text-sm text-gray-500">
                 <span>Confianza: {(selectedAnalysis.confidence * 100).toFixed(0)}%</span>
                 <span>Prioridad: {selectedAnalysis.priority}</span>
                 <span>{format(selectedAnalysis.timestamp, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
               </div>
             </div>
           ) : null
         }
         small={false}
       />
    </div>
  );
};

export default BotOverview; 