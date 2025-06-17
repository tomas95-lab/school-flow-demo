import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DataTable } from "@/app/asistencias/data-table";
import { columnsDetalle } from "@/app/asistencias/columns";
import type { AttendanceRow } from "@/app/asistencias/columns";
import { SchoolSpinner } from "./SchoolSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  UserX,
  BookOpen,
  Download,
  Eye,
  EyeClosed,
  Target,
  Award,
  AlertTriangle,
} from "lucide-react";
import ReutilizableDialog from "./DialogReutlizable";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
type DetallesStatsCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
  percentage?: number;
};

const DetallesStatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "blue",
  trend
}: DetallesStatsCardProps) => {
  const colorVariants = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      accent: "border-l-blue-500",
      progressBg: "bg-blue-200",
      progressFill: "bg-blue-500"
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      accent: "border-l-green-500",
      progressBg: "bg-green-200",
      progressFill: "bg-green-500"
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600",
      accent: "border-l-orange-500",
      progressBg: "bg-orange-200",
      progressFill: "bg-orange-500"
    },
    red: {
      bg: "bg-red-50",
      icon: "text-red-600",
      accent: "border-l-red-500",
      progressBg: "bg-red-200",
      progressFill: "bg-red-500"
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      accent: "border-l-purple-500",
      progressBg: "bg-purple-200",
      progressFill: "bg-purple-500"
    }
  };

  const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            {trend && (
              <div className={`text-xs px-2 py-1 rounded-full ${
                trend === 'up' ? 'bg-green-100 text-green-700' :
                trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};


export default function DetalleAsistencia() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [id] = useState(searchParams.get("id") || "");

  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());
  const [didInitCollapse, setDidInitCollapse] = useState(false);

  const { data: courses } = useFirestoreCollection("courses");
  const { data: teachers } = useFirestoreCollection("teachers");
  const { data: students } = useFirestoreCollection("students");
  const { data: subjects } = useFirestoreCollection("subjects");
  const { data: asistencias } = useFirestoreCollection("attendances");

  const course = courses.find(c => c.firestoreId === id);
  const teacher = teachers.find(t => t.firestoreId === user?.teacherId);


  // si es admin: todas las materias del curso; si es docente: solo las propias
  const subjectsInCourse = useMemo(() => {
    const base = subjects.filter(s => s.cursoId === id);
    if (user?.role === "admin") return base;
    return base.filter(s => s.teacherId === teacher?.firestoreId);
  }, [subjects, id, user, teacher]);

  const studentsInCourse = students.filter(s => s.cursoId === id);

  useEffect(() => {
    if (!didInitCollapse && subjectsInCourse.length) {
      setCollapsedSubjects(
        new Set(subjectsInCourse.map(s => s.firestoreId!).filter(Boolean))
      );
      setDidInitCollapse(true);
    }
  }, [subjectsInCourse, didInitCollapse]);

  const exportToCSV = () => {
    if (!course) return;
    const rows = [["Alumno", "Materia", "Estado", "Fecha"]];
    subjectsInCourse.forEach(subject =>
      studentsInCourse.forEach(student => {
        const rec = asistencias.find(a =>
          a.studentId === student.firestoreId &&
          a.courseId === id &&
          a.subject === subject.nombre
        );
        rows.push([
          `${student.nombre} ${student.apellido}`,
          subject.nombre,
          rec?.presente ? "Presente" : "Ausente",
          rec?.fecha || "N/A"
        ]);
      })
    );
    const csv = rows.map(r => r.map(f => `"${f}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `asistencias_${course.nombre}_div_${course.division}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const courseStats = useMemo(() => {
    const totalStudents = studentsInCourse.length;
    const totalSubjects = subjectsInCourse.length;

    console.table(asistencias[0])
    console.table(subjects[0])
    console.table(students[0])

    const subjectStats = subjectsInCourse.map(subject => {
      const present = studentsInCourse.reduce((acc, student) => {
        const recs = asistencias.filter(a =>
          a.studentId === student.firestoreId &&
          a.cursoId === id &&
          a.subject === subject.nombre
        );
        // Sum the number of present records for this student and subject
        const presentCount = recs.filter(r => r.presente).length;
        return acc + presentCount;
      }, 0);
      const percentage = totalStudents
        ? Math.round((present / totalStudents) * 100)
        : 0;
      return { subject: subject.nombre, present, absent: totalStudents - present, total: totalStudents, percentage };
    });

    const overallPresent = subjectStats.reduce((sum, s) => sum + s.present, 0);
    const overallTotal = subjectStats.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = overallTotal
      ? Math.round((overallPresent / overallTotal) * 100)
      : 0;
    const lowAttendanceSubjects = subjectStats.filter(s => s.percentage < 80).length;
    const best = subjectStats.sort((a, b) => b.percentage - a.percentage)[0] || { percentage: 0, subject: "" };
    const worst = subjectStats.sort((a, b) => a.percentage - b.percentage)[0] || { percentage: 0, subject: "" };

    return { totalStudents, totalSubjects, overallPercentage, subjectStats, lowAttendanceSubjects, bestSubject: best, worstSubject: worst };
  }, [studentsInCourse, subjectsInCourse, asistencias, id]);

  const toggleSubjectCollapse = (sid: string) => {
    const c = new Set(collapsedSubjects);
    c.has(sid) ? c.delete(sid) : c.add(sid);
    setCollapsedSubjects(c);
  };

  // Funciones para determinar colores y tendencias
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "green";
    if (percentage >= 80) return "blue";
    if (percentage >= 70) return "orange";
    return "red";
  };

  const getAttendanceTrend = (percentage: number) => {
    if (percentage >= 85) return "up";
    if (percentage < 75) return "down";
    return "neutral";
  };

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{course.nombre}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      División {course.division}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      Año {course.año}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 ml-12">
                Gestión completa de asistencias • {courseStats.totalStudents} estudiantes
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 ">
              <Button 
                onClick={exportToCSV}
                variant={"default"} 
                disabled={!studentsInCourse.length}
              >
                <Download className="h-4 w-4 mr-2" /> 
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards Mejoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DetallesStatsCard
            icon={Users}
            label="Total Estudiantes"
            value={courseStats.totalStudents}
            subtitle={`En ${courseStats.totalSubjects} materias`}
            color="blue"
          />
          
          <DetallesStatsCard
            icon={Target}
            label="Asistencia General"
            value={`${courseStats.overallPercentage}%`}
            subtitle="Promedio del curso"
            color={getAttendanceColor(courseStats.overallPercentage)}
            trend={getAttendanceTrend(courseStats.overallPercentage)}
            percentage={courseStats.overallPercentage}
          />
          
          <DetallesStatsCard
            icon={Award}
            label="Mejor Materia"
            value={`${courseStats.bestSubject.percentage}%`}
            subtitle={courseStats.bestSubject.subject || "N/A"}
            color="green"
            trend="up"
          />
          
          <DetallesStatsCard
            icon={AlertTriangle}
            label="Materias en Riesgo"
            value={courseStats.lowAttendanceSubjects}
            subtitle="Asistencia < 80%"
            color={courseStats.lowAttendanceSubjects === 0 ? "green" : courseStats.lowAttendanceSubjects <= 2 ? "orange" : "red"}
          />
        </div>

        {/* Detalle por materia */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" /> 
              Detalle por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjectsInCourse.map(subject => {
            const stat = courseStats.subjectStats.find(s => s.subject === subject.nombre);
            const isCollapsed = collapsedSubjects.has(subject.firestoreId!);

            // 1) Filtramos *todos* los registros de ese alumno + curso + materia
            const data: AttendanceRow[] = studentsInCourse.flatMap(student => {


              const recs = asistencias.filter(a =>
                a.studentId === student.firestoreId &&
                a.cursoId  === id &&
                a.subject   === subject.nombre
              );

              // 3) Si tiene registros, devolvemos UNA fila por cada fecha
              return recs.map(rec => ({
                id:           student.firestoreId!,
                Nombre:       `${student.nombre} ${student.apellido}`,
                presente:     Boolean(rec.presente),
                fecha:        rec.fecha,
                idAsistencia: rec.firestoreId ?? ""
              }));
            });

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
                        <p className="text-sm text-gray-500">{stat?.total || 0} estudiantes registrados</p>
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
                      <DataTable<AttendanceRow, any>
                        columns={columnsDetalle}
                        data={data}
                        placeholder="Buscar estudiante..."
                        filters={[
                          { 
                            type: "button", 
                            label: "Solo presentes", 
                            onClick: t => t.getColumn("presente")?.setFilterValue(true) 
                          },
                          { 
                            type: "button", 
                            label: "Solo ausentes", 
                            onClick: t => t.getColumn("presente")?.setFilterValue(false) 
                          }
                        ]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}