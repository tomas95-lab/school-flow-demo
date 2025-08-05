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
} from "lucide-react"
import { ReutilizableCard } from "@/components/ReutilizableCard"
import { useContext, useEffect, useState, useMemo } from "react"
import { AuthContext } from "@/context/AuthContext"
import { SchoolSpinner } from "@/components/SchoolSpinner"
import { Link } from "react-router-dom"
import { StatsCard } from "@/components/StatCards"
import { Button } from "@/components/ui/button"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { useTeacherStudents } from "@/hooks/useTeacherCourses"
import { 
  generarAlertasAutomaticas, 
  type DatosAlumno
} from "@/utils/alertasAutomaticas";

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

    return roleStats;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <WelcomeMessage user={user} />
        
        {/* KPIs - Layout más compacto */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsByRole[role as keyof typeof statsByRole]?.map(key => {
            const kpiKey = key as keyof typeof kpiMeta
            const meta = kpiMeta[kpiKey]
            return (
              <div key={kpiKey} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-md bg-gradient-to-br ${meta.gradient}`}>
                    {React.createElement(meta.icon as React.ComponentType<any>, { className: "w-4 h-4 text-white" })}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {stats[kpiKey as keyof typeof stats] || 0}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{meta.title}</div>
                <p className="text-xs text-gray-600 mt-1">{meta.description}</p>
              </div>
            )
          })}
        </div>

        {/* Layout principal - Más simple */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Acceso Rápido */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500 rounded-md">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Acceso Rápido</h2>
                    <p className="text-sm text-gray-600">Enlaces rápidos a secciones importantes</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <QuickAccessList role={role as keyof typeof quickAccessByRole} />
              </div>
            </div>
          </div>
          
          {/* Alertas - Más compactas */}
          <div className="space-y-4">
            {/* Alertas Manuales */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-red-500 rounded-md">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Alertas</h3>
                    <p className="text-xs text-gray-600">Gestión de alertas</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {alertStats.total || 0}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    Alertas activas
                  </div>
                  <Link to="/app/alertas">
                    <Button variant="destructive" size="sm" className="w-full">
                      Ver Alertas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Alertas Automáticas */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-green-500 rounded-md">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Alertas IA</h3>
                    <p className="text-xs text-gray-600">Generadas automáticamente</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {automaticAlertStats.total || 0}
                  </div>
                  <div className="text-xs text-gray-600">
                    Alertas generadas por IA
                  </div>
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

