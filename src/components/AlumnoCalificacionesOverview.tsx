import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState, useMemo } from "react";
import { BookOpen, TrendingUp, Check, Award, Calendar, Calendar as CalendarIcon } from 'lucide-react';

import { DataTable } from "@/components/data-table";
import { useColumnsDetalle } from "@/app/calificaciones/alumnoColumns";
import type { CalificacionesRow } from "@/app/calificaciones/columns";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { StatsCard } from "@/components/StatCards";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AuthContext } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlumnoCalificacionesOverview() {
    const { user } = useContext(AuthContext);
    
    // Verificar permisos de acceso
    if (!user || user.role !== 'alumno') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-white p-8 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
                        <p className="text-gray-600">Solo los estudiantes pueden acceder a esta vista.</p>
                        <p className="text-gray-500 text-sm mt-2">Contacta al administrador si crees que esto es un error.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const {data: calificaciones, loading: calificacionesLoading} = useFirestoreCollection("calificaciones");
    const currentStudentId = user?.studentId;
    const { data: subjects } = useFirestoreCollection("subjects");
    const { data: students } = useFirestoreCollection("students");
    const { data: courses } = useFirestoreCollection("courses");
    
    // Obtener información del estudiante
    const currentStudent = students.find(s => s.firestoreId === currentStudentId);
    const course = courses.find(c => c.firestoreId === currentStudent?.cursoId);
    
    // Add state for startDate and endDate
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Filtrar calificaciones del estudiante
    const calificacionesAlumno = useMemo(() => {
        if (!calificaciones || !currentStudentId) return [];
        
        return calificaciones
            .filter(calificacion => calificacion.studentId === currentStudentId)
            .map(calificacion => ({
                ...calificacion,
                Nombre: currentStudent?.nombre || "",
                Valor: calificacion.valor,
                Materia: subjects.find(s => s.firestoreId === calificacion.subjectId)?.nombre || "Desconocida",
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

    // Filtrar por fechas si están seleccionadas
    const filteredGrades = useMemo(() => {
        let filtered = calificacionesAlumno;
        
        if (startDate) {
            filtered = filtered.filter(cal => {
                const gradeDate = new Date(cal.fecha);
                return gradeDate >= startDate;
            });
        }
        
        if (endDate) {
            filtered = filtered.filter(cal => {
                const gradeDate = new Date(cal.fecha);
                return gradeDate <= endDate;
            });
        }
        
        return filtered;
    }, [calificacionesAlumno, startDate, endDate]);

    // Preparar datos para la tabla
    const tableData: CalificacionesRow[] = filteredGrades.map(cal => ({
        id: cal.firestoreId,
        Actividad: cal.Actividad || "Evaluación",
        Nombre: cal.Nombre,
        Comentario: cal.Comentario || "Sin comentario",
        Valor: cal.Valor,
        Materia: cal.Materia,
        fecha: cal.fecha
    }));

    // Opciones de filtro para la tabla
    const materiaOptions = useMemo(() => {
        const materias = [...new Set(calificacionesAlumno.map(cal => cal.Materia))];
        return materias.map(materia => ({ label: materia, value: materia }));
    }, [calificacionesAlumno]);

    if (calificacionesLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <SchoolSpinner text="Cargando calificaciones..." fullScreen={true} />
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
                    icon={Check}
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

            {/* Filtros y controles */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Historial de Calificaciones
                            </h3>
                            {filteredGrades.length !== calificacionesAlumno.length && (
                                <Badge variant="secondary">
                                    {filteredGrades.length} de {calificacionesAlumno.length}
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Filtro de fecha inicial */}
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
                                        onSelect={setStartDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Filtro de fecha final */}
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
                                        onSelect={setEndDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Limpiar filtros */}
                            {(startDate || endDate) && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                        setStartDate(undefined);
                                        setEndDate(undefined);
                                    }}
                                >
                                    Limpiar
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de calificaciones */}
            <Card>
                <CardContent className="pt-6">
                    {tableData.length > 0 ? (
                        <DataTable 
                            columns={useColumnsDetalle()}
                            data={tableData}
                            filters={[
                                {
                                    type: "select",
                                    columnId: "Materia",
                                    label: "Materia",
                                    options: materiaOptions
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
                                {filteredGrades.length === 0 && calificacionesAlumno.length > 0 
                                    ? "No hay calificaciones en el período seleccionado"
                                    : "No hay calificaciones registradas"
                                }
                            </h3>
                            <p className="text-gray-600">
                                {filteredGrades.length === 0 && calificacionesAlumno.length > 0
                                    ? "Intenta ajustar los filtros de fecha para ver más resultados."
                                    : "Tus calificaciones aparecerán aquí una vez que sean registradas por tus docentes."
                                }
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
