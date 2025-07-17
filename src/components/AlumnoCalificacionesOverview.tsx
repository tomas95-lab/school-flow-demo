import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState } from "react";
import { BookOpen, TrendingUp, Clock, Check } from 'lucide-react';

import { DataTable } from "@/components/data-table";
import { useColumnsDetalle } from "@/app/calificaciones/alumnoColumns";
import type { CalificacionesRow } from "@/app/calificaciones/columns";
import { SchoolSpinner } from "@/components/SchoolSpinner";
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

export default function AlumnoCalificacionesOverview() {
    const { user } = useContext(AuthContext);
    const {data: calificaciones, loading: calificacionesLoading} = useFirestoreCollection("calificaciones");
    const currentStudentId = user?.studentId
    const { data: subjects } = useFirestoreCollection("subjects");
    const { data: students } = useFirestoreCollection("students");
    const { data: courses } = useFirestoreCollection("courses");
    const course = courses.find(c => c.firestoreId === students.find((s)=> s.firestoreId === currentStudentId)?.cursoId);
    const materiaOptions = subjects.filter(s => s.cursoId === course?.firestoreId).map(s => ({ label: s.nombre, value: s.nombre }));

    // Add state for startDate and endDate
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Busca el estudiante actual
    const currentStudent = students.find(s => s.firestoreId === currentStudentId);

    // Agrega nombre y apellido del estudiante a cada calificación
    const calificacionesAlumno = calificaciones
      .filter(calificacion => calificacion.studentId === currentStudentId)
      .map(calificacion => ({
        ...calificacion,
        Nombre: currentStudent?.nombre || "",
        Valor: calificacion.valor,
        Materia: subjects.find(s => s.firestoreId === calificacion.subjectId)?.nombre || "Desconocida",
      }));

    if (calificacionesLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <SchoolSpinner text="Cargando calificaciones..." />
                </div>
            </div>
        );
    }
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    label="Promedio general"
                    value={
                        calificacionesAlumno.length > 0
                            ? (
                                calificacionesAlumno.reduce(
                                    (sum, { Valor }) => sum + Valor,
                                    0
                                ) / calificacionesAlumno.length
                            ).toFixed(2)
                            : "0.00"
                    }
                    subtitle="Promedio de todas tus calificaciones registradas • Escala: 0-10"
                    icon={BookOpen}
                    color="blue"
                />
                <StatsCard
                    label="Porcentaje de aprobados"
                    value={
                        calificacionesAlumno.length > 0
                            ? (
                                (calificacionesAlumno.filter(c => c.Valor >= 7).length / calificacionesAlumno.length) * 100
                            ).toFixed(2) + "%"
                            : "0.00%"
                    }
                    subtitle="Porcentaje de materias aprobadas (nota ≥ 7)"
                    icon={Check}
                    color="green"
                />
                <StatsCard
                    label="Comparativa vs. media de curso"
                    value={
                        (() => {
                            if (!course) return "0.00%";
                            const studentIdsInCourse = students.filter(s => s.cursoId === course.firestoreId).map(s => s.firestoreId);
                            const calificacionesCurso = calificaciones.filter(c => studentIdsInCourse.includes(c.studentId));
                            if (calificacionesCurso.length === 0) return "0.00%";
                            const mediaCurso = calificacionesCurso.reduce((sum, c) => sum + c.valor, 0) / calificacionesCurso.length;
                            const promedioAlumno = calificacionesAlumno.length > 0
                                ? calificacionesAlumno.reduce((sum, { Valor }) => sum + Valor, 0) / calificacionesAlumno.length
                                : 0;
                            const porcentaje = mediaCurso === 0 ? 0 : ((promedioAlumno - mediaCurso) / mediaCurso) * 100;
                            return porcentaje.toFixed(2) + "%";
                        })()
                    }
                    subtitle="Diferencia porcentual respecto al promedio del curso"
                    icon={TrendingUp}
                    color="purple"
                />
                <StatsCard
                    label="Proyección de nota final"
                    value={
                        calificacionesAlumno.length > 0
                            ? (
                                calificacionesAlumno.reduce(
                                    (sum, { Valor }) => sum + Valor,
                                    0
                                ) / calificacionesAlumno.length
                            ).toFixed(2)
                            : "0.00"
                    }
                    subtitle="Estimación de tu calificación final si mantienes el ritmo actual • Escala: 0-10"
                    icon={Clock}
                    color="yellow"
                />
            </div>
            <DataTable 
                  columns={useColumnsDetalle()}
                  data={calificacionesAlumno as CalificacionesRow[]}
                  filters={[{
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
                        </div>
                      )
                    },
                  ]}
                />
        </div>
    )
}