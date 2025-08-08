import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { format, subDays, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X
} from "lucide-react";

type Subject = {
  firestoreId: string;
  nombre: string;
  teacherId: string;
  cursoId: string;
};

type Attendance = {
  firestoreId: string;
  studentId: string;
  courseId: string;
  subject: string;
  date: string;
  present: boolean;
  createdAt?: Date | string;
};

type MissingAttendance = {
  date: string;
  subjects: string[];
  courseName: string;
};

export default function AttendanceAlert() {
  const { user } = useContext(AuthContext);
  const [showAlert, setShowAlert] = useState(false);
  const [missingAttendances, setMissingAttendances] = useState<MissingAttendance[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Obtener datos
  const { data: courses } = useFirestoreCollection("courses", {
    constraints: user?.role === 'docente' && user?.teacherId ? [where('teacherId','==', user.teacherId)] : [],
    dependencies: [user?.role, user?.teacherId]
  });
  const { data: subjects } = useFirestoreCollection<Subject>("subjects", {
    constraints: user?.role === 'docente' && user?.teacherId ? [where('teacherId','==', user.teacherId)] : [],
    dependencies: [user?.role, user?.teacherId]
  });
  const { data: attendances } = useFirestoreCollection<Attendance>("attendances", {
    constraints: user?.role === 'docente' && courses?.length ? [where('courseId','in', courses.map(c => c.firestoreId).filter(Boolean).slice(0,10))] : [],
    dependencies: [user?.role, courses?.map(c => c.firestoreId).join(',')]
  });

  useEffect(() => {
    if (!user || !courses || !subjects || !attendances) return;

    const checkMissingAttendances = () => {
      const missing: MissingAttendance[] = [];
      
      // Obtener materias del docente
      const teacherSubjects = subjects.filter(subject => 
        subject.teacherId === user.teacherId
      );

      if (teacherSubjects.length === 0) return;

      // Obtener cursos del docente
      const teacherCourses = courses.filter(course => {
        return teacherSubjects.some(subject => subject.cursoId === course.firestoreId);
      });

      // Verificar últimos 7 días
      for (let i = 1; i <= 7; i++) {
        const checkDate = subDays(new Date(), i);
        const dateString = format(checkDate, "yyyy-MM-dd");
        
        // Solo verificar días de semana (lunes a viernes)
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Saltar sábado y domingo

        // Verificar cada materia del docente
        teacherSubjects.forEach(subject => {
          const course = teacherCourses.find(c => c.firestoreId === subject.cursoId);
          if (!course) return;

          // Buscar asistencias para esta materia y fecha
          const existingAttendance = attendances.find(att => 
            att.subject === subject.nombre &&
            att.courseId === subject.cursoId &&
            att.date === dateString
          );

          if (!existingAttendance) {
            // Verificar si ya existe una entrada para esta fecha
            const existingMissing = missing.find(m => m.date === dateString);
            if (existingMissing) {
              if (!existingMissing.subjects.includes(subject.nombre)) {
                existingMissing.subjects.push(subject.nombre);
              }
            } else {
              missing.push({
                date: dateString,
                subjects: [subject.nombre],
                courseName: course.nombre
              });
            }
          }
        });
      }

      setMissingAttendances(missing);
      setShowAlert(missing.length > 0);
    };

    checkMissingAttendances();
  }, [user, courses, subjects, attendances]);

  const getDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Hoy";
    if (isYesterday(date)) return "Ayer";
    return format(date, 'EEEE dd/MM', { locale: es });
  };

  const getSeverity = (dateString: string) => {
    const date = new Date(dateString);
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) return "warning"; // Ayer
    if (daysDiff <= 3) return "error"; // 2-3 días
    return "critical"; // Más de 3 días
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "warning": return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "error": return "bg-orange-50 border-orange-200 text-orange-800";
      case "critical": return "bg-red-50 border-red-200 text-red-800";
      default: return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "warning": return "text-yellow-600";
      case "error": return "text-orange-600";
      case "critical": return "text-red-600";
      default: return "text-yellow-600";
    }
  };

  if (!showAlert || user?.role !== "docente") {
    return null;
  }

  return (
    <Card className={`border-2 ${getSeverityColor(getSeverity(missingAttendances[0]?.date || ""))}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className={`h-5 w-5 ${getSeverityIcon(getSeverity(missingAttendances[0]?.date || ""))}`} />
            Asistencias Pendientes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {missingAttendances.length} día{missingAttendances.length > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm">
            Tienes asistencias sin registrar de días anteriores. 
            Es importante mantener un registro actualizado.
          </p>

          {isExpanded && (
            <div className="space-y-2">
              {missingAttendances.slice(0, 5).map((missing) => {
                const severity = getSeverity(missing.date);
                return (
                  <div
                    key={missing.date}
                    className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${getSeverityIcon(severity)}`} />
                        <span className="font-medium">
                          {getDateDisplay(missing.date)}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityIcon(severity)}`}
                      >
                        {missing.subjects.length} materia{missing.subjects.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p className="mb-1">
                        <strong>Curso:</strong> {missing.courseName}
                      </p>
                      <p>
                        <strong>Materias:</strong> {missing.subjects.join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {missingAttendances.length > 5 && (
                <div className="text-center text-sm text-gray-600">
                  Y {missingAttendances.length - 5} día{missingAttendances.length - 5 > 1 ? 's' : ''} más...
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                // Aquí podrías navegar a la página de registro
                window.location.href = "/app/asistencias";
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Registrar Ahora
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlert(false)}
            >
              Recordar Después
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
