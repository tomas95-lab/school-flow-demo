import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { StatsCard } from "./StatCards";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Calendar, 
  AlertTriangle,
  Download,
  Eye,
  Brain,
  Lightbulb,
  Target,
  BookOpen,
  Bell,
  FileText,
  } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { } from "date-fns";
import { } from "date-fns/locale";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import ReutilizableDialog from "./DialogReutlizable";

// Tipos TypeScript para los datos
interface Student {
  firestoreId: string;
  nombre: string;
  apellido: string;
  cursoId: string;
}

interface Course {
  firestoreId: string;
  nombre: string;
  division: string;
  teacherId: string;
}

interface Teacher {
  firestoreId: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface Subject {
  firestoreId: string;
  nombre: string;
  teacherId: string;
  cursoId: string[];
}

interface Attendance {
  firestoreId: string;
  studentId: string;
  courseId: string;
  subject: string;
  date: string;
  present: boolean;
}

interface Grade {
  firestoreId: string;
  studentId: string;
  subjectId: string;
  valor: number;
  fecha: string;
  Actividad: string;
}

interface Boletin {
  firestoreId: string;
  alumnoId: string;
  alumnoNombre: string;
  curso: string;
  periodo: string;
  promedioTotal: number;
  observacionAutomatica?: {
    tipo: string;
    texto: string;
    prioridad: string;
    reglaAplicada: string;
    datosSoporte: unknown;
  };
}

interface Alert {
  firestoreId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  courseId?: string;
  selectedStudents?: string[];
}

interface Inscripcion {
  firestoreId: string;
  studentId: string;
  courseId: string;
  status: string;
  fechaInscripcion: unknown;
}

export default function ReportesInteligentesOverview() {
  const { user } = useContext(AuthContext);
  const [selectedReport, setSelectedReport] = useState<string>("general");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  // Obtener todos los datos necesarios
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>("students");
  const { data: courses, loading: loadingCourses } = useFirestoreCollection<Course>("courses");
  const { data: teachers, loading: loadingTeachers } = useFirestoreCollection<Teacher>("teachers");
  const { data: subjects, loading: loadingSubjects } = useFirestoreCollection<Subject>("subjects");
  const { data: attendances, loading: loadingAttendances } = useFirestoreCollection<Attendance>("attendances");
  const { data: grades, loading: loadingGrades } = useFirestoreCollection<Grade>("calificaciones");
  const { data: boletines, loading: loadingBoletines } = useFirestoreCollection<Boletin>("boletines");
  const { data: alerts, loading: loadingAlerts } = useFirestoreCollection<Alert>("alerts");
  const { data: inscripciones, loading: loadingInscripciones } = useFirestoreCollection<Inscripcion>("inscripciones");

  // Análisis inteligente de datos
  const analysis = useMemo(() => {
    // Verificar que todos los datos estén disponibles
    if (!students || !courses || !teachers || !subjects || !attendances || !grades || !boletines || !alerts || !inscripciones) {
      console.log('Datos faltantes:', {
        students: !!students,
        courses: !!courses,
        teachers: !!teachers,
        subjects: !!subjects,
        attendances: !!attendances,
        grades: !!grades,
        boletines: !!boletines,
        alerts: !!alerts,
        inscripciones: !!inscripciones
      });
      return null;
    }

    // 1. Análisis de Rendimiento Académico
    const performanceAnalysis = {
      totalStudents: students.length,
      totalCourses: courses.length,
      totalTeachers: teachers.length,
      totalSubjects: subjects.length,
      
      // Promedios por curso
      courseAverages: courses.map(course => {
        const courseStudents = students.filter(s => s.cursoId === course.firestoreId);
        const courseGrades = grades.filter(g => 
          courseStudents.some(s => s.firestoreId === g.studentId)
        );
        const average = courseGrades.length > 0 
          ? courseGrades.reduce((sum, g) => sum + g.valor, 0) / courseGrades.length 
          : 0;
        
        return {
          courseId: course.firestoreId,
          courseName: `${course.nombre} ${course.division}`,
          studentCount: courseStudents.length,
          averageGrade: average,
          gradeCount: courseGrades.length
        };
      }),

      // Análisis de asistencia
      attendanceAnalysis: {
        totalRecords: attendances.length,
        presentCount: attendances.filter(a => a.present).length,
        absentCount: attendances.filter(a => !a.present).length,
        attendanceRate: attendances.length > 0 
          ? (attendances.filter(a => a.present).length / attendances.length) * 100 
          : 0
      },

      // Análisis de boletines
      boletinAnalysis: {
        totalBoletines: boletines.length,
        lowPerformance: boletines.filter(b => b.promedioTotal < 6).length,
        highPerformance: boletines.filter(b => b.promedioTotal >= 8).length,
        averagePromedio: boletines.length > 0 
          ? boletines.reduce((sum, b) => sum + b.promedioTotal, 0) / boletines.length 
          : 0
      },

      // Análisis de alertas
      alertAnalysis: {
        totalAlerts: alerts.length,
        academicAlerts: alerts.filter(a => a.type === 'academic').length,
        activeAlerts: alerts.filter(a => a.status === 'active').length,
        highPriorityAlerts: alerts.filter(a => a.priority === 'high').length
      },

      // Análisis de inscripciones
      inscriptionAnalysis: {
        totalInscriptions: inscripciones.length,
        pendingInscriptions: inscripciones.filter(i => i.status === 'pendiente').length,
        approvedInscriptions: inscripciones.filter(i => i.status === 'aprobada').length,
        rejectedInscriptions: inscripciones.filter(i => i.status === 'rechazada').length,
        cancelledInscriptions: inscripciones.filter(i => i.status === 'cancelada').length
      }
    };

    // 2. Detección de Patrones Inteligentes
    const intelligentPatterns = {
      // Estudiantes en riesgo
      atRiskStudents: boletines
        .filter(b => b.promedioTotal < 6)
        .map(b => ({
          studentId: b.alumnoId,
          studentName: b.alumnoNombre,
          promedio: b.promedioTotal,
          observacion: b.observacionAutomatica?.texto || "Sin observación automática"
        })),

      // Cursos con mejor rendimiento
      topPerformingCourses: performanceAnalysis.courseAverages
        .filter(c => c.averageGrade > 0)
        .sort((a, b) => b.averageGrade - a.averageGrade)
        .slice(0, 3),

      // Alertas más frecuentes
      frequentAlertTypes: alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Tendencias de asistencia por materia
      attendanceBySubject: attendances.reduce((acc, attendance) => {
        if (!acc[attendance.subject]) {
          acc[attendance.subject] = { present: 0, absent: 0, total: 0 };
        }
        acc[attendance.subject].total++;
        if (attendance.present) {
          acc[attendance.subject].present++;
        } else {
          acc[attendance.subject].absent++;
        }
        return acc;
      }, {} as Record<string, { present: number; absent: number; total: number }>)
    };

    // 3. Recomendaciones Inteligentes
    const intelligentRecommendations = {
      academic: [
        ...(intelligentPatterns.atRiskStudents.length > 0 ? [{
          type: "academic",
          priority: "high",
          title: "Intervención Académica Requerida",
          description: `${intelligentPatterns.atRiskStudents.length} estudiantes requieren atención inmediata`,
          action: "Revisar estrategias de apoyo pedagógico"
        }] : []),
        ...(performanceAnalysis.attendanceAnalysis.attendanceRate < 80 ? [{
          type: "attendance",
          priority: "medium",
          title: "Baja Asistencia Detectada",
          description: `Tasa de asistencia del ${performanceAnalysis.attendanceAnalysis.attendanceRate.toFixed(1)}%`,
          action: "Implementar programa de seguimiento de asistencia"
        }] : [])
      ],
      
      administrative: [
        ...(performanceAnalysis.alertAnalysis.highPriorityAlerts > 0 ? [{
          type: "administrative",
          priority: "high",
          title: "Alertas de Alta Prioridad",
          description: `${performanceAnalysis.alertAnalysis.highPriorityAlerts} alertas requieren atención inmediata`,
          action: "Revisar y atender alertas prioritarias"
        }] : []),
        ...(performanceAnalysis.inscriptionAnalysis.pendingInscriptions > 0 ? [{
          type: "administrative",
          priority: "medium",
          title: "Inscripciones Pendientes",
          description: `${performanceAnalysis.inscriptionAnalysis.pendingInscriptions} inscripciones requieren revisión`,
          action: "Procesar inscripciones pendientes"
        }] : [])
      ]
    };

    return {
      performance: performanceAnalysis,
      patterns: intelligentPatterns,
      recommendations: intelligentRecommendations
    };
  }, [students, courses, teachers, subjects, attendances, grades, boletines, alerts, inscripciones]);

  // Verificar acceso
  if (user?.role !== "admin" && user?.role !== "docente") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600 mb-4">
                  Solo administradores y docentes pueden acceder a los reportes inteligentes.
                </p>
                <p className="text-sm text-gray-500">
                  Tu rol actual: {user?.role || 'No definido'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Estados de carga
  if (loadingStudents || loadingCourses || loadingTeachers || loadingSubjects || 
      loadingAttendances || loadingGrades || loadingBoletines || loadingAlerts || loadingInscripciones) {
    const loadingStates = [
      { name: 'Estudiantes', loading: loadingStudents },
      { name: 'Cursos', loading: loadingCourses },
      { name: 'Docentes', loading: loadingTeachers },
      { name: 'Materias', loading: loadingSubjects },
      { name: 'Asistencias', loading: loadingAttendances },
      { name: 'Calificaciones', loading: loadingGrades },
      { name: 'Boletines', loading: loadingBoletines },
      { name: 'Alertas', loading: loadingAlerts },
      { name: 'Inscripciones', loading: loadingInscripciones }
    ];
    
    const loadingCount = loadingStates.filter(s => s.loading).length;
    const totalCount = loadingStates.length;
    
    return (
      <LoadingState 
        text={`Analizando datos (${totalCount - loadingCount}/${totalCount} completado)...`}
        timeout={15000}
        timeoutMessage="El análisis está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  if (!analysis) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No hay datos disponibles"
        description="No se encontraron datos suficientes para generar reportes inteligentes"
      />
    );
  }

  const handleViewAnalysis = (analysisData: unknown) => {
    setSelectedAnalysis(analysisData);
    setShowDetailsModal(true);
  };


  const handleExportReport = (reportType: string) => {
    try {
      // Simular exportación
      const reportData = {
        type: reportType,
        timestamp: new Date().toISOString(),
        data: analysis,
        user: user?.email,
        role: user?.role
      };
      
      console.log('Exportando reporte:', reportData);
      
      // Crear archivo de descarga
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Reporte ${reportType} exportado exitosamente`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Reportes Inteligentes
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                      {user?.role === "docente" && "Docente"}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">Sistema Educativo</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Análisis avanzado y detección de patrones en tiempo real con inteligencia artificial.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">IA Activa</p>
                      <p className="font-bold text-gray-900">Análisis en Tiempo Real</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button 
                onClick={() => handleExportReport("completo")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
            </div>
          </div>

          {/* Indicadores de datos */}
          {analysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Estudiantes</p>
                      <p className="font-bold text-gray-900">{analysis.performance.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Cursos</p>
                      <p className="font-bold text-gray-900">{analysis.performance.totalCourses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Docentes</p>
                      <p className="font-bold text-gray-900">{analysis.performance.totalTeachers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Materias</p>
                      <p className="font-bold text-gray-900">{analysis.performance.totalSubjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label="Total Estudiantes"
            value={analysis.performance.totalStudents}
            icon={Users}
            subtitle="Matriculados activos"
          />
          <StatsCard
            label="Promedio General"
            value={`${analysis.performance.boletinAnalysis.averagePromedio.toFixed(1)}`}
            icon={TrendingUp}
            color="green"
            subtitle="Rendimiento académico"
          />
          <StatsCard
            label="Tasa de Asistencia"
            value={`${analysis.performance.attendanceAnalysis.attendanceRate.toFixed(1)}%`}
            icon={Calendar}
            color="blue"
            subtitle="Promedio de asistencia"
          />
          <StatsCard
            label="Alertas Activas"
            value={analysis.performance.alertAnalysis.activeAlerts}
            icon={Bell}
            color="yellow"
            subtitle="Requieren atención"
          />
        </div>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Reporte</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Reporte General</SelectItem>
                  <SelectItem value="academic">Rendimiento Académico</SelectItem>
                  <SelectItem value="attendance">Asistencia</SelectItem>
                  <SelectItem value="alerts">Alertas y Recomendaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Curso</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses?.map(course => (
                    <SelectItem key={course.firestoreId} value={course.firestoreId}>
                      {course.nombre} {course.division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los períodos</SelectItem>
                  <SelectItem value="2025-T1">Primer Trimestre 2025</SelectItem>
                  <SelectItem value="2025-T2">Segundo Trimestre 2025</SelectItem>
                  <SelectItem value="2025-T3">Tercer Trimestre 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Secciones de Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Análisis de Rendimiento */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Análisis de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.patterns.atRiskStudents.length}
                  </div>
                  <div className="text-sm text-gray-600">Estudiantes en Riesgo</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.performance.boletinAnalysis.highPerformance}
                  </div>
                  <div className="text-sm text-gray-600">Alto Rendimiento</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Top Cursos por Rendimiento:</h4>
                {analysis.patterns.topPerformingCourses.map((course) => (
                  <div key={course.courseId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{course.courseName}</span>
                    <Badge variant="secondary">{course.averageGrade.toFixed(1)}</Badge>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => handleViewAnalysis({ type: 'performance', data: analysis.performance })}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Análisis Completo
              </Button>
            </CardContent>
          </Card>

          {/* Recomendaciones Inteligentes */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Recomendaciones Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {analysis.recommendations.academic.slice(0, 3).map((rec, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-sm">{rec.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{rec.description}</p>
                  </div>
                ))}
                
                {analysis.recommendations.administrative.slice(0, 2).map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{rec.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{rec.description}</p>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => handleViewAnalysis({ type: 'recommendations', data: analysis.recommendations })}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Todas las Recomendaciones
              </Button>
            </CardContent>
          </Card>

          {/* Análisis de Asistencia */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Análisis de Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.performance.attendanceAnalysis.presentCount}
                  </div>
                  <div className="text-sm text-gray-600">Presentes</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analysis.performance.attendanceAnalysis.absentCount}
                  </div>
                  <div className="text-sm text-gray-600">Ausentes</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Asistencia por Materia:</h4>
                {Object.entries(analysis.patterns.attendanceBySubject).map(([subject, data]) => (
                  <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600">{data.present}</span>
                      <span className="text-xs text-red-600">{data.absent}</span>
                      <Badge variant="outline">
                        {((data.present / data.total) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => handleViewAnalysis({ type: 'attendance', data: analysis.patterns.attendanceBySubject })}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Análisis Detallado
              </Button>
            </CardContent>
          </Card>

          {/* Alertas y Monitoreo */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-600" />
                Alertas y Monitoreo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analysis.performance.alertAnalysis.highPriorityAlerts}
                  </div>
                  <div className="text-sm text-gray-600">Alta Prioridad</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analysis.performance.alertAnalysis.academicAlerts}
                  </div>
                  <div className="text-sm text-gray-600">Académicas</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Tipos de Alertas:</h4>
                {Object.entries(analysis.patterns.frequentAlertTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => handleViewAnalysis({ type: 'alerts', data: analysis.performance.alertAnalysis })}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Todas las Alertas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalles */}
      <ReutilizableDialog
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        title={selectedAnalysis?.type === 'performance' ? 'Análisis de Rendimiento' :
               selectedAnalysis?.type === 'recommendations' ? 'Recomendaciones Inteligentes' :
               selectedAnalysis?.type === 'attendance' ? 'Análisis de Asistencia' :
               selectedAnalysis?.type === 'alerts' ? 'Alertas y Monitoreo' : 'Análisis Detallado'}
        description="Información detallada del análisis seleccionado"
        small={false}
        content={
          selectedAnalysis ? (
            <div className="space-y-6">
              {selectedAnalysis.type === 'performance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Estudiantes en Riesgo</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedAnalysis.data.boletinAnalysis.lowPerformance}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Alto Rendimiento</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedAnalysis.data.boletinAnalysis.highPerformance}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Promedios por Curso:</h4>
                    <div className="space-y-2">
                      {selectedAnalysis.data.courseAverages.map((course: {
                        courseId: string;
                        courseName: string;
                        studentCount: number;
                        averageGrade: number;
                      }) => (
                        <div key={course.courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">{course.courseName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{course.studentCount} estudiantes</span>
                            <Badge variant={course.averageGrade >= 7 ? "default" : "destructive"}>
                              {course.averageGrade.toFixed(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedAnalysis.type === 'recommendations' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recomendaciones Académicas:</h4>
                    <div className="space-y-3">
                      {selectedAnalysis.data.academic.map((rec: unknown, index: number) => (
                        <div key={index} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          {(() => {
                            const typedRec = rec as {
                              title: string;
                              priority: string;
                            };
                            return (
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-5 w-5 text-yellow-600" />
                                <span className="font-semibold">{typedRec.title}</span>
                                <Badge variant={typedRec.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {typedRec.priority}
                                </Badge>
                              </div>
                            );
                          })()}
                          {(() => {
                            const typedRec = rec as {
                              description?: string;
                              action?: string;
                            };
                            return (
                              <>
                                {typedRec.description && (
                                  <p className="text-sm text-gray-700 mb-2">{typedRec.description}</p>
                                )}
                                {typedRec.action && (
                                  <p className="text-xs text-gray-600 font-medium">Acción: {typedRec.action}</p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recomendaciones Administrativas:</h4>
                    <div className="space-y-3">
                      {selectedAnalysis.data.administrative.map((rec: unknown, index: number) => (
                        <div key={index} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                          {(() => {
                            const typedRec = rec as {
                              title: string;
                              priority: string;
                            };
                            return (
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <span className="font-semibold">{typedRec.title}</span>
                                <Badge variant={typedRec.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {typedRec.priority}
                                </Badge>
                              </div>
                            );
                          })()}
                          {(() => {
                            const typedRec = rec as {
                              description?: string;
                              action?: string;
                            };
                            return (
                              <>
                                {typedRec.description && (
                                  <p className="text-sm text-gray-700 mb-2">{typedRec.description}</p>
                                )}
                                {typedRec.action && (
                                  <p className="text-xs text-gray-600 font-medium">Acción: {typedRec.action}</p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedAnalysis.type === 'attendance' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Análisis por Materia:</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedAnalysis.data).map(([subject, data]: [string, any]) => (
                        <div key={subject} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900">{subject}</h5>
                            <Badge variant={data.present / data.total >= 0.8 ? 'default' : 'destructive'}>
                              {((data.present / data.total) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-green-600">{data.present}</div>
                              <div className="text-xs text-gray-600">Presentes</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-red-600">{data.absent}</div>
                              <div className="text-xs text-gray-600">Ausentes</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-blue-600">{data.total}</div>
                              <div className="text-xs text-gray-600">Total</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedAnalysis.type === 'alerts' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-900">Alta Prioridad</h4>
                      <div className="text-2xl font-bold text-red-600">
                        {selectedAnalysis.data.highPriorityAlerts}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-900">Académicas</h4>
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedAnalysis.data.academicAlerts}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Resumen de Alertas:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Total de Alertas</span>
                        <Badge variant="secondary">{selectedAnalysis.data.totalAlerts}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Alertas Activas</span>
                        <Badge variant="default">{selectedAnalysis.data.activeAlerts}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Alta Prioridad</span>
                        <Badge variant="destructive">{selectedAnalysis.data.highPriorityAlerts}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontró información del análisis</p>
            </div>
          )
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDetailsModal(false)}
              className="px-6"
            >
              Cerrar
            </Button>
            <Button 
              onClick={() => handleExportReport(selectedAnalysis?.type || 'detallado')}
              className="px-6"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        }
      />
    </div>
  );
} 