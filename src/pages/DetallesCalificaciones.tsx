import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import  Combobox  from "@/components/Combobox";
import { DataTable } from "@/components/data-table";
import { useColumnsDetalle } from "@/app/calificaciones/columns";
import type { CalificacionesRow } from "@/app/calificaciones/columns";
import { SchoolSpinner } from "@/components/SchoolSpinner";

export default function DetallesCalificaciones () {
    const [searchParams] = useSearchParams();
    const [id] = useState(searchParams.get("id") || "");
    const { data:courses } = useFirestoreCollection("courses")
    const { data: students } = useFirestoreCollection("students")    
    const { data: subjects } = useFirestoreCollection("subjects")    
    const { data: calificaciones,loading = false } = useFirestoreCollection("calificaciones")    
    const [selectedStudentValue, setSelectedStudentValue] = useState<string>("");

    if (loading){
        return(
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <SchoolSpinner text="Cargando panel administrativo..." />
                    <p className="text-gray-500 mt-4">Preparando información del sistema</p>
                  </div>
                </div>
        )
    }

    const course = courses.find(c => c.firestoreId === id);
    const studentsInCourse = students.filter(s => s.cursoId === id);
    const options = studentsInCourse.map(({ nombre, apellido, firestoreId }) => ({
        label: `${nombre} ${apellido}`,
        value: firestoreId ?? ""
    }));

    const calificacionesFiltradas = (
    selectedStudentValue.trim() !== ""
        ? calificaciones.filter(c => c.studentId === selectedStudentValue)
        : calificaciones.filter(c =>
            students.some(student =>
            student.firestoreId === c.studentId &&
            student.cursoId === course?.firestoreId
            )
        )
    ).sort((a, b) => {
        const studentA = students.find(s => s.firestoreId === a.studentId);
        const studentB = students.find(s => s.firestoreId === b.studentId);
        return studentA?.nombre.localeCompare(studentB?.nombre);
    });

    
    // 2) Mapear y agregar nombre de materia
    const resultado: CalificacionesRow[] = calificacionesFiltradas.map(c => {
    // buscar materia como antes
    const materia = subjects.find(s => s.firestoreId === c.subjectId);

    console.log(materia)
    // buscar alumno en el curso
    const estudiante = studentsInCourse.find(s => s.firestoreId === c.studentId);

    return {
        id: c.firestoreId ?? "", // o el campo correcto para 'id'
        Actividad: c.Actividad ?? "", // ajusta según el nombre real del campo
        Nombre: estudiante
            ? `${estudiante.nombre} ${estudiante.apellido}`
            : "—",
        Comentario: c.Comentario ?? "Sin comentario", // ajusta según el nombre real del campo
        Valor: c.valor, // asegurar tipo number
        SubjectNombre: materia?.nombre || "—", // nombre correcto y mayúscula
        fecha: c.creadoEn 
    };
    });

    console.log(resultado)
    return(
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
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
                            </div>
                        </div>
                    </div>
                        <p className="text-gray-600 ml-12">
                            Gestión completa de Calificaciones
                        </p>
                    </div>
                </div>
            </div>

            {/* Busqueda de alumno */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
                <Combobox
                    className="w-full"
                    items={options}
                    value={selectedStudentValue}
                    onChange={value => setSelectedStudentValue(value)}
                />
                    <DataTable
                        columns={useColumnsDetalle()}
                        data={resultado}
                    ></DataTable>
            </div>
        </div>
    </div>
    )
} 