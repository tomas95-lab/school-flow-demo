import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useMemo, useState, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, ClipboardList, CheckCircle2, AlertTriangle, Download, Clock } from 'lucide-react';

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
import { AuthContext } from "@/context/AuthContext";
import CrearCalificacion from "@/components/CalificacioneslForm";
import { LoadingState } from "@/components/LoadingState";

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-white p-8 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
                        <p className="text-gray-600">No tienes permisos para ver las calificaciones de este curso.</p>
                        <p className="text-gray-500 text-sm mt-2">Solo puedes acceder a los cursos donde enseñas.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Redirigir alumno
    if (user?.role === "alumno") {
        return <Navigate to="/calificaciones" replace />;
    }

    if (loading) {
        return (
            <LoadingState 
                text="Cargando panel administrativo..."
                timeout={8000}
                timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
            />
        );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
              {/* Sección Izquierda - Info del Curso */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{course?.nombre}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        División {course?.division}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        Año {course?.año}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {studentsInCourse.length} Alumnos
                      </Badge>
                    </div>
                  </div>
                </div>
                {/* Descripción mejorada */}
                <div className="ml-12 space-y-1">
                  <p className="text-gray-600">
                    Gestión completa de Calificaciones 
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {calificacionesFiltradas?.length || 0} Evaluaciones registradas
                    </span>
                    {calificacionesFiltradas?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Promedio: {(calificacionesFiltradas.reduce((sum, cal) => sum + cal.valor, 0) / calificacionesFiltradas.length).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Sección Derecha - Acciones */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                {/* NUEVO: Indicadores de estado */}
                <div className="flex items-center gap-2 lg:mr-4">
                  {/* Indicador de alumnos en riesgo */}
                  {calificacionesFiltradas?.some(cal => cal.valor < 6) && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-700 font-medium">
                        {calificacionesFiltradas.filter(cal => cal.valor < 6).length} En riesgo
                      </span>
                    </div>
                  )}
                  {/* Indicador de última actualización */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      Actualizado hoy
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={exportCalificacionesToCSV}
                    variant="default" 
                    disabled={!studentsInCourse.length}
                  >
                    <Download className="h-4 w-4 mr-2" /> 
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </div>
            {calificacionesFiltradas?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* Distribución rápida */}
                  <div className="flex items-center gap-6">
                    <span className="text-gray-600">Excelente (8-10):</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{
                            width: `${(calificacionesFiltradas.filter(cal => cal.valor >= 8).length / calificacionesFiltradas.length) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-green-600 font-medium">
                        {calificacionesFiltradas.filter(cal => cal.valor >= 8).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-600">Bueno (6-7.9):</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{
                            width: `${(calificacionesFiltradas.filter(cal => cal.valor >= 6 && cal.valor < 8).length / calificacionesFiltradas.length) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-yellow-600 font-medium">
                        {calificacionesFiltradas.filter(cal => cal.valor >= 6 && cal.valor < 8).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-600">Necesita mejorar (&lt;6):</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{
                            width: `${(calificacionesFiltradas.filter(cal => cal.valor < 6).length / calificacionesFiltradas.length) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-red-600 font-medium">
                        {calificacionesFiltradas.filter(cal => cal.valor < 6).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatsCard
              label="Promedio general"
              icon={TrendingUp}
              value={averageGrade}
              color="blue"
            />
            <StatsCard
              label="Total de evaluaciones registradas"
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
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Evaluaciones Registradas {user?.role === "docente" ? (course?.nombre) : ("")}
            </h1>
            <div className="flex flex-col gap-2 h-full">
              {user?.role === "admin" ? (
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
                          {/* Fecha inicio */}
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
                                // Limitar fechas máximas al endDate si existe
                                toDate={endDate}
                                onSelect={date => {
                                  // Si selecciona una fecha mayor que endDate, ajusta endDate
                                  if (endDate && date && date > endDate) {
                                    setStartDate(date);
                                    setEndDate(date);
                                    // Aplica filtro rango
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
                          {/* Fecha fin */}
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
                                // Limitar fechas mínimas al startDate si existe
                                fromDate={startDate}
                                onSelect={date => {
                                  // Si selecciona una fecha menor que startDate, ajusta startDate
                                  if (startDate && date && date < startDate) {
                                    setEndDate(date);
                                    setStartDate(date);
                                    // Aplica filtro rango
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
              ): (
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
                          {/* Fecha inicio */}
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
                                // Limitar fechas máximas al endDate si existe
                                toDate={endDate}
                                onSelect={date => {
                                  // Si selecciona una fecha mayor que endDate, ajusta endDate
                                  if (endDate && date && date > endDate) {
                                    setStartDate(date);
                                    setEndDate(date);
                                    // Aplica filtro rango
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
                                    } else if (date) {
                                      table
                                        .getColumn("fecha")
                                        ?.setFilterValue([
                                          format(date, "yyyy-MM-dd"),
                                          format(date, "yyyy-MM-dd"),
                                        ]);
                                    }
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          {/* Fecha fin */}
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
                                // Limitar fechas mínimas al startDate si existe
                                fromDate={startDate}
                                onSelect={date => {
                                  // Si selecciona una fecha menor que startDate, ajusta startDate
                                  if (startDate && date && date < startDate) {
                                    setEndDate(date);
                                    setStartDate(date);
                                    // Aplica filtro rango
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
              )}

            {user?.role === "docente" && teacherSubjectId && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Cargar nueva calificación</h2>
                    <p className="text-gray-500 text-sm">
                      Selecciona los estudiantes y completa los datos de la evaluación.
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-100 mb-6" />
                <div className="bg-blue-50/40 rounded-xl shadow-inner p-4">
                  <CrearCalificacion
                    studentsInCourse={studentsInCourse as any}
                    selectedStudentIds={selectedStudentIds}
                    setSelectedStudentIds={setSelectedStudentIds}
                    subjectId={teacherSubjectId}
                  />
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
}
