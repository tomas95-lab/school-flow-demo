import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function AttendanceCalendar() {
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Usar hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);

  const { data: attendances } = useFirestoreCollection("attendances");

  // Auto-seleccionar materia si el docente tiene una sola
  useEffect(() => {
    if (teacherSubjects.length === 1 && !selectedSubject) {
      setSelectedSubject(teacherSubjects[0].nombre);
    } else if (teacherSubjects.length > 1 && !selectedSubject) {
      setSelectedSubject(teacherSubjects[0].nombre);
    }
  }, [teacherSubjects, selectedSubject]);

  if (coursesLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  // Filtrar asistencias del docente
  const teacherAttendances = attendances?.filter(a => {
    const isTeacherSubject = teacherSubjects.some(s => s.nombre === a.subject);
    const isTeacherStudent = teacherStudents.some(s => s.firestoreId === a.studentId);
    const isTeacherCourse = teacherCourses.some(c => c.firestoreId === a.courseId);
    return isTeacherSubject && isTeacherStudent && isTeacherCourse;
  }) || [];

  // Asistencias del mes seleccionado
  const monthAttendances = teacherAttendances.filter(a => {
    if (!selectedDate) return false;
    const attendanceDate = parseISO(a.date);
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return attendanceDate >= start && attendanceDate <= end;
  });

  // Asistencias por día
  const attendancesByDay = monthAttendances.reduce((acc, attendance) => {
    const date = format(parseISO(attendance.date), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(attendance);
    return acc;
  }, {} as Record<string, typeof monthAttendances>);

  // Días del mes con asistencias
  const daysWithAttendances = selectedDate ? eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  }) : [];

  const getDayContent = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayAttendances = attendancesByDay[dateKey] || [];
    
    if (dayAttendances.length === 0) return null;

    const present = dayAttendances.filter(a => a.present).length;
    const total = dayAttendances.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const color = attendanceRate >= 80 ? "bg-green-100 text-green-800" : 
                  attendanceRate >= 60 ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800";

    return (
      <div className="text-center">
        <Badge className={`text-xs ${color}`}>
          {present}/{total}
        </Badge>
        <div className="text-xs font-medium mt-1">
          {attendanceRate}%
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario de Asistencias</h2>
          <p className="text-gray-600">Visualiza las asistencias registradas por fecha</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Materia
          </label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar materia" />
            </SelectTrigger>
            <SelectContent>
              {teacherSubjects.map((subject) => (
                <SelectItem key={subject.firestoreId} value={subject.nombre}>
                  {subject.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <CardTitle>Asistencias del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            locale={es}
          />
        </CardContent>
      </Card>

      {/* Estadísticas del mes */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{monthAttendances.length}</div>
                <div className="text-sm text-gray-600">Total Registros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {monthAttendances.length > 0 
                    ? monthAttendances.filter(a => a.present).length
                    : 0
                  }
                </div>
                <div className="text-sm text-gray-600">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {monthAttendances.length > 0 
                    ? Math.round((monthAttendances.filter(a => a.present).length / monthAttendances.length) * 100)
                    : 0
                  }%
                </div>
                <div className="text-sm text-gray-600">Porcentaje Asistencia</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
