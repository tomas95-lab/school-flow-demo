import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useContext, useState } from "react";
import { CourseCard } from "./CourseCard";
import type { Course } from "@/components/CourseCard";
import { SchoolSpinner } from "./SchoolSpinner";
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  UserX,
  Calendar,
  Users,
  Plus,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  subDays,
  startOfDay,
  parseISO,
  isAfter,
  isBefore,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { StatsCard } from "./StatCards";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { db } from "@/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";

export default function TeacherAttendanceOverview() {
  const { user } = useContext(AuthContext);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: courses, loading: loadingCourses = false } =
    useFirestoreCollection<Course>("courses");
  const { data: teachers, loading: loadingTeachers = false } =
    useFirestoreCollection<{ firestoreId: string; cursoId?: string; cursoIds?: string[] }>(
      "teachers"
    );
  const { data: subjects, loading: loadingSubjects = false } =
    useFirestoreCollection<{ firestoreId: string; nombre: string; teacherId: string; cursoId: string }>(
      "subjects"
    );
  const { data: students, loading: loadingStudents = false } =
    useFirestoreCollection<{ firestoreId: string; cursoId: string; nombre: string; apellido: string }>(
      "students"
    );
  const { data: attendances, loading: loadingAttendances = false } =
    useFirestoreCollection<{
      firestoreId: string;
      studentId: string;
      courseId: string;
      subject: string;
      date: string;
      present: boolean;
    }>("attendances");

  if (
    loadingCourses ||
    loadingTeachers ||
    loadingSubjects ||
    loadingStudents ||
    loadingAttendances
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolSpinner text="Cargando panel de asistencias..." fullScreen={true} />
          <p className="text-gray-500 mt-4">Preparando información del sistema</p>
        </div>
      </div>
    );
  }

  // 1. Identificar al docente
  const teacherUserId = user?.teacherId;
  const teacher = teachers.find((t) => t.firestoreId === teacherUserId);

  // 2. Materias del docente
  const subjectsTeacher = subjects.filter(
    (subj) => subj.teacherId === teacher?.firestoreId
  );

  // 3. IDs de cursos (soporta cursoId o cursoIds[])
  const cursoIds = Array.isArray(teacher?.cursoIds)
    ? teacher.cursoIds
    : teacher?.cursoId
    ? [teacher.cursoId]
    : [];

  // 4. Cursos que imparte
  const teacherCourses = courses.filter((c) =>
    cursoIds.includes(c.firestoreId)
  );

  // 5. Estudiantes de esos cursos
  const teacherStudents = students.filter((s) =>
    cursoIds.includes(s.cursoId)
  );
  const validStudentIds = new Set(teacherStudents.map((s) => s.firestoreId));

  // 6. Asistencias válidas: alumno + curso + materia
  const teacherAttendances = attendances.filter(
    (a) =>
      validStudentIds.has(a.studentId) &&
      cursoIds.includes(a.courseId) &&
      subjectsTeacher.some((subj) => subj.nombre === a.subject)
  );

  // dates de referencia
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);
  const monthAgo = subDays(today, 30);
  const twoWeeksAgo = subDays(today, 14);

  // 7. Asistencia promedio últimos 7 días
  const lastWeek = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return (
      (isAfter(d, weekAgo) || d.getTime() === weekAgo.getTime()) &&
      (isBefore(d, today) || d.getTime() === today.getTime())
    );
  });

  // 7b. Asistencia promedio semana anterior para comparar tendencia
  const previousWeek = teacherAttendances.filter((a) => {
    const d = startOfDay(parseISO(a.date));
    return (
      (isAfter(d, twoWeeksAgo) || d.getTime() === twoWeeksAgo.getTime()) &&
      (isBefore(d, weekAgo) || d.getTime() === weekAgo.getTime())
    );
  });

  type DayStats = {
    total: number;
    present: number;
    presentNames: string[];
    absentNames: string[];
  };

  const byDate = lastWeek.reduce((acc, { date, present, studentId }) => {
    const alumno = teacherStudents.find((s) => s.firestoreId === studentId);
    const nombre = alumno
      ? `${alumno.nombre} ${alumno.apellido}`
      : studentId;

    if (!acc[date]) {
      acc[date] = {
        total: 0,
        present: 0,
        presentNames: [],
        absentNames: []
      };
    }

    acc[date].total++;
    if (present) {
      acc[date].present++;
      acc[date].presentNames.push(nombre);
    } else {
      acc[date].absentNames.push(nombre);
    }

    return acc;
  }, {} as Record<string, DayStats>);

  const dailyPercents = Object.values(byDate).map(
    ({ present, total }) => (present / total) * 100
  );
  const avgWeeklyAttendance =
    dailyPercents.length > 0
      ? dailyPercents.reduce((sum, p) => sum + p, 0) / dailyPercents.length
      : 0;

  // Calcular tendencia comparando con semana anterior
  const previousByDate = previousWeek.reduce((acc, { date, present, studentId }) => {
    const alumno = teacherStudents.find((s) => s.firestoreId === studentId);
    const nombre = alumno
      ? `${alumno.nombre} ${alumno.apellido}`
      : studentId;

    if (!acc[date]) {
      acc[date] = {
        total: 0,
        present: 0,
        presentNames: [],
        absentNames: []
      };
    }

    acc[date].total++;
    if (present) {
      acc[date].present++;
      acc[date].presentNames.push(nombre);
    } else {
      acc[date].absentNames.push(nombre);
    }

    return acc;
  }, {} as Record<string, DayStats>);

  const previousDailyPercents = Object.values(previousByDate).map(
    ({ present, total }) => (present / total) * 100
  );
  const avgPreviousWeekAttendance =
    previousDailyPercents.length > 0
      ? previousDailyPercents.reduce((sum, p) => sum + p, 0) / previousDailyPercents.length
      : 0;

  const getAttendanceTrend = () => {
    if (avgWeeklyAttendance > avgPreviousWeekAttendance) {
      return {
        direction: "up",
        percentage: Math.round(avgWeeklyAttendance - avgPreviousWeekAttendance),
        color: "green",
        icon: TrendingUp,
      };
    } else if (avgWeeklyAttendance < avgPreviousWeekAttendance) {
      return {
        direction: "down",
        percentage: Math.round(avgPreviousWeekAttendance - avgWeeklyAttendance),
        color: "red",
        icon: TrendingUp,
      };
    } else {
      return {
        direction: "stable",
        percentage: 0,
        color: "gray",
        icon: TrendingUp,
      };
    }
  };

  const getCourseStats = (courseId: string) => {
    const courseAttendances = teacherAttendances.filter(
      (a) => a.courseId === courseId
    );
    const total = courseAttendances.length;
    const present = courseAttendances.filter((a) => a.present).length;
    return {
      total,
      present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  };

  const trend = getAttendanceTrend();

  // Funciones para el registro rápido
  const toggleAttendance = (studentId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const markAllPresent = () => {
    const newMap: Record<string, boolean> = {};
    teacherStudents.forEach(student => {
      newMap[student.firestoreId] = true;
    });
    setAttendanceMap(newMap);
  };

  const markAllAbsent = () => {
    const newMap: Record<string, boolean> = {};
    teacherStudents.forEach(student => {
      newMap[student.firestoreId] = false;
    });
    setAttendanceMap(newMap);
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedDate) return;
    
    setIsLoading(true);
    setSaveSuccess(false);
    
    try {
      for (const student of teacherStudents) {
        const present = attendanceMap[student.firestoreId] ?? false;
        const docId = `${student.firestoreId}_${student.cursoId}_${selectedSubject}_${selectedDate}`;
        
        const existingAttendance = attendances.find(att => 
          att.studentId === student.firestoreId &&
          att.courseId === student.cursoId &&
          att.subject === selectedSubject &&
          att.date === selectedDate
        );

        if (existingAttendance) {
          await updateDoc(doc(db, "attendances", existingAttendance.firestoreId), {
            present,
            updatedAt: new Date()
          });
        } else {
          await setDoc(doc(db, "attendances", docId), {
            studentId: student.firestoreId,
            courseId: student.cursoId,
            subject: selectedSubject,
            date: selectedDate,
            present,
            createdAt: new Date()
          });
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const totalStudents = teacherStudents.length;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header con botón de registro rápido */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Docente
          </h2>
          <p className="text-gray-600">
            Gestiona las asistencias de tus materias y cursos asignados
          </p>
        </div>
        <Button
          onClick={() => setShowQuickRegister(!showQuickRegister)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showQuickRegister ? "Ocultar Registro" : "Registro Rápido"}
        </Button>
      </div>

      {/* Registro rápido */}
      {showQuickRegister && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BookOpen className="h-5 w-5" />
              Registro Rápido de Asistencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-sm text-gray-600">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totalStudents - presentCount}</div>
                <div className="text-sm text-gray-600">Ausentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{attendancePercentage}%</div>
                <div className="text-sm text-gray-600">Asistencia</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="subject">Materia</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsTeacher.map(subject => (
                      <SelectItem key={subject.firestoreId} value={subject.nombre}>
                        {subject.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                onClick={markAllPresent}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar Todos Presentes
              </Button>
              <Button
                onClick={markAllAbsent}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Marcar Todos Ausentes
              </Button>
              <Button
                onClick={saveAttendance}
                disabled={isLoading || !selectedSubject}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Guardar Asistencias
              </Button>
            </div>

            {saveSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ¡Asistencias guardadas exitosamente!
              </div>
            )}

            {/* Lista de estudiantes */}
            {selectedSubject && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherStudents.map(student => (
                  <div
                    key={student.firestoreId}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      attendanceMap[student.firestoreId]
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                    onClick={() => toggleAttendance(student.firestoreId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.nombre} {student.apellido}
                        </div>
                      </div>
                      <Badge
                        variant={attendanceMap[student.firestoreId] ? "default" : "destructive"}
                        className="text-sm"
                      >
                        {attendanceMap[student.firestoreId] ? "Presente" : "Ausente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          label="Estudiantes"
          value={teacherStudents.length}
          subtitle="Total asignados"
          color="blue"
        />
        <StatsCard
          icon={BookOpen}
          label="Materias"
          value={subjectsTeacher.length}
          subtitle="Materias impartidas"
          color="purple"
        />
        <StatsCard
          icon={TrendingUp}
          label="Asistencia Semanal"
          value={`${Math.round(avgWeeklyAttendance)}%`}
          subtitle={`${trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}${trend.percentage}% vs semana anterior`}
          color={trend.color as any}
        />
        <StatsCard
          icon={Calendar}
          label="Registros Hoy"
          value={teacherAttendances.filter(a => a.date === format(new Date(), "yyyy-MM-dd")).length}
          subtitle="Asistencias registradas"
          color="green"
        />
      </div>

      {/* Lista de Cursos */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Mis Cursos ({teacherCourses.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>Cursos activos</span>
          </div>
        </div>
        <p className="text-gray-600 mt-1">
          Administra cursos y revisa asistencias por materia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teacherCourses.map((course, index) => {
          const stats = getCourseStats(course.firestoreId);
          return (
            <div key={course.firestoreId || index} className="transform transition-all duration-200 hover:scale-105">
              <CourseCard 
                course={course} 
                link={`/asistencias/detalles?id=${course.firestoreId}`} 
                descripcion={`${stats.percentage}% asistencia - ${stats.total} registros`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
