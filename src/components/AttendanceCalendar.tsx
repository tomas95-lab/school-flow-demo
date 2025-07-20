import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle,
  TrendingUp
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay
} from "date-fns";
import { es } from "date-fns/locale";

type Student = {
  firestoreId: string;
  nombre: string;
  apellido: string;
  cursoId: string;
};

type Course = {
  firestoreId: string;
  nombre: string;
  division: string;
};

type Attendance = {
  firestoreId: string;
  studentId: string;
  courseId: string;
  subject: string;
  date: string;
  present: boolean;
  createdAt?: any;
};

export default function AttendanceCalendar() {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Obtener datos
  const { data: courses } = useFirestoreCollection<Course>("courses");
  const { data: students } = useFirestoreCollection<Student>("students");
  const { data: attendances } = useFirestoreCollection<Attendance>("attendances");

  // Filtrar cursos según el rol
  const availableCourses = useMemo(() => {
    if (!courses) return [];
    
    if (user?.role === "admin") {
      return courses;
    } else if (user?.role === "docente") {
      // Para docentes, mostrar solo cursos donde enseñan
      // Por ahora mostramos todos, pero se puede filtrar por teacherId
      return courses;
    } else if (user?.role === "alumno") {
      // Para alumnos, mostrar solo su curso
      const student = students?.find(s => s.firestoreId === user.uid);
      if (student) {
        return courses.filter(c => c.firestoreId === student.cursoId);
      }
      return [];
    }
    
    return [];
  }, [courses, students, user]);

  // Calcular días del mes
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calcular días para mostrar en el calendario (incluyendo días de la semana anterior/posterior)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filtrar asistencias según el curso seleccionado
  const filteredAttendances = useMemo(() => {
    if (!attendances) return [];
    
    if (selectedCourse === "all") {
      return attendances;
    }
    
    return attendances.filter(a => a.courseId === selectedCourse);
  }, [attendances, selectedCourse]);

  // Calcular estadísticas del mes
  const monthStats = useMemo(() => {
    const monthAttendances = filteredAttendances.filter(a => {
      const attendanceDate = new Date(a.date);
      return isSameMonth(attendanceDate, currentDate);
    });

    const totalRecords = monthAttendances.length;
    const presentRecords = monthAttendances.filter(a => a.present).length;
    const absentRecords = totalRecords - presentRecords;
    const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Días con registro de asistencia
    const daysWithAttendance = new Set(monthAttendances.map(a => a.date)).size;

    return {
      totalRecords,
      presentRecords,
      absentRecords,
      attendancePercentage,
      daysWithAttendance
    };
  }, [filteredAttendances, currentDate]);

  // Función para obtener el color del día según las asistencias
  const getDayColor = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayAttendances = filteredAttendances.filter(a => a.date === dayStr);
    
    if (dayAttendances.length === 0) {
      return 'bg-white border-gray-200';
    }
    
    const presentCount = dayAttendances.filter(a => a.present).length;
    const totalCount = dayAttendances.length;
    const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
    
    if (percentage >= 80) {
      return 'bg-green-50 border-green-200';
    } else if (percentage >= 60) {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  // Función para obtener el porcentaje del día
  const getDayPercentage = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayAttendances = filteredAttendances.filter(a => a.date === dayStr);
    
    if (dayAttendances.length === 0) return null;
    
    const presentCount = dayAttendances.filter(a => a.present).length;
    const totalCount = dayAttendances.length;
    return totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  };

  // Navegación del calendario
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Calendario de Asistencias
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controles de navegación */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Selector de curso */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Curso:</span>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {availableCourses.map(course => (
                    <SelectItem key={course.firestoreId} value={course.firestoreId}>
                      {course.nombre} - {course.division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estadísticas del mes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Registros</p>
                  <p className="text-xl font-bold text-blue-900">{monthStats.totalRecords}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Presentes</p>
                  <p className="text-xl font-bold text-green-900">{monthStats.presentRecords}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Ausentes</p>
                  <p className="text-xl font-bold text-red-900">{monthStats.absentRecords}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600">Asistencia</p>
                  <p className="text-xl font-bold text-indigo-900">{monthStats.attendancePercentage}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Días con Registro</p>
                  <p className="text-xl font-bold text-purple-900">{monthStats.daysWithAttendance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendario */}
          <div className="bg-white rounded-lg border">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="bg-gray-50 p-3 text-center">
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                </div>
              ))}
            </div>
            
            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);
                const dayPercentage = getDayPercentage(day);
                const dayColor = getDayColor(day);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-2 ${dayColor} ${
                      !isCurrentMonth ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isCurrentDay ? 'text-indigo-600' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {isCurrentDay && (
                        <Badge variant="default" className="text-xs">
                          Hoy
                        </Badge>
                      )}
                    </div>
                    
                    {dayPercentage !== null && (
                      <div className="mt-1">
                        <div className="text-xs font-medium text-gray-600">
                          {dayPercentage}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className={`h-1 rounded-full ${
                              dayPercentage >= 80 ? 'bg-green-500' :
                              dayPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${dayPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>80%+ Asistencia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span>60-79% Asistencia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
              <span>&lt;60% Asistencia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span>Sin Registro</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 