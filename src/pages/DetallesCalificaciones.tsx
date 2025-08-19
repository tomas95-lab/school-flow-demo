import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useMemo, useState, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Clock, 
  Users, 
  BarChart3, 
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
// import CrearCalificacion from "@/components/CalificacioneslForm";
import InlineGradeForm from "@/components/InlineGradeForm";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import type { DocumentData } from "firebase/firestore";
import { where } from "firebase/firestore";

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

interface Course extends DocumentData {
  firestoreId?: string;
  nombre: string;
  division: string;
  año: string;
}

interface Student extends DocumentData {
  firestoreId?: string;
  nombre: string;
  apellido: string;
  cursoId: string;
}

interface Subject extends DocumentData {
  firestoreId?: string;
  nombre: string;
  cursoId: string;
}

interface TeacherSubject extends DocumentData {
  firestoreId?: string;
  cursoId: string | string[];
}

interface Calificacion extends DocumentData {
  firestoreId?: string;
  studentId: string;
  subjectId: string;
  Actividad: string;
  Comentario: string;
  valor: number;
  fecha: any;
}

export default function DetallesCalificaciones() {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [id] = useState(searchParams.get("id") || "");
    const { data: courses } = useFirestoreCollection<Course>("courses");
    const { data: students } = useFirestoreCollection<Student>("students");
    const { data: subjects } = useFirestoreCollection<Subject>("subjects");
    const { data: teachers } = useFirestoreCollection<DocumentData>("teachers");
    const { data: calificaciones, loading = false } = useFirestoreCollection<Calificacion>("calificaciones");
    const [endDate, setEndDate] = useState<Date>();
    const [startDate, setStartDate] = useState<Date>();
    // const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<"table" | "analytics" | "add">("table");

    // Legacy: obtener cursoId desde teachers (permite acceso por curso asignado antiguo)
    const teacherSubjects = useMemo((): TeacherSubject[] => {
        if (user?.role === "docente" && teachers) {
            return teachers.filter((teacher: DocumentData) => teacher.firestoreId === user.teacherId) as TeacherSubject[];
        }
        return [];
    }, [user, teachers]);

    console.log(id)
    // Materias reales del docente (desde subjects)
    const subjectsForTeacher = useMemo(() => {
        if (user?.role !== "docente") return [] as Subject[];
        return (subjects || []).filter((s: Subject) => (s as any).teacherId === user?.teacherId);
    }, [subjects, user]);

    // Precompute teacher course ids for access checks
    const teacherCourseIds = useMemo(() => {
        const ids = new Set<string>();
        teacherSubjects.forEach((s: TeacherSubject) => {
            if (Array.isArray(s.cursoId)) {
                s.cursoId.forEach((courseId: string) => courseId && ids.add(courseId));
            } else if (s.cursoId) {
                ids.add(s.cursoId);
            }
        });
        return ids;
    }, [teacherSubjects]);

    const course = useMemo((): Course | null => {
        if (user?.role === "admin" && id) {
            return courses.find((c: Course) => c.firestoreId === id) || null;
        } else if (user?.role === "docente") {
            if (id) {
                const foundCourse = courses.find((c: Course) => c.firestoreId === id) || null;
                // Acceso: permitir si el curso es del docente por teacherId o está en sus cursoId (legacy)
                const ownsByTeacherId = foundCourse?.teacherId === user.teacherId;
                const hasAccess = ownsByTeacherId || teacherCourseIds.has(id);
                return hasAccess ? foundCourse : null;
            } else {
                return courses.find((c: Course) => c.firestoreId && teacherCourseIds.has(c.firestoreId)) || null;
            }
        }
        return null;
    }, [user, id, courses, students, subjects, teachers, teacherSubjects, teacherCourseIds]);

    // Cargar alumnos del curso con queries específicas (ambos campos: cursoId y courseId)
    const { data: studentsByCurso } = useFirestoreCollection<Student>("students", {
        constraints: course?.firestoreId ? [where('cursoId', '==', id)] : [],
        enableCache: true,
        dependencies: [course?.firestoreId]
    });
    const { data: studentsByCourse } = useFirestoreCollection<Student>("students", {
        constraints: course?.firestoreId ? [where('courseId', '==', course.firestoreId)] : [],
        enableCache: true,
        dependencies: [course?.firestoreId]
    });

    const studentsInCourse = useMemo((): Student[] => {
        if (!course || !course.firestoreId) return [];
        // Preferir resultados directos; merge y únicos
        const mergedMap = new Map<string, Student>();
        [...(studentsByCurso || []), ...(studentsByCourse || [])].forEach((s: any) => {
            if (s?.firestoreId) mergedMap.set(s.firestoreId, s);
        });
        const merged = Array.from(mergedMap.values());
        if (merged.length > 0) return merged as Student[];
        // Fallback a filtro local de la colección completa
        return (students || []).filter((s: any) => {
            const cid = (s.cursoId || s.courseId || "").toString().trim();
            return cid === course.firestoreId;
        }) as Student[];
    }, [course, students, studentsByCurso, studentsByCourse]);

    const teacherSubjectId = useMemo((): string | undefined => {
        if (user?.role === "docente" && course && course.firestoreId) {
            const subject = subjectsForTeacher.find((s: any) => {
                if (Array.isArray(s.cursoId)) return s.cursoId.includes(course.firestoreId!);
                return s.cursoId === course.firestoreId;
            });
            return subject?.firestoreId;
        }
        return undefined;
    }, [user, course, subjectsForTeacher]);

    const calificacionesFiltradas = useMemo((): Calificacion[] => {
        return calificaciones.filter((c: Calificacion) => {
        const student = students.find((student: Student) => student.firestoreId === c.studentId && student.cursoId === course?.firestoreId);
        if (!student) return false;
        if (user?.role === "docente" && teacherSubjectId) {
            return c.subjectId === teacherSubjectId;
        }
        return true;
        }).sort((a: Calificacion, b: Calificacion) => {
        const studentA = students.find((s: Student) => s.firestoreId === a.studentId);
        const studentB = students.find((s: Student) => s.firestoreId === b.studentId);
        return (studentA?.nombre || "").localeCompare(studentB?.nombre || "");
    });
    }, [calificaciones, students, course, user, teacherSubjectId]);

    const resultado = useMemo(() => {
        return calificacionesFiltradas.map((c: Calificacion) => {
        const materia = subjects.find((s: Subject) => s.firestoreId === c.subjectId);
        const estudiante = studentsInCourse.find((s: Student) => s.firestoreId === c.studentId);

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

        const excellent = calificacionesFiltradas.filter((c: Calificacion) => c.valor >= 8).length;
        const good = calificacionesFiltradas.filter((c: Calificacion) => c.valor >= 6 && c.valor < 8).length;
        const needsImprovement = calificacionesFiltradas.filter((c: Calificacion) => c.valor < 6).length;

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

        calificacionesFiltradas.forEach((cal: Calificacion) => {
            const student = studentsInCourse.find((s: Student) => s.firestoreId === cal.studentId);
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

        resultado.forEach((item: any) => {
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
        const total = calificacionesFiltradas.reduce((sum: number, { valor }: Calificacion) => sum + (valor || 0), 0);
        return (total / calificacionesFiltradas.length).toFixed(2);
    }, [calificacionesFiltradas]);

    const [pctAprob] = useMemo(() => {
        const total = calificacionesFiltradas.length;
        if (!total) return ["0.00", "0.00"];
        const aprobCount = calificacionesFiltradas.filter((c: Calificacion) => c.valor >= 7).length;
        const pctA = ((aprobCount / total) * 100).toFixed(2);
        const pctR = (100 - parseFloat(pctA)).toFixed(2);
        return [pctA, pctR];
    }, [calificacionesFiltradas]);

    const desapCount = useMemo(() => {
        return calificacionesFiltradas.filter((c: Calificacion) => c.valor <= 7).length;
    }, [calificacionesFiltradas]);

    // Opciones de filtro
    const alumnoFilterOptions = useMemo(() => {
        return studentsInCourse.map((s: Student) => ({ label: `${s.nombre} ${s.apellido}`, value: `${s.nombre} ${s.apellido}` }));
    }, [studentsInCourse]);

    const materiaOptions = useMemo(() => {
        return subjects.filter((s: Subject) => s.cursoId === course?.firestoreId || "").map((s: Subject) => ({ label: s.nombre, value: s.nombre }));
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
        <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Header mejorado */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between gap-3 sm:gap-4 lg:gap-6">
                {/* Sección Izquierda - Info del Curso */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{course?.nombre}</h1>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 shrink-0">
                          División {course?.division}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 shrink-0">
                          Año {course?.año}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 shrink-0">
                          <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 shrink-0" />
                          <span className="truncate">{studentsInCourse.length} <span className="hidden xs:inline">Alumnos</span><span className="xs:hidden">Est.</span></span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
            {user?.role === "docente" && (
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
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

            {activeView === "add" && user?.role === "docente" && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <InlineGradeForm courseId={course?.firestoreId || ""} students={studentsInCourse as any} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
}
