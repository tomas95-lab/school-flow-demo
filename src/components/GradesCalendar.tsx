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
  BookOpen,
  Lock
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
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

type Subject = {
  firestoreId: string;
  nombre: string;
  teacherId: string;
  cursoId: string | string[];
};

type Grade = {
  firestoreId: string;
  studentId: string;
  subjectId: string;
  subject: string;
  valor: number;
  tipo: string;
  fecha: string;
  comentario?: string;
  createdAt?: any;
};

export default function GradesCalendar() {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Obtener datos
  const { data: courses } = useFirestoreCollection<Course>("courses");
  const { data: students } = useFirestoreCollection<Student>("students");
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");
  const { data: grades } = useFirestoreCollection<Grade>("calificaciones");

  // Filtrar cursos según el rol
  const availableCourses = useMemo(() => {
    if (!courses) return [];
    
    if (user?.role === "admin") {
      return courses;
    } else if (user?.role === "docente") {
      // Para docentes, mostrar solo cursos donde enseñan
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
      // Para alumnos, mostrar solo su curso
      const student = students?.find(s => s.firestoreId === user.studentId);
      if (student) {
        return courses.filter(c => c.firestoreId === student.cursoId);
      }
      return [];
    }
    
    return [];
  }, [courses, students, subjects, user]);

  // Filtrar materias según el rol
  const availableSubjects = useMemo(() => {
    if (!subjects) return [];
    
    if (user?.role === "admin") {
      return subjects;
    } else if (user?.role === "docente") {
      // Solo materias del docente
      return subjects.filter(subject => subject.teacherId === user.teacherId);
    } else if (user?.role === "alumno") {
      // Solo materias del curso del alumno
      const student = students?.find(s => s.firestoreId === user.studentId);
      if (student) {
        return subjects.filter(subject => {
          if (Array.isArray(subject.cursoId)) {
            return subject.cursoId.includes(student.cursoId);
          }
          return subject.cursoId === student.cursoId;
        });
      }
      return [];
    }
    
    return [];
  }, [subjects, students, user]);

  // Calcular días del mes
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Calcular días para mostrar en el calendario (incluyendo días de la semana anterior/posterior)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filtrar calificaciones según el curso y materia seleccionados
  const filteredGrades = useMemo(() => {
    if (!grades) return [];
    
    let filtered = grades;
    
    // Filtrar por curso seleccionado
    if (selectedCourse !== "all") {
      const courseStudents = students?.filter(s => s.cursoId === selectedCourse) || [];
      const studentIds = courseStudents.map(s => s.firestoreId);
      filtered = filtered.filter(g => studentIds.includes(g.studentId));
    } else {
      // Si es "todos", filtrar por cursos disponibles según el rol
      const availableCourseIds = availableCourses.map(c => c.firestoreId);
      const availableStudentIds = students
        ?.filter(s => availableCourseIds.includes(s.cursoId))
        .map(s => s.firestoreId) || [];
      filtered = filtered.filter(g => availableStudentIds.includes(g.studentId));
    }
    
    // Filtrar por materia seleccionada
    if (selectedSubject !== "all") {
      const subject = availableSubjects.find(s => s.nombre === selectedSubject);
      if (subject) {
        filtered = filtered.filter(g => g.subjectId === subject.firestoreId);
      }
    } else {
      // Si es "todas", filtrar por materias disponibles según el rol
      const availableSubjectIds = availableSubjects.map(s => s.firestoreId);
      filtered = filtered.filter(g => availableSubjectIds.includes(g.subjectId));
    }
    
    return filtered;
  }, [grades, selectedCourse, selectedSubject, students, availableCourses, availableSubjects]);

  // Calcular estadísticas del mes
  const monthStats = useMemo(() => {
    const monthGrades = filteredGrades.filter(g => {
      const gradeDate = new Date(g.fecha);
      return isSameMonth(gradeDate, currentDate);
    });

    const totalGrades = monthGrades.length;
    const averageGrade = totalGrades > 0 
      ? monthGrades.reduce((sum, g) => sum + g.valor, 0) / totalGrades 
      : 0;
    const passingGrades = monthGrades.filter(g => g.valor >= 7).length;
    const failingGrades = totalGrades - passingGrades;

    // Días con calificaciones
    const daysWithGrades = new Set(monthGrades.map(g => g.fecha)).size;

    // Tipos de evaluación
    const gradeTypes = new Set(monthGrades.map(g => g.tipo));

    return {
      totalGrades,
      averageGrade: averageGrade.toFixed(2),
      passingGrades,
      failingGrades,
      daysWithGrades,
      gradeTypes: Array.from(gradeTypes)
    };
  }, [filteredGrades, currentDate]);

  // Función para obtener el color del día según las calificaciones
  const getDayColor = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayGrades = filteredGrades.filter(g => g.fecha === dayStr);
    
    if (dayGrades.length === 0) {
      return 'bg-white border-gray-200';
    }
    
    const averageGrade = dayGrades.reduce((sum, g) => sum + g.valor, 0) / dayGrades.length;
    
    if (averageGrade >= 8) {
      return 'bg-green-50 border-green-200';
    } else if (averageGrade >= 7) {
      return 'bg-blue-50 border-blue-200';
    } else if (averageGrade >= 6) {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  // Función para obtener información del día
  const getDayInfo = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayGrades = filteredGrades.filter(g => g.fecha === dayStr);
    
    if (dayGrades.length === 0) return null;
    
    const averageGrade = dayGrades.reduce((sum, g) => sum + g.valor, 0) / dayGrades.length;
    const types = new Set(dayGrades.map(g => g.tipo));
    
    return {
      count: dayGrades.length,
      average: averageGrade.toFixed(1),
      types: Array.from(types)
    };
  };

  // Navegación del calendario
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Verificar permisos
  const canViewCalendar = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";

  if (!canViewCalendar) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                No tienes permisos para ver el calendario de calificaciones.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Calendario de Calificaciones
              {user?.role === "docente" && (
                <Badge variant="secondary" className="ml-2">
                  Mis Cursos
                </Badge>
              )}
              {user?.role === "alumno" && (
                <Badge variant="secondary" className="ml-2">
                  Mi Curso
                </Badge>
              )}
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
            
            {/* Filtros */}
            <div className="flex items-center gap-4">
              {/* Selector de curso */}
              {availableCourses.length > 1 && (
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
              )}
              
              {/* Selector de materia */}
              {availableSubjects.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Materia:</span>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todas las materias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las materias</SelectItem>
                      {availableSubjects.map(subject => (
                        <SelectItem key={subject.firestoreId} value={subject.nombre}>
                          {subject.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas del mes */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Calificaciones</p>
                  <p className="text-xl font-bold text-blue-900">{monthStats.totalGrades}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600">Promedio</p>
                  <p className="text-xl font-bold text-indigo-900">{monthStats.averageGrade}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Aprobados</p>
                  <p className="text-xl font-bold text-green-900">{monthStats.passingGrades}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Desaprobados</p>
                  <p className="text-xl font-bold text-red-900">{monthStats.failingGrades}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Días con Calificaciones</p>
                  <p className="text-xl font-bold text-purple-900">{monthStats.daysWithGrades}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600">Tipos de Evaluación</p>
                  <p className="text-xl font-bold text-yellow-900">{monthStats.gradeTypes.length}</p>
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
                const dayInfo = getDayInfo(day);
                const dayColor = getDayColor(day);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 ${dayColor} ${
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
                    
                    {dayInfo && (
                      <div className="mt-1 space-y-1">
                        <div className="text-xs font-medium text-gray-600">
                          {dayInfo.count} calif.
                        </div>
                        <div className="text-xs font-medium text-gray-800">
                          Prom: {dayInfo.average}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {dayInfo.types.slice(0, 2).map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {dayInfo.types.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{dayInfo.types.length - 2}
                            </Badge>
                          )}
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
              <span>Promedio ≥ 8</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span>Promedio 7-7.9</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span>Promedio 6-6.9</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
              <span>Promedio &lt; 6</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span>Sin calificaciones</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
