import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useMemo, useState, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  TrendingUp, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Clock, 
  Users, 
  Award, 
  BarChart3, 
  Filter,
  Eye,
  Plus,
  Sparkles,
  Target,
  GraduationCap
} from 'lucide-react';

import { DataTable } from "@/components/data-table";
import { useColumnsDetalle } from "@/app/calificaciones/columns";
import { StatsCard } from "@/components/StatCards";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/context/AuthContext";
import CrearCalificacion from "@/components/CalificacioneslForm";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";

// Tipos TypeScript
interface GradeDistribution {
  excellent: number;
  good: number;
  needsImprovement: number;
  total: number;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  averageGrade: number;
  totalGrades: number;
  lastGrade: number;
  trend: 'up' | 'down' | 'stable';
}

export default function DetallesCalificaciones() {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [id] = useState(searchParams.get("id") || "");
    const { data: courses } = useFirestoreCollection("courses");
    const { data: students } = useFirestoreCollection("students");
    const { data: subjects } = useFirestoreCollection("subjects");
    const { data: teachers } = useFirestoreCollection("teachers")
    const { data: calificaciones, loading = false } = useFirestoreCollection("calificaciones");
    const [endDate, setEndDate] = useState<Date>();
    const [startDate, setStartDate] = useState<Date>();
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<"table" | "analytics" | "add">("table");

    const course = useMemo(() => {
        if (user?.role === "admin" && id) {
            return courses.find(c => c.firestoreId === id);
        } else if (user?.role === "docente") {
            const teacherSubjects = subjects.filter(s => s.teacherId === user.teacherId);
            
            if (id) {
                const foundCourse = courses.find(c => c.firestoreId === id);
                const hasAccess = teacherSubjects.some(s => {
                    if (Array.isArray(s.cursoId)) {
                        return s.cursoId.includes(id);
                    }
                    return s.cursoId === id;
                });
                return hasAccess ? foundCourse : null;
            } else {
                const teacherCourseIds = new Set<string>();
                teacherSubjects.forEach(s => {
                    if (Array.isArray(s.cursoId)) {
                        s.cursoId.forEach(courseId => teacherCourseIds.add(courseId));
                    } else if (s.cursoId) {
                        teacherCourseIds.add(s.cursoId);
                    }
                });
                return courses.find(c => c.firestoreId && teacherCourseIds.has(c.firestoreId));
            }
        }
        return null;
    }, [user, id, courses, students, subjects, teachers]);

    const studentsInCourse = useMemo(() => {
        return course && course.firestoreId ? students.filter(s => s.cursoId === course.firestoreId) : [];
    }, [course, students]);

    const teacherSubjectId = useMemo(() => {
        if (user?.role === "docente" && course && course.firestoreId) {
            const teacherSubjects = subjects.filter(s => s.teacherId === user.teacherId);
            const subject = teacherSubjects.find(s => {
                if (Array.isArray(s.cursoId)) {
                    return s.cursoId.includes(course.firestoreId);
                }
                return s.cursoId === course.firestoreId;
            });
            return subject?.firestoreId;
        }
        return undefined;
    }, [user, course, subjects]);

    const calificacionesFiltradas = useMemo(() => {
        return calificaciones.filter(c => {
        const student = students.find(student => student.firestoreId === c.studentId && student.cursoId === course?.firestoreId);
        if (!student) return false;
        if (user?.role === "docente" && teacherSubjectId) {
            return c.subjectId === teacherSubjectId;
        }
        return true;
        }).sort((a, b) => {
        const studentA = students.find(s => s.firestoreId === a.studentId);
        const studentB = students.find(s => s.firestoreId === b.studentId);
        return studentA?.nombre.localeCompare(studentB?.nombre);
    });
    }, [calificaciones, students, course, user, teacherSubjectId]);

    const resultado = useMemo(() => {
        return calificacionesFiltradas.map(c => {
        const materia = subjects.find(s => s.firestoreId === c.subjectId);
        const estudiante = studentsInCourse.find(s => s.firestoreId === c.studentId);

        return {
                id: c.firestoreId ?? "",
                Actividad: c.Actividad ?? "",
            Nombre: estudiante
            ? `${estudiante.nombre} ${estudiante.apellido}`
            : "—",
                Comentario: c.Comentario ?? "Sin comentario",
                Valor: c.valor,
                Materia: materia?.nombre || "—",
            fecha: c.fecha
        };
    });
    }, [calificacionesFiltradas, subjects, studentsInCourse]);

    // Get columns for the table
    const columns = useColumnsDetalle();

    // Calcular distribución de calificaciones
    const gradeDistribution = useMemo((): GradeDistribution => {
        const total = calificacionesFiltradas.length;
        if (total === 0) return { excellent: 0, good: 0, needsImprovement: 0, total: 0 };

        const excellent = calificacionesFiltradas.filter(c => c.valor >= 8).length;
        const good = calificacionesFiltradas.filter(c => c.valor >= 6 && c.valor < 8).length;
        const needsImprovement = calificacionesFiltradas.filter(c => c.valor < 6).length;

        return {
            excellent,
            good,
            needsImprovement,
            total
        };
    }, [calificacionesFiltradas]);

    // Calcular rendimiento por estudiante
    const studentPerformance = useMemo((): StudentPerformance[] => {
        const performanceMap = new Map<string, { grades: number[], name: string }>();

        calificacionesFiltradas.forEach(cal => {
            const student = studentsInCourse.find(s => s.firestoreId === cal.studentId);
            if (student) {
                const key = student.firestoreId || "";
                if (!performanceMap.has(key)) {
                    performanceMap.set(key, { grades: [], name: `${student.nombre} ${student.apellido}` });
                }
                performanceMap.get(key)!.grades.push(cal.valor);
            }
        });

        return Array.from(performanceMap.entries()).map(([studentId, data]) => {
            const average = data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length;
            const sortedGrades = [...data.grades].sort((a, b) => a - b);
            const lastGrade = sortedGrades[sortedGrades.length - 1] || 0;
            const firstGrade = sortedGrades[0] || 0;
            
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (data.grades.length >= 2) {
                if (lastGrade > firstGrade) trend = 'up';
                else if (lastGrade < firstGrade) trend = 'down';
            }

            return {
                studentId,
                studentName: data.name,
                averageGrade: average,
                totalGrades: data.grades.length,
                lastGrade,
                trend
            };
        }).sort((a, b) => b.averageGrade - a.averageGrade);
    }, [calificacionesFiltradas, studentsInCourse]);

    const exportCalificacionesToCSV = useCallback(() => {
        if (!course) return;
        // Cabeceras
        const rows = [
            ["Alumno", "Materia", "Actividad", "Valor", "Comentario", "Fecha"]
        ];

        resultado.forEach(item => {
            const raw = item.fecha;
            const dateObj = typeof raw === 'object' && raw?.toDate ? raw.toDate() : new Date(raw);
            const dateStr = dateObj.toLocaleString("es-AR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
            });

            rows.push([
            item.Nombre,
            item.Materia,
            item.Actividad,
            item.Valor.toString(),
            item.Comentario,
            dateStr
            ]);
        });

        // Prepend BOM para UTF-8
        const bom = "\uFEFF";
        const csvContent = bom + rows
            .map(row => row.map(f => `"${f.replace(/"/g, '""')}"`).join(","))
            .join("\n");

        // Crear blob con charset UTF-8
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `calificaciones_${course.nombre}_div_${course.division}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [course, resultado]);

    const averageGrade = useMemo(() => {
        if (!calificacionesFiltradas.length) return "0.00";
        const total = calificacionesFiltradas.reduce((sum: number, { valor }) => sum + (valor || 0), 0);
        return (total / calificacionesFiltradas.length).toFixed(2);
    }, [calificacionesFiltradas]);

    const [pctAprob] = useMemo(() => {
        const total = calificacionesFiltradas.length;
        if (!total) return ["0.00", "0.00"];
        const aprobCount = calificacionesFiltradas.filter(c => c.valor >= 7).length;
        const pctA = ((aprobCount / total) * 100).toFixed(2);
        const pctR = (100 - parseFloat(pctA)).toFixed(2);
        return [pctA, pctR];
    }, [calificacionesFiltradas]);

    const desapCount = useMemo(() => {
        return calificacionesFiltradas.filter((c) => c.valor <= 7).length;
    }, [calificacionesFiltradas]);

    // Opciones de filtro
    const alumnoFilterOptions = useMemo(() => {
        return studentsInCourse.map(s => ({ label: `${s.nombre} ${s.apellido}`, value: `${s.nombre} ${s.apellido}` }));
    }, [studentsInCourse]);

    const materiaOptions = useMemo(() => {
        return subjects.filter(s => s.cursoId === course?.firestoreId || "").map(s => ({ label: s.nombre, value: s.nombre }));
    }, [subjects, course]);

    // Verificar acceso denegado para docente
    if (user?.role === "docente" && id && !course) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title="Acceso Denegado"
                description="No tienes permisos para ver las calificaciones de este curso. Solo puedes acceder a los cursos donde enseñas."
                actionText="Volver a Calificaciones"
                onAction={() => window.location.href = '/app/calificaciones'}
            />
        );
    }

    // Redirigir alumno
    if (user?.role === "alumno") {
        return <Navigate to="/app/calificaciones" replace />;
    }

    if (loading) {
        return (
            <LoadingState 
                text="Cargando detalles de calificaciones..."
                timeout={8000}
                timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
            />
        );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header mejorado */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                {/* Sección Izquierda - Info del Curso */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{course?.nombre}</h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          División {course?.division}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          Año {course?.año}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Users className="h-3 w-3 mr-1" />
                          {studentsInCourse.length} Alumnos
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {/* Descripción mejorada */}
                  <div className="ml-16 space-y-2">
                    <p className="text-gray-600">
                      Gestión completa de Calificaciones y Análisis de Rendimiento
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {calificacionesFiltradas?.length || 0} Evaluaciones registradas
                      </span>
                      {calificacionesFiltradas?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Promedio: {averageGrade}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Última actualización: Hoy
                      </span>
                    </div>
                  </div>
                </div>
                {/* Sección Derecha - Acciones */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {/* Indicadores de estado */}
                  <div className="flex items-center gap-2">
                    {calificacionesFiltradas?.some(cal => cal.valor < 6) && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-red-50 rounded-full border border-red-200">
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-700 font-medium">
                          {calificacionesFiltradas.filter(cal => cal.valor < 6).length} En riesgo
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        Actualizado hoy
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={exportCalificacionesToCSV}
                      variant="outline"
                      disabled={!studentsInCourse.length}
                      className="bg-white hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" /> 
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Distribución de calificaciones */}
              {calificacionesFiltradas?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Excelente (8-10)</span>
                          <span className="text-sm font-bold text-green-600">
                            {gradeDistribution.excellent}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                            style={{
                              width: `${(gradeDistribution.excellent / gradeDistribution.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Bueno (6-7.9)</span>
                          <span className="text-sm font-bold text-yellow-600">
                            {gradeDistribution.good}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                            style={{
                              width: `${(gradeDistribution.good / gradeDistribution.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Necesita mejorar (&lt;6)</span>
                          <span className="text-sm font-bold text-red-600">
                            {gradeDistribution.needsImprovement}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                            style={{
                              width: `${(gradeDistribution.needsImprovement / gradeDistribution.total) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              label="Promedio general"
              icon={TrendingUp}
              value={averageGrade}
              color="blue"
            />
            <StatsCard
              label="Total de evaluaciones"
              icon={ClipboardList}
              value={calificacionesFiltradas.length}
              color="purple"
            />
            <StatsCard
              label="Tasa de aprobación"
              icon={CheckCircle2}
              value={`${pctAprob}%`}
              color="green"
            />
            <StatsCard
              label="Alumnos en riesgo"
              icon={AlertTriangle}
              value={desapCount}
              color="red"
            />
          </div>

          {/* Navegación por tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeView === "table" ? "default" : "outline"}
              onClick={() => setActiveView("table")}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Tabla de Calificaciones
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "outline"}
              onClick={() => setActiveView("analytics")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Análisis
            </Button>
            {user?.role === "docente" && teacherSubjectId && (
              <Button
                variant={activeView === "add" ? "default" : "outline"}
                onClick={() => setActiveView("add")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Calificación
              </Button>
            )}
          </div>

          {/* Contenido según vista activa */}
          <div className="animate-in fade-in-50 duration-500">
            {activeView === "table" && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      Evaluaciones Registradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable 
                      columns={columns}
                      data={resultado}
                      filters={[
                        {
                          type: "select",
                          columnId: "Nombre",
                          label: "Alumno",
                          options: alumnoFilterOptions
                        },
                        {
                          type: "select",
                          columnId: "Materia",
                          label: "Materia",
                          options: materiaOptions,
                          onClick: t => t.getColumn("Materia")?.setFilterValue(true)
                        },
                        {
                          type: "button",
                          label: "Aprobados",
                          onClick: table =>
                            table.getColumn("Valor")?.setFilterValue("Aprobados"),
                        },
                        {
                          type: "button",
                          label: "Desaprobados",
                          onClick: table =>
                            table.getColumn("Valor")?.setFilterValue("Desaprobados"),
                        },
                        {
                          type: "custom",
                          element: table => (
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    data-empty={!startDate}
                                    className="w-40 text-left"
                                  >
                                    <CalendarIcon />
                                    {startDate ? format(startDate, "PPP", { locale: es }) : "Desde"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                  <Calendar
                                    mode="single"
                                    selected={startDate}
                                    toDate={endDate}
                                    onSelect={date => {
                                      if (endDate && date && date > endDate) {
                                        setStartDate(date);
                                        setEndDate(date);
                                        if (date) {
                                          table
                                            .getColumn("fecha")
                                            ?.setFilterValue([
                                              format(date, "yyyy-MM-dd"),
                                              format(date, "yyyy-MM-dd"),
                                            ]);
                                        }
                                      } else {
                                        setStartDate(date);
                                        if (date && endDate) {
                                          table
                                            .getColumn("fecha")
                                            ?.setFilterValue([
                                              format(date, "yyyy-MM-dd"),
                                              format(endDate, "yyyy-MM-dd"),
                                            ]);
                                        }
                                      }
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    data-empty={!endDate}
                                    className="w-40 text-left"
                                  >
                                    <CalendarIcon />
                                    {endDate ? format(endDate, "PPP", { locale: es }) : "Hasta"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                  <Calendar
                                    mode="single"
                                    selected={endDate}
                                    fromDate={startDate}
                                    onSelect={date => {
                                      if (startDate && date && date < startDate) {
                                        setEndDate(date);
                                        setStartDate(date);
                                        if (date) {
                                          table
                                            .getColumn("fecha")
                                            ?.setFilterValue([
                                              format(date, "yyyy-MM-dd"),
                                              format(date, "yyyy-MM-dd"),
                                            ]);
                                        }
                                      } else {
                                        setEndDate(date);
                                        if (startDate && date) {
                                          table
                                            .getColumn("fecha")
                                            ?.setFilterValue([
                                              format(startDate, "yyyy-MM-dd"),
                                              format(date, "yyyy-MM-dd"),
                                            ]);
                                        }
                                      }
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          )
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "analytics" && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Rendimiento por estudiante */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Rendimiento por Estudiante
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {studentPerformance.map((student, index) => (
                          <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.studentName}</p>
                                <p className="text-sm text-gray-600">{student.totalGrades} evaluaciones</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{student.averageGrade.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Promedio</p>
                              </div>
                              <div className={`p-2 rounded-full ${
                                student.trend === 'up' ? 'bg-green-100' : 
                                student.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                              }`}>
                                <TrendingUp className={`h-4 w-4 ${
                                  student.trend === 'up' ? 'text-green-600' : 
                                  student.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estadísticas adicionales */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Estadísticas Avanzadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{averageGrade}</div>
                          <div className="text-sm text-gray-600">Promedio General</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{pctAprob}%</div>
                            <div className="text-sm text-gray-600">Aprobación</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{desapCount}</div>
                            <div className="text-sm text-gray-600">En Riesgo</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeView === "add" && user?.role === "docente" && teacherSubjectId && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      Agregar Nueva Calificación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                      <CrearCalificacion
                        studentsInCourse={studentsInCourse as any}
                        selectedStudentIds={selectedStudentIds}
                        setSelectedStudentIds={setSelectedStudentIds}
                        subjectId={teacherSubjectId}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    );
}
