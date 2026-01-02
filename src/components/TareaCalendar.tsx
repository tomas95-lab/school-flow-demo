import { useContext, useMemo, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface Tarea {
  firestoreId: string;
  title: string;
  description?: string;
  courseId: string;
  subjectId: string;
  dueDate: string;
  status: 'active' | 'closed';
  points?: number;
}

export default function TareaCalendar() {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: tareas } = useFirestoreCollection<Tarea>("tareas", {
    constraints: user?.role === 'alumno'
      ? [where('studentIds', 'array-contains', user?.studentId || '')]
      : user?.role === 'docente' && teacherCourseIds.length > 0
        ? [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
        : [],
    enableCache: true,
    dependencies: [user?.role, user?.studentId, teacherCourseIds.join(',')]
  });

  const { data: subjects } = useFirestoreCollection("subjects", { enableCache: true });
  const { data: courses } = useFirestoreCollection("courses", { enableCache: true });

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const tareasByDate = useMemo(() => {
    if (!tareas) return new Map();

    const map = new Map<string, Tarea[]>();
    
    tareas.forEach((tarea) => {
      const dueDate = new Date(tarea.dueDate);
      const dateKey = `${dueDate.getFullYear()}-${dueDate.getMonth()}-${dueDate.getDate()}`;
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(tarea);
    });

    return map;
  }, [tareas]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  if (!tareas || tareas.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No hay tareas programadas"
        description="Cuando se asignen tareas, aparecerán en el calendario"
      />
    );
  }

  return (
    <Card className="bg-white shadow-lg border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendario de Tareas</CardTitle>
            <CardDescription>Vista mensual de todas las tareas</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold capitalize min-w-[200px] text-center">
              {monthName}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}

          {daysInMonth.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const dayTareas = tareasByDate.get(dateKey) || [];
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div
                key={index}
                className={`aspect-square border rounded-lg p-2 hover:bg-gray-50 transition-colors ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </span>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayTareas.slice(0, 3).map((tarea: any) => {
                      const subject = subjects?.find(s => s.firestoreId === tarea.subjectId);
                      return (
                        <div
                          key={tarea.firestoreId}
                          className="text-xs p-1 bg-indigo-100 text-indigo-700 rounded truncate"
                          title={`${tarea.title} - ${subject?.nombre || 'N/A'}`}
                        >
                          {tarea.title}
                        </div>
                      );
                    })}
                    {dayTareas.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayTareas.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-900 mb-3">Próximas entregas</h4>
          <div className="space-y-2">
            {tareas
              .filter(t => new Date(t.dueDate) > new Date() && t.status === 'active')
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 5)
              .map((tarea) => {
                const subject = subjects?.find(s => s.firestoreId === tarea.subjectId);
                const course = courses?.find(c => c.firestoreId === tarea.courseId);
                const dueDate = new Date(tarea.dueDate);
                
                return (
                  <div key={tarea.firestoreId} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{tarea.title}</p>
                      <p className="text-xs text-gray-500">
                        {subject?.nombre} - {course?.nombre}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {dueDate.toLocaleDateString('es-AR')}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

