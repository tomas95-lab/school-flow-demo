import React from "react"
import {
  Users,
  GraduationCap,
  BookOpen,
  AlertCircle,
  PlusCircle,
  Settings,
  Book,
  Sunrise, 
  Sun, 
  Moon,
  TrendingUp,
  Calendar,
  FileText,
  Award,
  CheckCircle,
  ArrowRight,
  Activity,
  BarChart3,
  Home,
  Star,
  Clock,
} from "lucide-react"
import { ReutilizableCard } from "@/components/ReutilizableCard"
import { useContext, useEffect, useState, useMemo } from "react"
import { AuthContext } from "@/context/AuthContext"
import { SchoolSpinner } from "@/components/SchoolSpinner"
import { Link } from "react-router-dom"
import { StatsCard } from "@/components/StatCards"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { useTeacherStudents } from "@/hooks/useTeacherCourses"
import { 
  generarAlertasAutomaticas, 
  type DatosAlumno
} from "@/utils/alertasAutomaticas";
import { BarChartComponent, LineChartComponent, PieChartComponent } from "@/components/charts"

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
  const { data: students } = useFirestoreCollection("students", { enableCache: true });
  const { data: courses } = useFirestoreCollection("courses", { enableCache: true });
  const { data: teachers } = useFirestoreCollection("teachers", { enableCache: true });
  const { data: calificaciones } = useFirestoreCollection("calificaciones", { enableCache: true });
  const { data: asistencias } = useFirestoreCollection("attendances", { enableCache: true });
  const { data: subjects } = useFirestoreCollection("subjects", { enableCache: true });
  const { data: alerts } = useFirestoreCollection("alerts", { enableCache: true });

  // Hook para obtener estudiantes del docente
  const { teacherStudents } = useTeacherStudents(user?.teacherId);

  // Memoizar cálculos pesados
  const calculatedStats = useMemo(() => {
    if (!students || !courses || !teachers || !calificaciones || !asistencias || !subjects) {
      return null;
    }

    // Generar datos para charts
    const generateChartData = () => {
      // Datos para bar chart de rendimiento por curso
      const performanceByCourse = courses.map(course => {
        const courseGrades = calificaciones.filter(g => g.courseId === course.firestoreId);
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
          const monthNumber = index + 1;
          const monthAsistencias = asistencias.filter(a => {
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
        { rango: 'Excelente (9-10)', cantidad: calificaciones.filter(g => g.valor >= 9).length },
        { rango: 'Bueno (7-8.9)', cantidad: calificaciones.filter(g => g.valor >= 7 && g.valor < 9).length },
        { rango: 'Regular (6-6.9)', cantidad: calificaciones.filter(g => g.valor >= 6 && g.valor < 7).length },
        { rango: 'Bajo (<6)', cantidad: calificaciones.filter(g => g.valor < 6).length }
      ].filter(item => item.cantidad > 0);

      // Datos para bar chart de rendimiento por materia
      const performanceBySubject = subjects.map(subject => {
        const subjectGrades = calificaciones.filter(g => g.subjectId === subject.firestoreId);
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
        { estado: 'Presente', cantidad: asistencias.filter(a => a.present).length },
        { estado: 'Ausente', cantidad: asistencias.filter(a => !a.present).length }
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
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const totalCourses = courses.length;

    // Calcular promedios generales de forma optimizada
    const avgGrades = calificaciones.length > 0 
      ? (calificaciones.reduce((sum: number, c) => sum + (c.valor || 0), 0) / calificaciones.length).toFixed(1)
      : "0.0";

    const presentCount = asistencias.filter((a) => a.present).length;
    const avgAttendance = asistencias.length > 0
      ? `${Math.round((presentCount / asistencias.length) * 100)}%`
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
        const teacherCourses = courses.filter(c => c.firestoreId === teacherInfo.cursoId);
        // Calcular asistencia del docente de forma optimizada
        const teacherSubjectIds = new Set(subjects.filter(s => s.teacherId === user.teacherId).map(s => s.firestoreId));
        const teacherAsistencias = asistencias.filter(a => 
          teacherSubjectIds.has(a.courseId)
        );
        
        const teacherPresentCount = teacherAsistencias.filter(a => a.present).length;
        const teacherAttendance = teacherAsistencias.length > 0
          ? `${Math.round((teacherPresentCount / teacherAsistencias.length) * 100)}%`
          : "0%";

        // Calcular calificaciones del docente de forma optimizada
        const teacherCalificaciones = calificaciones.filter(c => 
          teacherSubjectIds.has(c.subjectId)
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
          myCourses: teacherCourses.length,
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
      const studentMap = new Map(students.map(s => [s.firestoreId || '', s]));
      
      const studentInfo = studentMap.get(user.studentId);
      if (studentInfo) {
        const studentCalificaciones = calificaciones.filter(c => c.studentId === user.studentId);
        const studentAsistencias = asistencias.filter(a => a.studentId === user.studentId);
        
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
  }, [students, courses, teachers, calificaciones, asistencias, subjects, user, teacherStudents]);

  // Actualizar stats cuando calculatedStats cambie
  useEffect(() => {
    if (calculatedStats) {
      setStats(calculatedStats);
    }
  }, [calculatedStats]);

  // Calcular alertas automáticas generadas
  const alertasAutomaticas = useMemo(() => {
    if (!calificaciones || !asistencias || !students || !teachers) return [];

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

    switch (user?.role) {
      case 'admin':
        // Para admin: alertas de todos los estudiantes
        return students.flatMap((student) => {
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

          return generarAlertasAutomaticas(datosAlumno, `${student.nombre} ${student.apellido}`);
        });

      case 'docente': {
        // Para docente: alertas de sus estudiantes
        const teacher = teachers.find((t) => t.firestoreId === user?.teacherId);
        if (!teacher) return [];

        return teacherStudents.flatMap((student: any) => {
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

          return generarAlertasAutomaticas(datosAlumno, `${student.nombre} ${student.apellido}`);
        });
      }

      case 'alumno': {
        // Para alumno: sus propias alertas
        if (!user?.studentId) return [];

        const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === user.studentId);
        const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === user.studentId);
        
        if (calificacionesAlumno.length === 0) return [];

        const datosAlumno: DatosAlumno = {
          studentId: user.studentId || '',
          calificaciones: calificacionesAlumno as any,
          asistencias: asistenciasAlumno as any,
          periodoActual,
          periodoAnterior
        };

        return generarAlertasAutomaticas(datosAlumno, user.name || "Estudiante");
      }

      default:
        return [];
    }
  }, [user, calificaciones, asistencias, students, teachers, teacherStudents]);

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

  // Función para obtener el icono del rol
  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin": return Users;
      case "docente": return GraduationCap;
      case "alumno": return BookOpen;
      default: return Home;
    }
  };

  // Función para obtener mensaje del rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Panel de administración completo de EduNova con estadísticas en tiempo real.";
      case "docente":
        return "Tu espacio de trabajo para gestionar clases, calificaciones y estudiantes.";
      case "alumno":
        return "Tu panel personal con calificaciones, asistencias y actividades académicas.";
      default:
        return "Bienvenido a EduNova.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <WelcomeMessage user={user} />
        
        {/* KPIs modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                      ↗ +12% vs mes anterior
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{meta.title}</div>
                <p className="text-sm text-gray-600">{meta.description}</p>
              </div>
            )
          })}
        </div>

        {/* Sección de Charts */}
        {calculatedStats?.chartData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
            {/* Chart de Rendimiento por Curso */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6">
              <BarChartComponent
                data={calculatedStats.chartData.performanceByCourse}
                xKey="curso"
                yKey="promedio"
                title="Rendimiento por Curso"
                description="Promedio de calificaciones por curso"
                className="h-80"
              />
            </div>

            {/* Chart de Asistencia Mensual */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6">
              <LineChartComponent
                data={calculatedStats.chartData.attendanceByMonth}
                xKey="mes"
                yKey="asistencia"
                title="Tendencia de Asistencia"
                description="Porcentaje de asistencia por mes"
                className="h-80"
                color="#10b981"
              />
            </div>

            {/* Chart de Distribución de Calificaciones */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6">
              <PieChartComponent
                data={calculatedStats.chartData.gradeDistribution}
                dataKey="cantidad"
                nameKey="rango"
                title="Distribución de Calificaciones"
                description="Distribución de calificaciones por rango"
                className="h-80"
              />
            </div>

            {/* Chart de Rendimiento por Materia */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6">
              <BarChartComponent
                data={calculatedStats.chartData.performanceBySubject}
                xKey="materia"
                yKey="promedio"
                title="Rendimiento por Materia"
                description="Promedio de calificaciones por materia"
                className="h-80"
              />
            </div>

            {/* Chart de Distribución de Asistencias */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6">
              <PieChartComponent
                data={calculatedStats.chartData.attendanceDistribution}
                dataKey="cantidad"
                nameKey="estado"
                title="Distribución de Asistencias"
                description="Estado de asistencia general"
                className="h-80"
                colors={["#10b981", "#ef4444"]}
              />
            </div>

            {/* Chart de Estadísticas por Rol */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas por Rol</h3>
                  <p className="text-sm text-gray-600 mb-4">Datos específicos según tu rol</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalStudents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Estudiantes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.totalTeachers || 0}
                      </div>
                      <div className="text-sm text-gray-600">Docentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.totalCourses || 0}
                      </div>
                      <div className="text-sm text-gray-600">Cursos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.avgAttendance || "0%"}
                      </div>
                      <div className="text-sm text-gray-600">Asistencia</div>
                    </div>
                  </div>
                </div>
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Acceso Rápido Modernizado */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-gradient-to-br ${gradientClass} rounded-lg`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {greeting}, {user?.name || "Usuario"}!
            </h1>
            <p className="text-sm text-gray-600">
              Bienvenido al panel de <span className="font-semibold text-blue-600">{getRoleDisplayName(user?.role)}</span>. 
              Aquí tienes un resumen de la actividad de tu institución educativa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

