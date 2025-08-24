import React from "react"
import { Users, GraduationCap, BookOpen, AlertCircle, PlusCircle, Settings, Book, Sunrise, Sun, Moon, TrendingUp, Calendar, FileText, Award, CheckCircle, ArrowRight, Activity, BarChart3 } from "lucide-react"
// import { ReutilizableCard } from "@/components/ReutilizableCard"
import { useContext, useEffect, useState, useMemo } from "react"
import { AuthContext } from "@/context/AuthContext"
import { SchoolSpinner } from "@/components/SchoolSpinner"
import { Link, useNavigate } from "react-router-dom"
// import { StatsCard } from "@/components/StatCards"
import { Button } from "@/components/ui/button"
import { t } from "@/config/translations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { where } from "firebase/firestore"
import { useTeacherStudents, useTeacherCourses } from "@/hooks/useTeacherCourses"
import { 
  generarAlertasAutomaticas, 
  type DatosAlumno
} from "@/utils/alertasAutomaticas";
import { BarChartComponent, PieChartComponent } from "@/components/charts"

// Enlaces corregidos y funcionales por rol - SOLO RUTAS QUE EXISTEN
const quickAccessByRole = {
  admin: [
    {
      icon: <PlusCircle className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Gestión de Asistencias",
      to: "/app/asistencias",
      description: "Administrar asistencia de estudiantes"
    },
    {
      icon: <Settings className="text-blue-600 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Gestión de Calificaciones",
      to: "/app/calificaciones",
      description: "Gestionar calificaciones y evaluaciones"
    },
    {
      icon: <Book className="text-purple-600 bg-purple-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Panel de Boletines",
      to: "/app/boletines",
      description: "Generar y revisar boletines"
    }
  ],
  docente: [
    {
      icon: <BookOpen className="text-blue-500 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Asistencias",
      to: "/app/asistencias",
      description: "Registrar y revisar asistencia"
    },
    {
      icon: <Users className="text-yellow-500 bg-yellow-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Calificaciones",
      to: "/app/calificaciones",
      description: "Evaluar y calificar estudiantes"
    },
    {
      icon: <FileText className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Boletines",
      to: "/app/boletines",
      description: "Generar boletines de mis cursos"
    }
  ],
  alumno: [
    {
      icon: <BookOpen className="text-blue-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Calificaciones",
      to: "/app/calificaciones",
      description: "Ver mis calificaciones y promedios"
    },
    {
      icon: <Calendar className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Asistencias",
      to: "/app/asistencias",
      description: "Revisar mi historial de asistencia"
    },
    {
      icon: <FileText className="text-purple-600 bg-purple-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mi Boletín",
      to: "/app/boletines",
      description: "Acceder a mi boletín académico"
    }
  ]
};

// KPIs mejorados y específicos por rol - SOLO LOS MÁS IMPORTANTES
const statsByRole = {
  admin: ["totalStudents", "totalTeachers", "totalCourses", "avgAttendance", "avgGrades", "criticalAlerts"],
  docente: ["myCourses", "myStudents", "myAttendanceDocente", "myGrades"],
  alumno: ["myAverage", "myAttendance", "approvedSubjects", "totalSubjects"]
}

// Metadatos de KPIs mejorados - SOLO LOS ESENCIALES
const kpiMeta: Record<string, {
  icon: unknown;
  color: "blue" | "green" | "orange" | "red" | "purple" | "indigo" | "emerald" | "yellow" | "pink" | "gray";
  title: string;
  description: string;
  gradient: string;
}> = {
  // Admin KPIs
  totalStudents: {
    icon: Users,
    color: "blue",
    title: "Estudiantes",
    description: "Total de estudiantes activos",
    gradient: "from-blue-500 to-blue-600"
  },
  totalTeachers: {
    icon: GraduationCap,
    color: "purple",
    title: "Docentes",
    description: "Docentes registrados",
    gradient: "from-purple-500 to-purple-600"
  },
  totalCourses: {
    icon: BookOpen,
    color: "green",
    title: "Cursos",
    description: "Cursos activos",
    gradient: "from-green-500 to-green-600"
  },
  avgAttendance: {
    icon: TrendingUp,
    color: "emerald",
    title: "Asistencia Promedio",
    description: "Promedio general de asistencia",
    gradient: "from-emerald-500 to-emerald-600"
  },
  avgGrades: {
    icon: Award,
    color: "yellow",
    title: "Promedio General",
    description: "Promedio de calificaciones (0-10)",
    gradient: "from-yellow-500 to-yellow-600"
  },
  criticalAlerts: {
    icon: AlertCircle,
    color: "red",
    title: "Alertas Críticas",
    description: "Requieren atención inmediata",
    gradient: "from-red-500 to-red-600"
  },
  
  // Docente KPIs
  myCourses: {
    icon: BookOpen,
    color: "blue",
    title: "Mis Cursos",
    description: "Cursos asignados",
    gradient: "from-blue-500 to-blue-600"
  },
  myStudents: {
    icon: Users,
    color: "green",
    title: "Mis Estudiantes",
    description: "Estudiantes a cargo",
    gradient: "from-green-500 to-green-600"
  },
  myAttendanceDocente: {
    icon: TrendingUp,
    color: "emerald",
    title: "Asistencia Promedio",
    description: "Promedio de mis cursos (%)",
    gradient: "from-emerald-500 to-emerald-600"
  },
  myGrades: {
    icon: Award,
    color: "yellow",
    title: "Promedio General",
    description: "Promedio de mis materias (0-10)",
    gradient: "from-yellow-500 to-yellow-600"
  },
  
  // Alumno KPIs
  myAverage: {
    icon: Award,
    color: "blue",
    title: "Mi Promedio",
    description: "Promedio general actual (0-10)",
    gradient: "from-blue-500 to-blue-600"
  },
  myAttendance: {
    icon: TrendingUp,
    color: "green",
    title: "Mi Asistencia",
    description: "Porcentaje de asistencia (%)",
    gradient: "from-green-500 to-green-600"
  },
  approvedSubjects: {
    icon: CheckCircle,
    color: "emerald",
    title: "Materias Aprobadas",
    description: "Materias con promedio ≥ 7",
    gradient: "from-emerald-500 to-emerald-600"
  },
  totalSubjects: {
    icon: BookOpen,
    color: "purple",
    title: "Total Materias",
    description: "Materias en las que estoy inscrito",
    gradient: "from-purple-500 to-purple-600"
  }
}

function QuickAccessList({ role }: { role: keyof typeof quickAccessByRole }) {
  const items = quickAccessByRole[role] || []
  return (
    <div className="grid gap-4">
      {items.map((item, idx) => (
        <Link
          to={item.to}
          key={idx}
          className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4 p-4">
            <div className="flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {item.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {item.description}
              </p>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </Link>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext)
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [stats, setStats] = useState<{
    totalStudents?: number;
    totalTeachers?: number;
    totalCourses?: number;
    avgAttendance?: string;
    avgGrades?: string;
    criticalAlerts?: number;
    myCourses?: number;
    myStudents?: number;
    myAttendanceDocente?: string;
    myGrades?: string;
    myAverage?: string;
    myAttendance?: string;
    approvedSubjects?: number;
    totalSubjects?: number;
  }>({})
  const [alertStats, setAlertStats] = useState({
    total: 0,
    critical: 0,
    pending: 0,
  });

  const [automaticAlertStats, setAutomaticAlertStats] = useState({
    total: 0,
    critical: 0,
    pending: 0,
  });

  // Usar hooks optimizados con cache
  const roleScope = user?.role
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  // Traer alumnos considerando variantes cursoId|courseId
  const { data: studentsByCurso } = useFirestoreCollection("students", { enableCache: true, constraints: roleScope === 'docente' && teacherCourseIds.length > 0 ? [where('cursoId', 'in', teacherCourseIds.slice(0,10))] : roleScope === 'alumno' ? [where('firestoreId', '==', user?.studentId || '')] : [], dependencies: [roleScope, teacherCourseIds.join(','), user?.studentId] });
  const { data: studentsByCourse } = useFirestoreCollection("students", { enableCache: true, constraints: roleScope === 'docente' && teacherCourseIds.length > 0 ? [where('courseId', 'in', teacherCourseIds.slice(0,10))] : [], dependencies: [roleScope, teacherCourseIds.join(',')] });
  const { data: courses } = useFirestoreCollection("courses", { enableCache: true, constraints: roleScope === 'docente' && user?.teacherId ? [where('teacherId', '==', user.teacherId)] : roleScope === 'alumno' ? [where('alumnos', 'array-contains', user?.studentId || '')] : [], dependencies: [roleScope, user?.teacherId, user?.studentId] });
  const { data: teachers } = useFirestoreCollection("teachers", { enableCache: true, constraints: roleScope === 'docente' ? [where('firestoreId', '==', user?.teacherId || '')] : [], dependencies: [roleScope, user?.teacherId] });
  const { data: calificaciones } = useFirestoreCollection("calificaciones", { enableCache: true, constraints: roleScope === 'docente' && teacherCourseIds.length > 0 ? [where('courseId', 'in', teacherCourseIds.slice(0,10))] : roleScope === 'alumno' ? [where('studentId', '==', user?.studentId || '')] : [], dependencies: [roleScope, teacherCourseIds.join(','), user?.studentId] });
  const { data: asistencias } = useFirestoreCollection("attendances", { enableCache: true, constraints: roleScope === 'docente' && teacherCourseIds.length > 0 ? [where('courseId', 'in', teacherCourseIds.slice(0,10))] : roleScope === 'alumno' ? [where('studentId', '==', user?.studentId || '')] : [], dependencies: [roleScope, teacherCourseIds.join(','), user?.studentId] });
  const { data: subjects } = useFirestoreCollection("subjects", { enableCache: true, constraints: roleScope === 'docente' ? [where('teacherId', '==', user?.teacherId || '')] : [], dependencies: [roleScope, user?.teacherId] });
  const { data: alerts } = useFirestoreCollection("alerts", { enableCache: true, constraints: roleScope === 'docente' ? [where('teacherId', '==', user?.teacherId || '')] : roleScope === 'alumno' ? [where('studentId', '==', user?.studentId || '')] : [], dependencies: [roleScope, user?.teacherId, user?.studentId] });

  // Hook para obtener estudiantes del docente
  const { teacherStudents } = useTeacherStudents(user?.teacherId);

  // Memoizar cálculos pesados
  const calculatedStats = useMemo(() => {
    // Merge de alumnos de ambas colecciones
    const studentsMap = new Map<string, any>();
    (studentsByCurso || []).forEach((s: any) => { if (s?.firestoreId) studentsMap.set(s.firestoreId, s); });
    (studentsByCourse || []).forEach((s: any) => { if (s?.firestoreId) studentsMap.set(s.firestoreId, s); });
    const mergedStudents = Array.from(studentsMap.values());

    if (!mergedStudents || !courses || !teachers || !calificaciones || !asistencias || !subjects) {
      return null;
    }

    const now = new Date();
    const subDays = (d: Date, days: number) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
    const startDate = timeFilter === '7d' ? subDays(now, 7)
      : timeFilter === '30d' ? subDays(now, 30)
      : timeFilter === '90d' ? subDays(now, 90)
      : new Date(0);

    const parseDate = (val: any): Date | null => {
      if (!val) return null;
      try {
        if (typeof val === 'string') {
          // soporta yyyy-MM-dd o ISO
          const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        }
        if (typeof val === 'number') {
          return new Date(val > 1e12 ? val : val * 1000);
        }
        if (val && typeof val === 'object') {
          if ('toDate' in val && typeof (val as any).toDate === 'function') {
            const d = (val as any).toDate();
            return isNaN(d.getTime()) ? null : d;
          }
          if ('seconds' in val && typeof (val as any).seconds === 'number') {
            const d = new Date((val as any).seconds * 1000);
            return isNaN(d.getTime()) ? null : d;
          }
          if (val instanceof Date) {
            return isNaN(val.getTime()) ? null : val;
          }
        }
      } catch {}
      return null;
    };

    const filterByTimeAndCourse = <T,>(items: T[], getDate: (x: T) => any, getCourseId?: (x: T) => string | undefined) => {
      return items.filter((it) => {
        const d = parseDate(getDate(it));
        if (!d || d < startDate) return false;
        if (courseFilter !== 'all' && getCourseId) {
          const cid = (getCourseId(it) || '').toString().trim();
          if (cid !== courseFilter) return false;
        }
        return true;
      });
    };

    const filteredGrades = filterByTimeAndCourse(
      calificaciones,
      (g: any) => (g as any).fecha,
      (g: any) => (g as any).courseId
    );
    const filteredAttendance = filterByTimeAndCourse(
      asistencias,
      (a: any) => (a as any).fecha ?? (a as any).date,
      (a: any) => (a as any).courseId
    );

    // Generar datos para charts
    const generateChartData = () => {
      // Datos para bar chart de rendimiento por curso
      const performanceByCourse = courses.map(course => {
        const courseGrades = filteredGrades.filter(g => g.courseId === course.firestoreId);
        const avgGrade = courseGrades.length > 0 
          ? courseGrades.reduce((sum, g) => sum + g.valor, 0) / courseGrades.length 
          : 0;
        return {
          curso: course.nombre || course.name || 'Sin nombre',
          promedio: parseFloat(avgGrade.toFixed(1))
        };
      }).filter(item => item.promedio > 0);

      // Datos para line chart de asistencia por mes (datos reales de Firestore)
      const generateAttendanceByMonth = () => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const currentYear = new Date().getFullYear();
        
        return months.map((month, index) => {
          // const monthNumber = index + 1;
          const monthAsistencias = filteredAttendance.filter(a => {
            if (!a.fecha) return false;
            const attendanceDate = new Date(a.fecha);
            return attendanceDate.getFullYear() === currentYear && 
                   attendanceDate.getMonth() === index;
          });
          
          const presentCount = monthAsistencias.filter(a => a.present).length;
          const attendancePercentage = monthAsistencias.length > 0 
            ? Math.round((presentCount / monthAsistencias.length) * 100)
            : 0;
          
          return {
            mes: month,
            asistencia: attendancePercentage
          };
        });
      };
      
      const attendanceByMonth = generateAttendanceByMonth();

      // Datos para pie chart de distribución de calificaciones
      const gradeDistribution = [
        { rango: 'Excelente (9-10)', cantidad: filteredGrades.filter(g => g.valor >= 9).length },
        { rango: 'Bueno (7-8.9)', cantidad: filteredGrades.filter(g => g.valor >= 7 && g.valor < 9).length },
        { rango: 'Regular (6-6.9)', cantidad: filteredGrades.filter(g => g.valor >= 6 && g.valor < 7).length },
        { rango: 'Bajo (<6)', cantidad: filteredGrades.filter(g => g.valor < 6).length }
      ].filter(item => item.cantidad > 0);

      // Datos para bar chart de rendimiento por materia
      const performanceBySubject = subjects.map(subject => {
        const subjectGrades = filteredGrades.filter(g => g.subjectId === subject.firestoreId);
        const avgGrade = subjectGrades.length > 0 
          ? subjectGrades.reduce((sum, g) => sum + g.valor, 0) / subjectGrades.length 
          : 0;
        return {
          materia: subject.nombre || subject.name || 'Sin nombre',
          promedio: parseFloat(avgGrade.toFixed(1))
        };
      }).filter(item => item.promedio > 0);

      // Datos para pie chart de distribución de asistencias
      const attendanceDistribution = [
        { estado: 'Presente', cantidad: filteredAttendance.filter(a => a.present).length },
        { estado: 'Ausente', cantidad: filteredAttendance.filter(a => !a.present).length }
      ].filter(item => item.cantidad > 0);

      return {
        performanceByCourse,
        attendanceByMonth,
        gradeDistribution,
        performanceBySubject,
        attendanceDistribution
      };
    };

    const chartData = generateChartData();

    // Calcular estadísticas básicas (admin)
      const totalStudents = mergedStudents.length;
    const totalTeachers = teachers.length;
    const totalCourses = courses.length;

    // Calcular promedios generales de forma optimizada
    const avgGrades = filteredGrades.length > 0 
      ? (filteredGrades.reduce((sum: number, c) => sum + (c.valor || 0), 0) / filteredGrades.length).toFixed(1)
      : "0.0";

    const presentCount = filteredAttendance.filter((a) => a.present).length;
    const avgAttendance = filteredAttendance.length > 0
      ? `${Math.round((presentCount / filteredAttendance.length) * 100)}%`
      : "0%";

    const roleStats: typeof stats = {
      totalStudents,
      totalTeachers,
      totalCourses,
      avgAttendance,
      avgGrades,
      criticalAlerts: 0
    };

    // Estadísticas específicas por rol del usuario
    if (user?.role === 'docente' && user?.teacherId) {
      // Crear maps para búsqueda más rápida
      const teacherMap = new Map(teachers.map(t => [t.firestoreId || '', t]));

      const teacherInfo = teacherMap.get(user.teacherId);
      if (teacherInfo) {
        // Cursos del docente: usar cursos ya filtrados por teacherId + cursoId en teacher (string o array), normalizando espacios
        const normalizedTeacherCursoIds = new Set<string>(
          Array.isArray((teacherInfo as any).cursoId)
            ? ((teacherInfo as any).cursoId || []).map((id: string) => (typeof id === 'string' ? id.trim() : id)).filter(Boolean)
            : ((teacherInfo as any).cursoId ? [((teacherInfo as any).cursoId as string).trim()] : [])
        );

        const coursesByTeacherId = courses; // ya viene filtrado arriba por teacherId
        const unionCourseIds = new Set<string>();
        // IDs provenientes de courses filtrados por teacherId
        coursesByTeacherId.forEach(c => { if (c.firestoreId) unionCourseIds.add(c.firestoreId); });
        // Solo contar cursoId del teacher si existe entre los courses del docente
        normalizedTeacherCursoIds.forEach(id => {
          if (id && coursesByTeacherId.some(c => c.firestoreId === id)) {
            unionCourseIds.add(id);
          }
        });

        // Calcular asistencia del docente basada en sus cursos (courseId)
        const teacherCourseIdsSet = unionCourseIds;
        const teacherAsistencias = filteredAttendance.filter(a => a.courseId && teacherCourseIdsSet.has(a.courseId));
        
        const teacherPresentCount = teacherAsistencias.filter(a => a.present).length;
        const teacherAttendance = teacherAsistencias.length > 0
          ? `${Math.round((teacherPresentCount / teacherAsistencias.length) * 100)}%`
          : "0%";

        // Calcular calificaciones del docente (si hay subjects asociados)
        const teacherSubjectIds = new Set(
          subjects.filter(s => s.teacherId === user.teacherId).map(s => s.firestoreId).filter(Boolean)
        );
        const teacherCalificaciones = filteredGrades.filter(c => 
          c.subjectId && teacherSubjectIds.has(c.subjectId)
        );
        
        const teacherGradesSum = teacherCalificaciones.reduce((sum: number, c) => sum + (c.valor || 0), 0);
        const teacherGrades = teacherCalificaciones.length > 0
          ? (teacherGradesSum / teacherCalificaciones.length).toFixed(1)
          : "0.0";

        // Estudiantes en riesgo (promedio < 6) - optimizado
        const studentGradesMap = new Map<string, number[]>();
        teacherCalificaciones.forEach(c => {
          if (!studentGradesMap.has(c.studentId)) {
            studentGradesMap.set(c.studentId, []);
          }
          studentGradesMap.get(c.studentId)!.push(c.valor || 0);
        });

        const studentsAtRisk = teacherStudents.filter((student: any) => {
          const grades = studentGradesMap.get(student.firestoreId || '') || [];
          if (grades.length === 0) return false;
          const avg = grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length;
          return avg < 6;
        }).length;

        // Tareas pendientes (calificaciones sin valor)
        const pendingTasks = teacherCalificaciones.filter(c => !c.valor || c.valor === 0).length;

        Object.assign(roleStats, {
          myCourses: unionCourseIds.size,
          myStudents: teacherStudents.length,
          myAttendanceDocente: teacherAttendance,
          myGrades: teacherGrades,
          studentsAtRisk,
          pendingTasks
        });
      }
    }

    if (user?.role === 'alumno' && user?.studentId) {
      // Crear maps para búsqueda más rápida
      const studentMap = new Map(mergedStudents.map((s: any) => [s.firestoreId || '', s]));
      
      const studentInfo = studentMap.get(user.studentId);
      if (studentInfo) {
        const studentCalificaciones = filteredGrades.filter(c => c.studentId === user.studentId);
        const studentAsistencias = filteredAttendance.filter(a => a.studentId === user.studentId);
        
        // Calcular promedio del alumno de forma optimizada
        const gradesSum = studentCalificaciones.reduce((sum: number, c) => sum + (c.valor || 0), 0);
        const myAverage = studentCalificaciones.length > 0
          ? (gradesSum / studentCalificaciones.length).toFixed(1)
          : "0.0";

        // Calcular asistencia del alumno de forma optimizada
        const presentCount = studentAsistencias.filter(a => a.present).length;
        const myAttendance = studentAsistencias.length > 0
          ? `${Math.round((presentCount / studentAsistencias.length) * 100)}%`
          : "0%";

        // Materias del curso del alumno
        const studentSubjects = subjects.filter(s => s.cursoId === studentInfo.cursoId);
        
        // Materias aprobadas (promedio >= 7) - optimizado
        const subjectGradesMap = new Map<string, number[]>();
        studentCalificaciones.forEach(c => {
          if (!subjectGradesMap.has(c.subjectId)) {
            subjectGradesMap.set(c.subjectId, []);
          }
          subjectGradesMap.get(c.subjectId)!.push(c.valor || 0);
        });

        const approvedSubjects = studentSubjects.filter(subject => {
          const grades = subjectGradesMap.get(subject.firestoreId || '') || [];
          if (grades.length === 0) return false;
          const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
          return avg >= 7;
        }).length;

        Object.assign(roleStats, {
          myAverage,
          myAttendance,
          approvedSubjects,
          totalSubjects: studentSubjects.length,
          pendingEvaluations: 0,
          unreadMessagesAlumno: 0
        });
      }
    }

    return {
      ...roleStats,
      chartData
    };
  }, [studentsByCurso, studentsByCourse, courses, teachers, calificaciones, asistencias, subjects, user, teacherStudents]);

  // Actualizar stats cuando calculatedStats cambie
  useEffect(() => {
    if (calculatedStats) {
      setStats(calculatedStats);
    }
  }, [calculatedStats]);

  // Estado para alertas automáticas
  const [alertasAutomaticas, setAlertasAutomaticas] = useState<any[]>([]);

  // Calcular alertas automáticas generadas
  useEffect(() => {
    const calcularAlertasAutomaticas = async () => {
      const studentsMap = new Map<string, any>();
      (studentsByCurso || []).forEach((s: any) => { if (s?.firestoreId) studentsMap.set(s.firestoreId, s); });
      (studentsByCourse || []).forEach((s: any) => { if (s?.firestoreId) studentsMap.set(s.firestoreId, s); });
      const mergedStudents = Array.from(studentsMap.values());

      if (!calificaciones || !asistencias || !mergedStudents || !teachers) {
        setAlertasAutomaticas([]);
        return;
      }

      const getPeriodoActual = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const trimestre = Math.ceil(month / 3);
        return `${year}-T${trimestre}`;
      };

      const obtenerPeriodoAnterior = (periodoActual: string): string | undefined => {
        const [year, trimester] = periodoActual.split('-T');
        const currentYear = parseInt(year);
        const currentTrimester = parseInt(trimester);
        
        if (currentTrimester === 1) {
          return `${currentYear - 1}-T4`;
        } else {
          return `${currentYear}-T${currentTrimester - 1}`;
        }
      };

      const periodoActual = getPeriodoActual();
      const periodoAnterior = obtenerPeriodoAnterior(periodoActual);

      try {
        switch (user?.role) {
          case 'admin': {
            // Para admin: alertas de todos los estudiantes
            const alertasPromesas = mergedStudents.map(async (student: any) => {
              const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === student.firestoreId);
              const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === student.firestoreId);
              
              if (calificacionesAlumno.length === 0) return [];

              const datosAlumno: DatosAlumno = {
                studentId: student.firestoreId || '',
                calificaciones: calificacionesAlumno as any,
                asistencias: asistenciasAlumno as any,
                periodoActual,
                periodoAnterior
              };

              return await generarAlertasAutomaticas(datosAlumno, `${student.nombre} ${student.apellido}`);
            });

            const alertasArrays = await Promise.all(alertasPromesas);
            setAlertasAutomaticas(alertasArrays.flat());
            break;
          }

          case 'docente': {
            // Para docente: alertas de sus estudiantes
            const teacher = teachers.find((t) => t.firestoreId === user?.teacherId);
            if (!teacher) {
              setAlertasAutomaticas([]);
              return;
            }

            const alertasPromesas = teacherStudents.map(async (student: any) => {
              const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === student.firestoreId);
              const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === student.firestoreId);
              
              if (calificacionesAlumno.length === 0) return [];

              const datosAlumno: DatosAlumno = {
                studentId: student.firestoreId || '',
                calificaciones: calificacionesAlumno as any,
                asistencias: asistenciasAlumno as any,
                periodoActual,
                periodoAnterior
              };

              return await generarAlertasAutomaticas(datosAlumno, `${student.nombre} ${student.apellido}`);
            });

            const alertasArrays = await Promise.all(alertasPromesas);
            setAlertasAutomaticas(alertasArrays.flat());
            break;
          }

          case 'alumno': {
            // Para alumno: sus propias alertas
            if (!user?.studentId) {
              setAlertasAutomaticas([]);
              return;
            }

            const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === user.studentId);
            const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === user.studentId);
            
            if (calificacionesAlumno.length === 0) {
              setAlertasAutomaticas([]);
              return;
            }

            const datosAlumno: DatosAlumno = {
              studentId: user.studentId || '',
              calificaciones: calificacionesAlumno as any,
              asistencias: asistenciasAlumno as any,
              periodoActual,
              periodoAnterior
            };

            const alertas = await generarAlertasAutomaticas(datosAlumno, user.name || "Estudiante");
            setAlertasAutomaticas(alertas);
            break;
          }

          default:
            setAlertasAutomaticas([]);
        }
      } catch (error) {
        console.error('Error generando alertas automáticas:', error);
        setAlertasAutomaticas([]);
      }
    };

    if (user && calificaciones && asistencias) {
      calcularAlertasAutomaticas();
    }
  }, [user, calificaciones, asistencias, studentsByCurso, studentsByCourse, teachers, teacherStudents]);

  // Calcular estadísticas de alertas normales (de la base de datos)
  useEffect(() => {
    if (!alerts) return;

    let filteredAlerts = alerts;
    
    // Filtrar alertas según el rol
    if (user?.role === "docente" && user?.teacherId) {
      filteredAlerts = alerts.filter((a) => a.createdBy === user.teacherId || a.targetUserRole === "docente");
    } else if (user?.role === "alumno" && user?.studentId) {
      filteredAlerts = alerts.filter((a) => a.targetUserId === user.studentId);
    }
    
    const normalAlertStatsData = {
      total: filteredAlerts.length,
      critical: filteredAlerts.filter((a) => a.priority === "critical").length,
      pending: filteredAlerts.filter((a) => a.status === "pending").length,
    };
    
    setAlertStats(normalAlertStatsData);
    
    // Actualizar estadísticas de admin con alertas críticas normales
    if (user?.role === "admin") {
      setStats((prev) => ({
        ...prev,
        criticalAlerts: normalAlertStatsData.critical
      }));
    }
  }, [alerts, user]);

  // Actualizar estadísticas de alertas automáticas
  useEffect(() => {
    const automaticAlertStatsData = {
      total: alertasAutomaticas.length,
      critical: alertasAutomaticas.filter((a) => a.prioridad === "critica").length,
      pending: alertasAutomaticas.filter((a) => !a.leida).length,
    };
    
    setAutomaticAlertStats(automaticAlertStatsData);
  }, [alertasAutomaticas]);

  const role = (user?.role || "alumno").toLowerCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando datos del dashboard..." fullScreen={true} />
      </div>
    );
  }

  // (Eliminadas funciones no utilizadas getRoleIcon/getRoleMessage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 space-y-6">
        <WelcomeMessage user={user} />
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-3">
            <div className="w-44">
              <Select value={timeFilter} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setTimeFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Última semana</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="all">Todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(user?.role === 'docente' || user?.role === 'admin') && (
              <div className="w-64">
                <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    {courses?.map((c: any) => (
                      <SelectItem key={c.firestoreId} value={c.firestoreId}>{c.nombre || c.name || c.firestoreId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        {/* KPIs modernos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {statsByRole[role as keyof typeof statsByRole]?.slice(0, 4).map(key => {
            const kpiKey = key as keyof typeof kpiMeta
            const meta = kpiMeta[kpiKey]
            return (
              <div key={kpiKey} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.gradient} shadow-lg`}>
                    {React.createElement(meta.icon as React.ComponentType<any>, { className: "w-6 h-6 text-white" })}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats[kpiKey as keyof typeof stats] || 0}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      +12% vs mes anterior
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{t(`kpis.${kpiKey}`)}</div>
                <p className="text-sm text-gray-600">{meta.description}</p>
              </div>
            )
          })}
        </div>

        {/* Sección de Charts */}
        {calculatedStats?.chartData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
            {/* Chart de Rendimiento por Curso */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 overflow-hidden h-[30rem]">
              <BarChartComponent
                data={calculatedStats.chartData.performanceByCourse}
                xKey="curso"
                yKey="promedio"
                title="Rendimiento por Curso"
                description="Promedio de calificaciones por curso"
              />
            </div>

            {/* Chart de Distribución de Calificaciones (Pie con más alto para leyenda) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 overflow-hidden h-[30rem]">
              <PieChartComponent
                data={calculatedStats.chartData.gradeDistribution}
                dataKey="cantidad"
                nameKey="rango"
                title="Distribución de Calificaciones"
                description="Distribución de calificaciones por rango"
              />
            </div>

            {/* Chart de Rendimiento por Materia */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 overflow-hidden h-[30rem]">
              <BarChartComponent
                data={calculatedStats.chartData.performanceBySubject}
                xKey="materia"
                yKey="promedio"
                title="Rendimiento por Materia"
                description="Promedio de calificaciones por materia"
              />
            </div>

            {/* Chart de Distribución de Asistencias (Pie con más alto para leyenda) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 overflow-hidden h-[30rem]">
              <PieChartComponent
                data={calculatedStats.chartData.attendanceDistribution}
                dataKey="cantidad"
                nameKey="estado"
                title="Distribución de Asistencias"
                description="Estado de asistencia general"
                colors={["#10b981", "#ef4444"]}
              />
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
              <div className="text-center max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos disponibles</h3>
                <p className="text-gray-600 mb-4">Los charts aparecerán cuando haya datos en el sistema</p>
                <p className="text-gray-400 text-sm">Datos cargados desde Firestore</p>
              </div>
            </div>
          </div>
        )}

        {/* Sección principal modernizada */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Acceso Rápido Modernizado */}
          <div className="lg:col-span-2 h-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-2 h-full">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Acceso Rápido</h2>
                    <p className="text-sm text-gray-600">Navega directamente a las funciones principales</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <QuickAccessList role={role as keyof typeof quickAccessByRole} />
              </div>
            </div>
          </div>
          
          {/* Panel de alertas modernizado */}
          <div className="space-y-6">
            {/* Alertas Manuales */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Alertas Activas</h3>
                    <p className="text-sm text-gray-600">Notificaciones importantes</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {alertStats.total || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Alertas pendientes
                  </div>
                  <Link to="/app/alertas">
                    <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg">
                      Ver Todas las Alertas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Alertas IA */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Alertas IA</h3>
                    <p className="text-sm text-gray-600">Inteligencia artificial</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {automaticAlertStats.total || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Detectadas automáticamente
                  </div>
                  <Badge className="bg-green-100 text-green-700 px-3 py-1">
                    Sistema inteligente activo
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Centro de Ayuda
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda con el panel? Consulta nuestros recursos.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app/guia-dashboard')}
              >
                Guía del dashboard
              </Button>
              <Button variant="outline" size="sm">Soporte</Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Última actualización
            </h3>
            <p className="text-gray-600">
              Los datos se sincronizan automáticamente cada 5 minutos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeMessage({ user }: { user: { name: string | null; role: string } | null }) {
  const currentHour = new Date().getHours();
  let greeting = "";
  let IconComponent = Sun;
  let gradientClass = "from-yellow-400 to-orange-500";

  if (currentHour < 6) {
    greeting = "Buenas noches";
    IconComponent = Moon;
    gradientClass = "from-indigo-500 to-purple-600";
  } else if (currentHour < 12) {
    greeting = "Buenos días";
    IconComponent = Sunrise;
    gradientClass = "from-yellow-400 to-orange-500";
  } else if (currentHour < 18) {
    greeting = "Buenas tardes";
    IconComponent = Sun;
    gradientClass = "from-orange-400 to-red-500";
  } else {
    greeting = "Buenas noches";
    IconComponent = Moon;
    gradientClass = "from-indigo-500 to-purple-600";
  }

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'docente': return 'Docente';
      case 'alumno': return 'Estudiante';
      default: return 'Usuario';
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-gradient-to-br ${gradientClass} rounded-lg`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {greeting}, {user?.name || "Usuario"}!
            </h1>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="secondary" className="text-xs px-3 py-1">
                {getRoleDisplayName(user?.role)}
              </Badge>
              <div className="h-1 w-1 bg-gray-400 rounded-full" />
              <span className="text-xs text-gray-500">EduNova</span>
            </div>
            <p className="text-sm text-gray-600">Resumen de actividad general</p>
          </div>
        </div>
      </div>
    </div>
  );
}

