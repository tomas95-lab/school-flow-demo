import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import { BookOpen,EyeClosed, Eye, UserCheck, UserX } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useMemo } from "react";
import { useColumnsDetalle, type AttendanceRow } from "@/app/asistencias/columns";
import { DataTable } from "@/components/data-table";

export default function AlumnoAttendanceOverview(){
    const { user } = useContext(AuthContext);
    const studentId = user?.studentId

    const { data: students } = useFirestoreCollection("students")
    const { data: asistencias } = useFirestoreCollection("attendances", {
        constraints: user?.role === 'alumno' ? [where('studentId','==', user?.studentId || '')] : [],
        dependencies: [user?.role, user?.studentId]
    })
    const { data: subjects } = useFirestoreCollection("subjects")
    const studentInfo = students.find((student)=> student.firestoreId == studentId)

    // Define studentsInCourse before using it
    const studentsInCourse = studentInfo ? [studentInfo] : []



    const subjectsInCourse = useMemo(() => {
        const courseId = studentInfo?.cursoId;
        return subjects.filter((s: any) => {
            if (!courseId) return false;
            if (Array.isArray(s.cursoId)) return s.cursoId.includes(courseId);
            return s.cursoId === courseId;
        });
    }, [subjects, studentInfo?.cursoId]);



    // Inicializar estado como vacío
    const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

    // Efecto para colapsar todas las materias cuando se cargan los datos
    useEffect(() => {
        if (subjectsInCourse.length > 0) {
            const allSubjectIds = new Set(
                subjectsInCourse.map(subject => subject.firestoreId!).filter(Boolean)
            );
            setCollapsedSubjects(allSubjectIds);
        }
    }, [subjectsInCourse]);

    const courseStats = useMemo(() => {
        const totalStudents = studentsInCourse.length;
        const totalSubjects = subjectsInCourse.length;
        
        const subjectStats = subjectsInCourse.map(subject => {
        // Obtener TODOS los registros de asistencia para esta materia
        const subjectAttendances = asistencias.filter(a =>
            a.courseId === studentInfo?.cursoId &&
            a.studentId == studentId &&
            a.subject === subject.nombre
        );
    
        // Contar presentes y ausentes directamente de los registros
        const presentRecords = subjectAttendances.filter(a => a.present === true).length;
        const absentRecords = subjectAttendances.filter(a => a.present === false).length;
        const totalRecords = subjectAttendances.length;
        
        // El porcentaje es: registros presentes / total de registros
        const percentage = totalRecords > 0 
            ? Math.round((presentRecords / totalRecords) * 100)
            : 0;
        
        // Para mostrar en las cards, podemos mostrar el promedio por clase
        const uniqueDates = [...new Set(subjectAttendances.map(a => a.fecha).filter(Boolean))];
        const totalClasses = uniqueDates.length;
        const avgPresentPerClass = totalClasses > 0 ? Math.round(presentRecords / totalClasses) : 0;
        const avgAbsentPerClass = totalClasses > 0 ? Math.round(absentRecords / totalClasses) : 0;
        
        return {
            subject: subject.nombre,
            present: presentRecords,           // Total de registros presentes
            absent: absentRecords,             // Total de registros ausentes
            total: totalRecords,               // Total de registros
            percentage,                        // Porcentaje real de asistencia
            totalClasses,                      // Número de clases registradas
            avgPresentPerClass,                // Promedio de presentes por clase
            avgAbsentPerClass,                 // Promedio de ausentes por clase
            studentsCount: totalStudents       // Para referencia
        };
        });

        // Estadísticas generales basadas en el total de registros
        const totalPresentRecords = subjectStats.reduce((sum, s) => sum + s.present, 0);
        const totalAllRecords = subjectStats.reduce((sum, s) => sum + s.total, 0);
        
        const overallPercentage = totalAllRecords > 0
        ? Math.round((totalPresentRecords / totalAllRecords) * 100)
        : 0;

        const lowAttendanceSubjects = subjectStats.filter(s => s.percentage < 80).length;
        
        // Ordenar por porcentaje para encontrar mejor y peor
        const sortedByPercentage = [...subjectStats].sort((a, b) => b.percentage - a.percentage);
        const bestSubject = sortedByPercentage[0] || { percentage: 0, subject: "N/A" };
        const worstSubject = sortedByPercentage[sortedByPercentage.length - 1] || { percentage: 0, subject: "N/A" };

        return {
        totalStudents,
        totalSubjects,
        overallPercentage,
        subjectStats,
        lowAttendanceSubjects,
        bestSubject,
        worstSubject,
        // Agregar datos adicionales para debug
        totalRecordsProcessed: totalAllRecords,
        totalPresentRecords
        };
    }, [studentsInCourse, subjectsInCourse, asistencias, studentId, studentInfo?.cursoId]);



    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 90) return "green";
        if (percentage >= 80) return "blue";
        if (percentage >= 70) return "orange";
        return "red";
    };

    const toggleSubjectCollapse = (sid: string) => {
        const c = new Set(collapsedSubjects);
        if (c.has(sid)) {
            c.delete(sid);
        } else {
            c.add(sid);
        }
        setCollapsedSubjects(c);
    };

    // Get columns for the table
    const columns = useColumnsDetalle(user);


    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" /> 
              Detalle por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjectsInCourse.map(subject => {
            const isCollapsed = collapsedSubjects.has(subject.firestoreId!);
            const stat = courseStats.subjectStats.find(s => s.subject === subject.nombre);

            // 1) Filtramos *todos* los registros de ese alumno + curso + materia
            const data: AttendanceRow[] = studentInfo
              ? [studentInfo].flatMap(student => {
                  const recs = asistencias.filter(a =>
                    a.studentId === student.firestoreId &&
                    a.courseId  === studentInfo?.cursoId &&
                    a.subject   === subject.nombre
                  );
                  
                  // 3) Si tiene registros, devolvemos UNA fila por cada fecha
                  return recs.map(rec => ({
                    id:           student.firestoreId!,
                    Nombre:       `${student.nombre} ${student.apellido}`,
                    present:      Boolean(rec.present),
                    fecha:        rec.date,
                    idAsistencia: rec.firestoreId ?? ""
                  }));
                })
              : [];
                const subjectColor = stat ? getAttendanceColor(stat.percentage) : "gray";

              return (
                <div key={subject.firestoreId} className="space-y-4">
                  <div className={`flex items-center justify-between p-4 bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow border-l-${subjectColor === 'green' ? 'green' : subjectColor === 'red' ? 'red' : subjectColor === 'orange' ? 'orange' : 'blue'}-500`}>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSubjectCollapse(subject.firestoreId!)}
                        className="hover:bg-gray-100"
                      >
                        {isCollapsed ? (
                          <EyeClosed className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.nombre}</h3>
                        <p className="text-sm text-gray-500">{stat?.total || 0} Asistencias registrados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={stat && stat.percentage >= 80 ? "default" : "destructive"}
                        className="text-sm px-3 py-1"
                      >
                        {stat?.percentage || 0}% asistencia
                      </Badge>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">{stat?.present || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserX className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-700">{stat?.absent || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      {data.length === 0 ? (
                        <div className="text-center py-8">
                          <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No hay asistencias registradas
                          </h3>
                          <p className="text-gray-600">
                            No se han registrado asistencias para esta materia aún.
                          </p>
                        </div>
                      ) : (
                        <DataTable<AttendanceRow, unknown>
                          columns={columns}
                          data={data}
                          placeholder="Buscar estudiante..."
                          filters={[
                            { 
                              type: "button", 
                              label: "Solo presentes", 
                              onClick: (t: { getColumn: (column: string) => { setFilterValue: (value: boolean) => void } | undefined }) => t.getColumn("present")?.setFilterValue(true) 
                            },
                            { 
                              type: "button", 
                              label: "Solo ausentes", 
                              onClick: (t: { getColumn: (column: string) => { setFilterValue: (value: boolean) => void } | undefined }) => t.getColumn("present")?.setFilterValue(false) 
                            }
                          ]}
                        />
                      )}
                    </div>
                  )}
                </div>
                );
            })}
          </CardContent>
        </Card>
        </div>
    )
}
