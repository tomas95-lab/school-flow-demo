import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function GradesCalendar() {
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Usar hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);

  const { data: calificaciones } = useFirestoreCollection("calificaciones");

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

  // Filtrar calificaciones del docente
  const teacherGrades = calificaciones?.filter(g => {
    const isTeacherSubject = teacherSubjects.some(s => s.firestoreId === g.subjectId);
    const isTeacherStudent = teacherStudents.some(s => s.firestoreId === g.studentId);
    return isTeacherSubject && isTeacherStudent;
  }) || [];

  // Calificaciones del mes seleccionado
  const monthGrades = teacherGrades.filter(g => {
    if (!selectedDate) return false;
    const gradeDate = parseISO(g.fecha);
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return gradeDate >= start && gradeDate <= end;
  });

  // Calificaciones por día
  const gradesByDay = monthGrades.reduce((acc, grade) => {
    const date = format(parseISO(grade.fecha), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(grade);
    return acc;
  }, {} as Record<string, typeof monthGrades>);

  // Días del mes con calificaciones
  const daysWithGrades = selectedDate ? eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  }) : [];

  const getDayContent = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayGrades = gradesByDay[dateKey] || [];
    
    if (dayGrades.length === 0) return null;

    const average = dayGrades.reduce((sum, g) => sum + (g.valor || 0), 0) / dayGrades.length;
    const color = average >= 7 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

    return (
      <div className="text-center">
        <Badge className={`text-xs ${color}`}>
          {dayGrades.length} calif.
        </Badge>
        <div className="text-xs font-medium mt-1">
          {average.toFixed(1)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario de Calificaciones</h2>
          <p className="text-gray-600">Visualiza las calificaciones registradas por fecha</p>
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
          <CardTitle>Calificaciones del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            locale={es}
            components={{
              Day: (props) => getDayContent(props.day.date) || <div />
            }}
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
                <div className="text-2xl font-bold text-blue-600">{monthGrades.length}</div>
                <div className="text-sm text-gray-600">Total Calificaciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {monthGrades.length > 0 
                    ? (monthGrades.reduce((sum, g) => sum + (g.valor || 0), 0) / monthGrades.length).toFixed(1)
                    : "0.0"
                  }
                </div>
                <div className="text-sm text-gray-600">Promedio General</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {monthGrades.length > 0 
                    ? Math.round((monthGrades.filter(g => (g.valor || 0) >= 7).length / monthGrades.length) * 100)
                    : 0
                  }%
                </div>
                <div className="text-sm text-gray-600">Porcentaje Aprobación</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
