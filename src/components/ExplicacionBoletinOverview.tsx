import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { StatsCard } from "./StatCards";
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Calendar, 
  AlertTriangle,
  Download,
  Eye,
  Lightbulb,
  BarChart3,
  BookMarked,
  Award,
  AlertCircle,
  Sparkles,
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
import { useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

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
  materias: Array<{
    nombre: string;
    T1: number;
    T2: number;
    T3: number;
  }>;
  observacionAutomatica?: {
    tipo: string;
    texto: string;
    prioridad: string;
    reglaAplicada: string;
    datosSoporte: unknown;
  };
  asistenciasTotales: number;
  alertas: string[];
  comentario: string;
  abierto: boolean;
  fechaGeneracion: string;
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

interface Teacher {
  firestoreId: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
}

export default function ExplicacionBoletinOverview() {
  const { user } = useContext(AuthContext);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [selectedBoletin, setSelectedBoletin] = useState<Boletin | null>(null);
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState(false);

  // Obtener todos los datos necesarios
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>("students");
  const { data: courses, loading: loadingCourses } = useFirestoreCollection<Course>("courses");
  const { data: subjects, loading: loadingSubjects } = useFirestoreCollection<Subject>("subjects");
  const { data: attendances, loading: loadingAttendances } = useFirestoreCollection<Attendance>("attendances");
  const { data: grades, loading: loadingGrades } = useFirestoreCollection<Grade>("calificaciones");
  const { data: boletines, loading: loadingBoletines } = useFirestoreCollection<Boletin>("boletines");
  const { data: alerts, loading: loadingAlerts } = useFirestoreCollection<Alert>("alerts");
  const { data: teachers, loading: loadingTeachers } = useFirestoreCollection<Teacher>("users");

  const isAlumno = user?.role === 'alumno';
  const currentStudent = useMemo(() => {
    if (!isAlumno) return undefined;
    return students?.find((s: any) => s.firestoreId === user?.studentId);
  }, [isAlumno, students, user?.studentId]);

  // Forzar filtros al alumno actual
  useEffect(() => {
    if (isAlumno && user?.studentId) {
      setSelectedStudent(user.studentId);
      if (currentStudent?.cursoId) {
        setSelectedCourse(currentStudent.cursoId);
      }
    }
  }, [isAlumno, user?.studentId, currentStudent?.cursoId]);

  // Análisis inteligente de boletines
  const analysis = useMemo(() => {
    if (!students || !courses || !subjects || !attendances || !grades || !boletines || !alerts || !teachers) {
      return null;
    }

    // Filtrar boletines según los filtros seleccionados
    const filteredBoletines = boletines.filter(boletin => {
      const studentMatch = selectedStudent === "all" || boletin.alumnoId === selectedStudent;
      const periodMatch = selectedPeriod === "all" || boletin.periodo === selectedPeriod;
      const courseMatch = selectedCourse === "all" || boletin.curso === selectedCourse;
      return studentMatch && periodMatch && courseMatch;
    });

    // 1. Análisis General de Boletines
    const generalAnalysis = {
      totalBoletines: filteredBoletines.length,
      totalStudents: isAlumno ? 1 : students.length,
      totalCourses: isAlumno ? (currentStudent?.cursoId ? 1 : 0) : courses.length,
      totalSubjects: subjects.length,
      
      // Estadísticas de rendimiento
      performanceStats: {
        excellent: filteredBoletines.filter(b => b.promedioTotal >= 9).length,
        good: filteredBoletines.filter(b => b.promedioTotal >= 7 && b.promedioTotal < 9).length,
        average: filteredBoletines.filter(b => b.promedioTotal >= 6 && b.promedioTotal < 7).length,
        belowAverage: filteredBoletines.filter(b => b.promedioTotal >= 4 && b.promedioTotal < 6).length,
        poor: filteredBoletines.filter(b => b.promedioTotal < 4).length
      },

      // Análisis por período
      periodAnalysis: filteredBoletines.reduce((acc, boletin) => {
        if (!acc[boletin.periodo]) {
          acc[boletin.periodo] = {
            count: 0,
            averagePromedio: 0,
            totalPromedio: 0
          };
        }
        acc[boletin.periodo].count++;
        acc[boletin.periodo].totalPromedio += boletin.promedioTotal;
        acc[boletin.periodo].averagePromedio = acc[boletin.periodo].totalPromedio / acc[boletin.periodo].count;
        return acc;
      }, {} as Record<string, { count: number; averagePromedio: number; totalPromedio: number }>)
    };

    // 2. Análisis Inteligente por Materia
    const subjectAnalysis = subjects.map(subject => {
      const subjectBoletines = filteredBoletines.filter(b => 
        b.materias.some(m => m.nombre.toLowerCase() === subject.nombre.toLowerCase())
      );
      
      // Obtener calificaciones específicas de esta materia
      const subjectGrades = grades.filter(g => {
        // Verificar que la calificación pertenece a un estudiante que tiene boletín
        const hasBoletin = subjectBoletines.some(b => b.alumnoId === g.studentId);
        // Verificar que la calificación es de esta materia específica
        const isSubjectGrade = g.subjectId === subject.firestoreId;
        return hasBoletin && isSubjectGrade;
      });

      const averageGrade = subjectGrades.length > 0 
        ? subjectGrades.reduce((sum, g) => sum + g.valor, 0) / subjectGrades.length 
        : 0;

      // Buscar el profesor de la materia
      const teacher = teachers.find((t: Teacher) => t.firestoreId === subject.teacherId);
      const teacherName = teacher ? `${teacher.nombre} ${teacher.apellido}` : "No asignado";

      return {
        subjectId: subject.firestoreId,
        subjectName: subject.nombre,
        teacherName,
        boletinCount: subjectBoletines.length,
        averageGrade,
        gradeCount: subjectGrades.length,
        performanceLevel: averageGrade >= 8 ? "excelente" : 
                        averageGrade >= 7 ? "bueno" : 
                        averageGrade >= 6 ? "promedio" : 
                        averageGrade >= 4 ? "bajo" : "insuficiente"
      };
    });

    // 3. Detección de Patrones Inteligentes
    const intelligentPatterns = {
      // Estudiantes con mejor rendimiento
      topPerformers: filteredBoletines
        .filter(b => b.promedioTotal >= 8)
        .sort((a, b) => b.promedioTotal - a.promedioTotal)
        .slice(0, 5)
        .map(b => ({
          studentId: b.alumnoId,
          studentName: b.alumnoNombre,
          promedio: b.promedioTotal,
          periodo: b.periodo,
          observacion: b.observacionAutomatica?.texto || "Sin observación automática"
        })),

      // Estudiantes que necesitan apoyo
      needsSupport: filteredBoletines
        .filter(b => b.promedioTotal < 6)
        .sort((a, b) => a.promedioTotal - b.promedioTotal)
        .slice(0, 5)
        .map(b => ({
          studentId: b.alumnoId,
          studentName: b.alumnoNombre,
          promedio: b.promedioTotal,
          periodo: b.periodo,
          observacion: b.observacionAutomatica?.texto || "Sin observación automática",
          priority: b.promedioTotal < 4 ? "alta" : "media"
        })),

      // Tendencias por materia
      subjectTrends: subjectAnalysis.map(subject => {
        const trend = subject.averageGrade > 7 ? "positiva" : 
                     subject.averageGrade > 5 ? "estable" : "negativa";
        
        return {
          ...subject,
          trend,
          recommendation: trend === "negativa" ? "Requiere intervención pedagógica" :
                         trend === "estable" ? "Mantener estrategias actuales" :
                         "Continuar con excelente trabajo"
        };
      })
    };

    // 4. Generación de Explicaciones Inteligentes
    const intelligentExplanations = {
      // Explicaciones por nivel de rendimiento
      performanceExplanations: {
        excellent: {
          title: "Rendimiento Excepcional",
          description: "El estudiante demuestra un dominio excepcional de los contenidos. Su dedicación y esfuerzo son evidentes en todos los aspectos académicos.",
          recommendations: [
            "Mantener el alto nivel de compromiso",
            "Explorar oportunidades de enriquecimiento académico",
            "Considerar participación en actividades de liderazgo"
          ],
          icon: Award,
          color: "text-green-600"
        },
        good: {
          title: "Buen Rendimiento",
          description: "El estudiante mantiene un rendimiento sólido y consistente. Sus logros académicos reflejan un buen trabajo y dedicación.",
          recommendations: [
            "Continuar con las estrategias de estudio actuales",
            "Identificar áreas específicas para mejorar",
            "Mantener la motivación y el esfuerzo"
          ],
          icon: TrendingUp,
          color: "text-blue-600"
        },
        average: {
          title: "Rendimiento Promedio",
          description: "El estudiante cumple con los objetivos básicos. Hay oportunidades para mejorar con estrategias específicas de apoyo.",
          recommendations: [
            "Implementar técnicas de estudio más efectivas",
            "Buscar apoyo académico adicional",
            "Establecer metas específicas de mejora"
          ],
          icon: BarChart3,
          color: "text-yellow-600"
        },
        belowAverage: {
          title: "Rendimiento Bajo",
          description: "El estudiante enfrenta dificultades académicas que requieren atención inmediata. Se necesita intervención pedagógica específica.",
          recommendations: [
            "Implementar plan de apoyo académico intensivo",
            "Coordinar con especialistas en aprendizaje",
            "Involucrar a la familia en el proceso educativo"
          ],
          icon: AlertCircle,
          color: "text-orange-600"
        },
        poor: {
          title: "Rendimiento Insuficiente",
          description: "El estudiante requiere intervención urgente. Es fundamental identificar las causas y establecer un plan de acción inmediato.",
          recommendations: [
            "Evaluación psicopedagógica urgente",
            "Plan de recuperación académica intensivo",
            "Seguimiento diario del progreso"
          ],
          icon: AlertTriangle,
          color: "text-red-600"
        }
      }
    };

    return {
      general: generalAnalysis,
      subjects: subjectAnalysis,
      patterns: intelligentPatterns,
      explanations: intelligentExplanations
    };
  }, [students, courses, subjects, attendances, grades, boletines, alerts, teachers, selectedStudent, selectedPeriod, selectedCourse]);

  // Estados de carga

  if ((loadingStudents || loadingCourses || loadingSubjects || 
      loadingAttendances || loadingGrades || loadingBoletines || loadingAlerts || loadingTeachers) || user?.role === undefined) {
    return (
      <LoadingState 
        text="Analizando boletines con IA..."
        timeout={15000}
        timeoutMessage="El análisis está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Permitir también a alumnos; sin guard de acceso
  if (!analysis || !boletines || boletines.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No hay datos disponibles"
        description="No se encontraron boletines suficientes para generar explicaciones inteligentes"
      />
    );
  }

  const handleViewExplanation = (boletin: Boletin) => {
    setSelectedBoletin(boletin);
    setShowExplanationModal(true);
  };


  const handleExportExplanation = (type: string) => {
    try {
      const exportData = {
        type,
        timestamp: new Date().toISOString(),
        analysis,
        user: user?.email,
        role: user?.role
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `explicacion_boletines_${type}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Explicación ${type} exportada exitosamente`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar la explicación');
    }
  };

  const handleGenerateExplanations = async () => {
    if (!boletines || boletines.length === 0) {
      toast.error('No hay boletines disponibles para generar explicaciones');
      return;
    }

    setIsGeneratingExplanations(true);
    
    try {
      // Filtrar boletines que no tienen observación automática
      const boletinesSinExplicacion = boletines.filter(boletin => 
        !boletin.observacionAutomatica || !boletin.observacionAutomatica.texto
      );

      if (boletinesSinExplicacion.length === 0) {
        toast.success('Todos los boletines ya tienen explicaciones generadas');
        setIsGeneratingExplanations(false);
        return;
      }

      let generatedCount = 0;
      
      // Generar explicaciones para boletines que no las tienen
      for (const boletin of boletinesSinExplicacion.slice(0, 10)) { // Limitar a 10 para demo
        const performanceLevel = getPerformanceLevel(boletin.promedioTotal);
        
        // Generar explicación basada en el rendimiento
        const explanation = generateExplanationForBoletin(boletin, performanceLevel);
        
        try {
          // Actualizar en Firestore
          const boletinRef = doc(db, "boletines", boletin.firestoreId);
          await updateDoc(boletinRef, {
            observacionAutomatica: explanation,
            fechaGeneracion: new Date().toISOString()
          });
          
          generatedCount++;
          
          // Simular delay para mostrar progreso
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error al actualizar boletín ${boletin.firestoreId}:`, error);
        }
      }

      toast.success(`Se generaron ${generatedCount} explicaciones automáticamente`);
      
      // Recargar datos después de un breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error al generar explicaciones:', error);
      toast.error('Error al generar explicaciones automáticas');
    } finally {
      setIsGeneratingExplanations(false);
    }
  };

  const generateExplanationForBoletin = (boletin: Boletin, performanceLevel: string) => {
    const explanations = {
      excellent: {
        tipo: "rendimiento_excepcional",
        texto: `${boletin.alumnoNombre} demuestra un rendimiento excepcional con un promedio de ${boletin.promedioTotal.toFixed(1)}. Su dedicación y esfuerzo son evidentes en todas las materias. Se recomienda mantener este alto nivel de compromiso académico.`,
        prioridad: "baja",
        reglaAplicada: "promedio_superior_a_9",
        datosSoporte: {
          promedio: boletin.promedioTotal,
          materiasCount: boletin.materias.length,
          asistencias: boletin.asistenciasTotales
        }
      },
      good: {
        tipo: "rendimiento_bueno",
        texto: `${boletin.alumnoNombre} mantiene un buen rendimiento académico con un promedio de ${boletin.promedioTotal.toFixed(1)}. Sus logros reflejan un trabajo consistente y dedicación. Se sugiere continuar con las estrategias de estudio actuales.`,
        prioridad: "media",
        reglaAplicada: "promedio_entre_7_y_9",
        datosSoporte: {
          promedio: boletin.promedioTotal,
          materiasCount: boletin.materias.length,
          asistencias: boletin.asistenciasTotales
        }
      },
      average: {
        tipo: "rendimiento_promedio",
        texto: `${boletin.alumnoNombre} cumple con los objetivos básicos con un promedio de ${boletin.promedioTotal.toFixed(1)}. Hay oportunidades de mejora implementando técnicas de estudio más efectivas y buscando apoyo académico adicional.`,
        prioridad: "media",
        reglaAplicada: "promedio_entre_6_y_7",
        datosSoporte: {
          promedio: boletin.promedioTotal,
          materiasCount: boletin.materias.length,
          asistencias: boletin.asistenciasTotales
        }
      },
      belowAverage: {
        tipo: "rendimiento_bajo",
        texto: `${boletin.alumnoNombre} enfrenta dificultades académicas con un promedio de ${boletin.promedioTotal.toFixed(1)}. Se requiere intervención pedagógica específica e implementar un plan de apoyo académico intensivo.`,
        prioridad: "alta",
        reglaAplicada: "promedio_entre_4_y_6",
        datosSoporte: {
          promedio: boletin.promedioTotal,
          materiasCount: boletin.materias.length,
          asistencias: boletin.asistenciasTotales
        }
      },
      poor: {
        tipo: "rendimiento_insuficiente",
        texto: `${boletin.alumnoNombre} requiere intervención urgente con un promedio de ${boletin.promedioTotal.toFixed(1)}. Es fundamental identificar las causas y establecer un plan de acción inmediato con evaluación psicopedagógica.`,
        prioridad: "crítica",
        reglaAplicada: "promedio_menor_a_4",
        datosSoporte: {
          promedio: boletin.promedioTotal,
          materiasCount: boletin.materias.length,
          asistencias: boletin.asistenciasTotales
        }
      }
    };

    return explanations[performanceLevel as keyof typeof explanations] || explanations.average;
  };

  const getPerformanceLevel = (promedio: number) => {
    if (promedio >= 9) return "excellent";
    if (promedio >= 7) return "good";
    if (promedio >= 6) return "average";
    if (promedio >= 4) return "belowAverage";
    return "poor";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Explicación Inteligente de Boletines
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <Brain className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                      {user?.role === "docente" && "Docente"}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">Sistema Educativo</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Análisis avanzado y explicaciones automáticas de rendimiento académico generadas por inteligencia artificial.
                {isGeneratingExplanations && (
                  <span className="inline-flex items-center gap-2 ml-2 text-sm text-green-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                    Generando explicaciones IA...
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 py-8">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleGenerateExplanations}
                    disabled={isGeneratingExplanations}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {isGeneratingExplanations ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar Explicaciones IA
                      </>
                    )}
                  </Button>
                  {boletines && (
                    <Badge variant="outline" className="text-xs">
                      {boletines.filter(b => !b.observacionAutomatica || !b.observacionAutomatica.texto).length} pendientes
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={() => handleExportExplanation("completa")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Análisis
                </Button>
              </div>
            </div>
          </div>

          {/* Indicadores de datos */}
          {analysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Boletines</p>
                      <p className="font-bold text-gray-900">{analysis.general.totalBoletines}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Estudiantes</p>
                      <p className="font-bold text-gray-900">{analysis.general.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Cursos</p>
                      <p className="font-bold text-gray-900">{analysis.general.totalCourses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookMarked className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Materias</p>
                      <p className="font-bold text-gray-900">{analysis.general.totalSubjects}</p>
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
            label="Total Boletines"
            value={analysis.general.totalBoletines}
            icon={BookOpen}
            subtitle="Analizados por IA"
          />
          <StatsCard
            label="Excelente Rendimiento"
            value={analysis.general.performanceStats.excellent}
            icon={Award}
            color="green"
            subtitle="Promedio ≥ 9"
          />
          <StatsCard
            label="Necesitan Apoyo"
            value={analysis.general.performanceStats.belowAverage + analysis.general.performanceStats.poor}
            icon={AlertCircle}
            color="red"
            subtitle="Promedio < 6"
          />
          <StatsCard
            label="Materias Analizadas"
            value={analysis.subjects.length}
            icon={BookMarked}
            color="blue"
            subtitle="Con IA"
          />
        </div>

        {/* Filtros (ocultos para alumno) */}
        {!isAlumno && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Estudiante</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estudiantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estudiantes</SelectItem>
                  {students?.map(student => (
                    <SelectItem key={student.firestoreId} value={student.firestoreId}>
                      {student.nombre} {student.apellido}
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
                  {Object.keys(analysis.general.periodAnalysis).map(period => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
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
          </div>
        </div>
        )}

        {/* Secciones de Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Mejores Rendimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {analysis.patterns.topPerformers.length > 0 ? (
                  analysis.patterns.topPerformers.map((student, index) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-xs text-gray-600">{student.periodo}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        {student.promedio.toFixed(1)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-gray-50 rounded-lg text-center">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No hay estudiantes destacados</h4>
                    <p className="text-xs text-gray-500">No se encontraron estudiantes con rendimiento excelente</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => handleExportExplanation("top_performers")}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Análisis
              </Button>
            </CardContent>
          </Card>

          {/* Necesitan Apoyo */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Necesitan Apoyo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {analysis.patterns.needsSupport.length > 0 ? (
                  analysis.patterns.needsSupport.map((student, index) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-red-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-xs text-gray-600">{student.periodo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {student.promedio.toFixed(1)}
                        </Badge>
                        <Badge variant={student.priority === 'alta' ? 'destructive' : 'secondary'}>
                          {student.priority}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-gray-50 rounded-lg text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No hay estudiantes que necesiten apoyo</h4>
                    <p className="text-xs text-gray-500">Todos los estudiantes tienen buen rendimiento</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => handleExportExplanation("needs_support")}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Análisis
              </Button>
            </CardContent>
          </Card>

          {/* Análisis por Materia */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-blue-600" />
                Análisis por Materia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {analysis.patterns.subjectTrends.length > 0 ? (
                  analysis.patterns.subjectTrends.map((subject) => (
                    <div key={subject.subjectId} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{subject.subjectName}</span>
                        <Badge variant={
                          subject.trend === "positiva" ? "default" :
                          subject.trend === "estable" ? "secondary" : "destructive"
                        }>
                          {subject.trend}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Promedio: {subject.averageGrade.toFixed(1)}</span>
                        <span className="text-gray-600">Prof: {subject.teacherName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{subject.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-gray-50 rounded-lg text-center">
                    <BookMarked className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No hay análisis de materias</h4>
                    <p className="text-xs text-gray-500">No se encontraron materias con datos suficientes</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => handleExportExplanation("subject_analysis")}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Análisis
              </Button>
            </CardContent>
          </Card>

          {/* Correlación Asistencia-Rendimiento */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Asistencia vs Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {(() => {
                  const filteredBoletines = boletines?.filter(boletin => {
                    const studentMatch = selectedStudent === "all" || boletin.alumnoId === selectedStudent;
                    const periodMatch = selectedPeriod === "all" || boletin.periodo === selectedPeriod;
                    const courseMatch = selectedCourse === "all" || boletin.curso === selectedCourse;
                    return studentMatch && periodMatch && courseMatch;
                  }) || [];

                  if (filteredBoletines.length > 0) {
                    return filteredBoletines.slice(0, 5).map((boletin: Boletin) => {
                      // Calcular porcentaje de asistencia
                      const studentAttendances = attendances?.filter(a => a.studentId === boletin.alumnoId) || [];
                      const totalDays = studentAttendances.length;
                      const presentDays = studentAttendances.filter(a => a.present).length;
                      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
                      
                      // Determinar correlación
                      let correlation = "neutral";
                      if (boletin.promedioTotal >= 7 && attendancePercentage >= 80) {
                        correlation = "positiva";
                      } else if (boletin.promedioTotal < 6 && attendancePercentage < 70) {
                        correlation = "negativa";
                      }
                      
                      return (
                        <div key={boletin.firestoreId} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{boletin.alumnoNombre}</span>
                            <Badge variant={
                              correlation === "positiva" ? "default" :
                              correlation === "negativa" ? "destructive" : "secondary"
                            }>
                              {correlation}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Promedio: {boletin.promedioTotal.toFixed(1)}</span>
                            <span className="text-gray-600">Asistencia: {attendancePercentage.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {correlation === "positiva" ? "Buena correlación entre asistencia y rendimiento" :
                             correlation === "negativa" ? "Baja asistencia afecta el rendimiento" :
                             "Correlación moderada"}
                          </p>
                        </div>
                      );
                    });
                  } else {
                    return (
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <h4 className="text-sm font-medium text-gray-900 mb-1">No hay datos de correlación</h4>
                        <p className="text-xs text-gray-500">No se encontraron boletines con datos de asistencia</p>
                      </div>
                    );
                  }
                })()}
              </div>
              
              <Button 
                onClick={() => handleExportExplanation("attendance_correlation")}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Análisis
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Boletines */}
        <div className="mt-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Boletines Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const filteredBoletines = boletines?.filter(boletin => {
                    const studentMatch = selectedStudent === "all" || boletin.alumnoId === selectedStudent;
                    const periodMatch = selectedPeriod === "all" || boletin.periodo === selectedPeriod;
                    const courseMatch = selectedCourse === "all" || boletin.curso === selectedCourse;
                    return studentMatch && periodMatch && courseMatch;
                  }) || [];

                  if (filteredBoletines.length > 0) {
                    return filteredBoletines.slice(0, 9).map((boletin: Boletin) => {
                      const performanceLevel = getPerformanceLevel(boletin.promedioTotal);
                      const explanation = analysis.explanations.performanceExplanations[performanceLevel];
                      
                      return (
                        <div key={boletin.firestoreId} className="p-4 border rounded-lg hover:shadow-md transition-all bg-white/60 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{boletin.alumnoNombre}</h4>
                            <Badge variant={
                              performanceLevel === "excellent" ? "default" :
                              performanceLevel === "good" ? "secondary" :
                              performanceLevel === "average" ? "outline" :
                              performanceLevel === "belowAverage" ? "destructive" : "destructive"
                            }>
                              {boletin.promedioTotal.toFixed(1)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            <p className="text-sm text-gray-600">{explanation.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{boletin.periodo}</span>
                              <BookMarked className="h-3 w-3" />
                              <span>{boletin.materias.length} materias</span>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => handleViewExplanation(boletin)}
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Explicación IA
                          </Button>
                        </div>
                      );
                    });
                  } else {
                    return (
                      <div className="col-span-full p-8 text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay boletines disponibles</h3>
                        <p className="text-gray-600 mb-4">
                          Los filtros aplicados no muestran resultados. Intenta ajustar los filtros o agregar más boletines.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedStudent("all");
                              setSelectedPeriod("all");
                              setSelectedCourse("all");
                            }}
                          >
                            Limpiar Filtros
                          </Button>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Explicación Detallada */}
      <ReutilizableDialog
        open={showExplanationModal}
        onOpenChange={setShowExplanationModal}
        title={selectedBoletin ? `Explicación IA - ${selectedBoletin.alumnoNombre}` : 'Explicación Inteligente'}
        description="Análisis detallado generado por inteligencia artificial"
        small={false}
        content={
          selectedBoletin ? (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Información General</h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estudiante:</span>
                      <span className="text-sm font-medium">{selectedBoletin.alumnoNombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Período:</span>
                      <span className="text-sm font-medium">{selectedBoletin.periodo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Promedio:</span>
                      <span className="text-sm font-medium">{selectedBoletin.promedioTotal.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Análisis IA</h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nivel:</span>
                      <Badge variant={
                        getPerformanceLevel(selectedBoletin.promedioTotal) === "excellent" ? "default" :
                        getPerformanceLevel(selectedBoletin.promedioTotal) === "good" ? "secondary" :
                        getPerformanceLevel(selectedBoletin.promedioTotal) === "average" ? "outline" :
                        "destructive"
                      }>
                        {getPerformanceLevel(selectedBoletin.promedioTotal)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Materias:</span>
                      <span className="text-sm font-medium">{selectedBoletin.materias.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asistencias:</span>
                      <span className="text-sm font-medium">{selectedBoletin.asistenciasTotales}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explicación IA */}
              {selectedBoletin.observacionAutomatica && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">Análisis Inteligente</h4>
                    <Badge variant="secondary">{selectedBoletin.observacionAutomatica.prioridad}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{selectedBoletin.observacionAutomatica.texto}</p>
                  <p className="text-xs text-gray-600">
                    Regla aplicada: {selectedBoletin.observacionAutomatica.reglaAplicada}
                  </p>
                </div>
              )}

              {/* Análisis por Materia */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Análisis por Materia</h4>
                <div className="space-y-3">
                  {selectedBoletin.materias && selectedBoletin.materias.length > 0 ? (
                    selectedBoletin.materias.map((materia, index) => {
                      // Calcular promedio solo si hay calificaciones válidas
                      const calificaciones = [materia.T1, materia.T2, materia.T3].filter(cal => cal > 0);
                      const promedioMateria = calificaciones.length > 0 
                        ? calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length 
                        : 0;
                      
                      // Determinar tendencia solo si hay datos suficientes
                      let tendencia = "sin datos";
                      if (materia.T1 > 0 && materia.T3 > 0) {
                        if (materia.T3 > materia.T1 + 0.5) {
                          tendencia = "mejora";
                        } else if (materia.T3 < materia.T1 - 0.5) {
                          tendencia = "disminuye";
                        } else {
                          tendencia = "estable";
                        }
                      }
                      
                      return (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{materia.nombre}</span>
                            <Badge variant={
                              promedioMateria >= 7 ? "default" :
                              promedioMateria >= 6 ? "secondary" : "destructive"
                            }>
                              {promedioMateria > 0 ? promedioMateria.toFixed(1) : "Sin calificaciones"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <span className="text-gray-600">T1</span>
                              <div className="font-medium">{materia.T1 > 0 ? materia.T1 : "-"}</div>
                            </div>
                            <div className="text-center">
                              <span className="text-gray-600">T2</span>
                              <div className="font-medium">{materia.T2 > 0 ? materia.T2 : "-"}</div>
                            </div>
                            <div className="text-center">
                              <span className="text-gray-600">T3</span>
                              <div className="font-medium">{materia.T3 > 0 ? materia.T3 : "-"}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Tendencia: <span className="font-medium">{tendencia}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 bg-gray-50 rounded-lg text-center">
                      <BookMarked className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-sm font-medium text-gray-900 mb-1">No hay materias registradas</h4>
                      <p className="text-xs text-gray-500">Este boletín no contiene información de materias</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recomendaciones IA */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recomendaciones IA</h4>
                <div className="space-y-2">
                  {analysis.explanations.performanceExplanations[getPerformanceLevel(selectedBoletin.promedioTotal)]?.recommendations?.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  )) || (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Lightbulb className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">No hay recomendaciones disponibles</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontró información del boletín</p>
            </div>
          )
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExplanationModal(false)}
              className="px-6"
            >
              Cerrar
            </Button>
            <Button 
              onClick={() => handleExportExplanation("detallada")}
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