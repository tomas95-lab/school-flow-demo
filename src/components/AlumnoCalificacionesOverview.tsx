import { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import { StatsCard } from "./StatCards";
import { DataTable } from "./data-table";
import { useColumnsDetalle } from "@/app/calificaciones/columns";
import { Percent, TrendingUp, BookOpen, Calendar, Award } from "lucide-react";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";

export interface CalificacionesRow {
  id: string | undefined;
  Actividad: string;
  Nombre: string;
  Comentario: string;
  Valor: number;
  Materia: string;
  fecha: string;
}

export default function AlumnoCalificacionesOverview() {
  const { user } = useContext(AuthContext);
  
  // All hooks at the top level
  const { data: calificaciones, loading: calificacionesLoading } = useFirestoreCollection("calificaciones");
  const { data: subjects } = useFirestoreCollection("subjects");
  const { data: students } = useFirestoreCollection("students");
  const { data: courses } = useFirestoreCollection("courses");
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const currentStudentId = user?.studentId;
  
  // Obtener información del estudiante
  const currentStudent = students?.find(s => s.firestoreId === currentStudentId);
  const course = courses?.find(c => c.firestoreId === currentStudent?.cursoId);
  
  // Filtrar calificaciones del estudiante
  const calificacionesAlumno = useMemo(() => {
    if (!calificaciones || !currentStudentId) return [];
    
    return calificaciones
      .filter(calificacion => calificacion.studentId === currentStudentId)
      .map(calificacion => ({
        ...calificacion,
        Nombre: currentStudent?.nombre || "",
        Valor: calificacion.valor,
        Materia: subjects?.find(s => s.firestoreId === calificacion.subjectId)?.nombre || "Desconocida",
        fecha: calificacion.fecha,
        Actividad: calificacion.Actividad,
        Comentario: calificacion.Comentario
      }));
  }, [calificaciones, currentStudentId, currentStudent, subjects]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!calificacionesAlumno.length) {
      return {
        totalGrades: 0,
        averageGrade: "Sin datos",
        passingGrades: 0,
        failingGrades: 0,
        passingRate: "Sin datos",
        subjects: 0,
        recentGrades: 0
      };
    }

    const totalGrades = calificacionesAlumno.length;
    const averageGrade = calificacionesAlumno.reduce((sum, cal) => sum + cal.Valor, 0) / totalGrades;
    const passingGrades = calificacionesAlumno.filter(cal => cal.Valor >= 7).length;
    const failingGrades = totalGrades - passingGrades;
    const passingRate = ((passingGrades / totalGrades) * 100).toFixed(1);
    const failingRate = ((failingGrades / totalGrades) * 100).toFixed(1);
    
    // Contar materias únicas
    const uniqueSubjects = new Set(calificacionesAlumno.map(cal => cal.Materia)).size;
    
    // Calificaciones recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGrades = calificacionesAlumno.filter(cal => {
      const gradeDate = new Date(cal.fecha);
      return gradeDate >= thirtyDaysAgo;
    }).length;

    return {
      totalGrades,
      averageGrade: averageGrade.toFixed(2),
      passingGrades,
      failingGrades,
      passingRate,
      failingRate,
      subjects: uniqueSubjects,
      recentGrades
    };
  }, [calificacionesAlumno]);

  // Preparar datos para la tabla (sin filtrar por fechas aquí, se hará en la tabla)
  const tableData: CalificacionesRow[] = calificacionesAlumno.map(cal => ({
    id: cal.firestoreId,
    Actividad: cal.Actividad || "Evaluación",
    Nombre: cal.Nombre,
    Comentario: cal.Comentario || "",
    Valor: cal.Valor,
    Materia: cal.Materia,
    fecha: cal.fecha
  }));

  // Opciones de filtro para la tabla
  const materiaOptions = useMemo(() => {
    const materias = [...new Set(calificacionesAlumno.map(cal => cal.Materia))];
    return materias.map(materia => ({ label: materia, value: materia }));
  }, [calificacionesAlumno]);

  // Get columns for the table
  const columns = useColumnsDetalle();

  // Early return after all hooks
  if (!user || user.role !== 'alumno') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
            <p className="text-gray-600">Solo los alumnos pueden acceder a esta vista.</p>
            <p className="text-gray-500 text-sm mt-2">Contacta al administrador si crees que esto es un error.</p>
          </div>
        </div>
      </div>
    );
  }

  if (calificacionesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Removed SchoolSpinner as it's not imported */}
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Información no encontrada</h2>
            <p className="text-gray-600">No se encontró información de estudiante para tu cuenta.</p>
            <p className="text-gray-500 text-sm mt-2">Contacta al administrador del sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del estudiante */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Award className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Mis Calificaciones
              </CardTitle>
              <p className="text-gray-600">
                {currentStudent.nombre} {currentStudent.apellido} • {course?.nombre} {course?.division}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Calificaciones"
          value={stats.totalGrades.toString()}
          icon={BookOpen}
          subtitle="Este período académico"
          color="blue"
          trend="up"
        />
        <StatsCard
          label="Promedio General"
          value={stats.averageGrade}
          icon={TrendingUp}
          subtitle="Promedio de todas las materias"
          color="green"
          trend={parseFloat(stats.averageGrade) >= 7 ? "up" : "down"}
        />
        <StatsCard
          label="Aprobaciones"
          value={`${stats.passingRate}%`}
          icon={Percent}
          subtitle="Porcentaje de aprobación"
          color="green"
          trend={parseFloat(stats.passingRate) >= 70 ? "up" : "down"}
        />
        <StatsCard
          label="Materias"
          value={stats.subjects.toString()}
          icon={Calendar}
          subtitle="Materias con calificaciones"
          color="purple"
          trend="neutral"
        />
      </div>

      {/* Tabla de calificaciones */}
      <Card>
        <CardContent className="pt-6">
          {tableData.length > 0 ? (
            <DataTable 
              columns={columns}
              data={tableData}
              filters={[
                {
                  type: "select",
                  columnId: "Materia",
                  label: "Materia",
                  options: materiaOptions
                },
                {
                  type: "custom",
                  columnId: "fecha",
                  label: "Fecha",
                  placeholder: "Seleccionar fecha",
                  element: (table) => (
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : "Desde"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              // Aplicar filtro de fecha a la tabla
                              if (date && endDate) {
                                table.getColumn("fecha")?.setFilterValue([
                                  format(date, "yyyy-MM-dd"),
                                  format(endDate, "yyyy-MM-dd")
                                ]);
                              } else if (date) {
                                table.getColumn("fecha")?.setFilterValue([
                                  format(date, "yyyy-MM-dd"),
                                  format(new Date(), "yyyy-MM-dd")
                                ]);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : "Hasta"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              // Aplicar filtro de fecha a la tabla
                              if (startDate && date) {
                                table.getColumn("fecha")?.setFilterValue([
                                  format(startDate, "yyyy-MM-dd"),
                                  format(date, "yyyy-MM-dd")
                                ]);
                              } else if (date) {
                                table.getColumn("fecha")?.setFilterValue([
                                  format(new Date(0), "yyyy-MM-dd"),
                                  format(date, "yyyy-MM-dd")
                                ]);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      {(startDate || endDate) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setStartDate(undefined);
                            setEndDate(undefined);
                            table.getColumn("fecha")?.setFilterValue(undefined);
                          }}
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                  )
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
              ]}
            />
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay calificaciones registradas
              </h3>
              <p className="text-gray-600">
                Tus calificaciones aparecerán aquí una vez que sean registradas por tus docentes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de rendimiento */}
      {stats.totalGrades > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Resumen de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.passingGrades}
                </div>
                <div className="text-sm text-gray-600">Aprobaciones</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.passingRate}% del total
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {stats.failingGrades}
                </div>
                <div className="text-sm text-gray-600">Desaprobaciones</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((stats.failingGrades / stats.totalGrades) * 100).toFixed(1)}% del total
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.recentGrades}
                </div>
                <div className="text-sm text-gray-600">Recientes (30 días)</div>
                <div className="text-xs text-gray-500 mt-1">
                  Últimas evaluaciones
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
