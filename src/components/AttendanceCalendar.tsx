import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
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
  TrendingUp, 
  CheckCircle, 
  XCircle,
  BookOpen
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
  endOfWeek
} from "date-fns";
import { es } from "date-fns/locale";
import { subjectBelongsToCourse } from "@/utils/subjectUtils";

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

type Subject = {
  firestoreId: string;
  nombre: string;
  teacherId: string;
  cursoId: string | string[];
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
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");
  const { data: attendances } = useFirestoreCollection<Attendance>("attendances");

  // Filtrar cursos según el rol
  const availableCourses = useMemo(() => {
    if (!courses) return [];
    
    if (user?.role === "admin") {
      // Admin ve todos los cursos
      return courses;
    } else if (user?.role === "docente") {
      // Docente ve solo cursos donde enseña
      if (!subjects || !user.teacherId) return [];
      
      // Obtener materias del docente
      const teacherSubjects = subjects.filter(subject => 
        subject.teacherId === user.teacherId
      );
      
      // Obtener IDs de cursos donde enseña
      const teacherCourseIds = new Set<string>();
      teacherSubjects.forEach(subject => {
        if (Array.isArray(subject.cursoId)) {
          subject.cursoId.forEach(courseId => teacherCourseIds.add(courseId));
        } else {
          teacherCourseIds.add(subject.cursoId);
        }
      });
      
      return courses.filter(course => teacherCourseIds.has(course.firestoreId));
    } else if (user?.role === "alumno") {
      // Alumno ve solo su curso
      const student = students?.find(s => s.firestoreId === user.studentId);
      if (student) {
        return courses.filter(c => c.firestoreId === student.cursoId);
      }
      return [];
    }
    
    return [];
  }, [courses, students, subjects, user]);


  console.log("AttendanceCalendar - Available Courses:", availableCourses);
  // Calcular días del mes
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Calcular días para mostrar en el calendario (incluyendo días de la semana anterior/posterior)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filtrar asistencias según el curso seleccionado y rol
  const filteredAttendances = useMemo(() => {
    if (!attendances) return [];
    
    let filtered = attendances;
    
    // Filtrar por curso seleccionado
    if (selectedCourse !== "all") {
      filtered = filtered.filter(a => a.courseId === selectedCourse);
    } else {
      // Si es "todos", filtrar por cursos disponibles según el rol
      const availableCourseIds = availableCourses.map(c => c.firestoreId);
      filtered = filtered.filter(a => availableCourseIds.includes(a.courseId));
    }
    
    // Para docentes, filtrar también por materias que enseñan
    if (user?.role === "docente" && subjects) {
      const teacherSubjects = subjects.filter(subject => 
        subject.teacherId === user.teacherId
      );
      const teacherSubjectNames = teacherSubjects.map(s => s.nombre);
      filtered = filtered.filter(a => teacherSubjectNames.includes(a.subject));
    }
    
    return filtered;
  }, [attendances, selectedCourse, availableCourses, user, subjects]);

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
        </CardContent>
      </Card>
    </div>
  );
} 
