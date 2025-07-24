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
} from "lucide-react"
import { ReutilizableCard } from "@/components/ReutilizableCard"
import { useContext, useEffect, useState, useMemo } from "react"
import { AuthContext } from "@/context/AuthContext"
import { SchoolSpinner } from "@/components/SchoolSpinner"
import { Link } from "react-router-dom"
import { StatsCard } from "@/components/StatCards"
import { Button } from "@/components/ui/button"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
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
      to: "/asistencias"
    },
    {
      icon: <Settings className="text-blue-600 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Gestión de Calificaciones",
      to: "/calificaciones"
    },
    {
      icon: <Book className="text-purple-600 bg-purple-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Panel de Boletines",
      to: "/boletines"
    },
    {
      icon: <AlertCircle className="text-red-500 bg-red-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Detalles de Calificaciones",
      to: "/calificaciones/detalles"
    }
  ],
  docente: [
    {
      icon: <BookOpen className="text-blue-500 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Asistencias",
      to: "/asistencias"
    },
    {
      icon: <Users className="text-yellow-500 bg-yellow-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Calificaciones",
      to: "/calificaciones"
    },
    {
      icon: <FileText className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Boletines",
      to: "/boletines"
    }
  ],
  alumno: [
    {
      icon: <BookOpen className="text-blue-500 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Calificaciones",
      to: "/calificaciones"
    },
    {
      icon: <Calendar className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Asistencias",
      to: "/asistencias"
    },
    {
      icon: <FileText className="text-purple-600 bg-purple-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mi Boletín",
      to: "/boletines"
    }
  ]
}

// KPIs mejorados y específicos por rol - SOLO LOS MÁS IMPORTANTES
const statsByRole = {
  admin: ["totalStudents", "totalTeachers", "totalCourses", "avgAttendance", "avgGrades", "criticalAlerts"],
  docente: ["myCourses", "myStudents", "myAttendanceDocente", "myGrades"],
  alumno: ["myAverage", "myAttendance", "approvedSubjects", "totalSubjects"]
}


// Metadatos de KPIs mejorados - SOLO LOS ESENCIALES
const kpiMeta = {
  // Admin KPIs
  totalStudents: {
    icon: Users,
    className: "blue",
    title: "Estudiantes",
    description: "Total de estudiantes activos"
  },
  totalTeachers: {
    icon: GraduationCap,
    className: "purple",
    title: "Docentes",
    description: "Docentes registrados"
  },
  totalCourses: {
    icon: BookOpen,
    className: "green",
    title: "Cursos",
    description: "Cursos activos"
  },
  avgAttendance: {
    icon: TrendingUp,
    className: "emerald",
    title: "Asistencia Promedio",
    description: "Promedio general de asistencia (%)"
  },
  avgGrades: {
    icon: Award,
    className: "yellow",
    title: "Promedio General",
    description: "Promedio de calificaciones (0-10)"
  },
  criticalAlerts: {
    icon: AlertCircle,
    className: "red",
    title: "Alertas Críticas",
    description: "Requieren atención inmediata"
  },
  
  // Docente KPIs
  myCourses: {
    icon: BookOpen,
    className: "blue",
    title: "Mis Cursos",
    description: "Cursos asignados"
  },
  myStudents: {
    icon: Users,
    className: "green",
    title: "Mis Estudiantes",
    description: "Estudiantes a cargo"
  },
  myAttendanceDocente: {
    icon: TrendingUp,
    className: "emerald",
    title: "Asistencia Promedio",
    description: "Promedio de mis cursos (%)"
  },
  myGrades: {
    icon: Award,
    className: "yellow",
    title: "Promedio General",
    description: "Promedio de mis materias (0-10)"
  },
  
  // Alumno KPIs
  myAverage: {
    icon: Award,
    className: "blue",
    title: "Mi Promedio",
    description: "Promedio general actual (0-10)"
  },
  myAttendance: {
    icon: TrendingUp,
    className: "green",
    title: "Mi Asistencia",
    description: "Porcentaje de asistencia (%)"
  },
  approvedSubjects: {
    icon: CheckCircle,
    className: "emerald",
    title: "Materias Aprobadas",
    description: "Materias con promedio ≥ 7"
  },
  totalSubjects: {
    icon: BookOpen,
    className: "purple",
    title: "Total Materias",
    description: "Materias en las que estoy inscrito"
  }
}

function QuickAccessList({ role }: { role: keyof typeof quickAccessByRole }) {
  const items = quickAccessByRole[role] || []
  return (
    <div className="flex flex-col w-full gap-3">
      {items.map((item, idx) => (
        <Link
          to={item.to}
          key={idx}
          className="flex w-full items-center gap-4 hover:bg-blue-50 rounded-lg p-3 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-blue-200"
        >
          {item.icon}
          <span className="text-base font-semibold text-gray-700">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}


export default function Dashboard() {
  const { user, loading } = useContext(AuthContext)
  const [stats, setStats] = useState<any>({})
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
      ? (calificaciones.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) / calificaciones.length).toFixed(1)
      : "0.0";

    const presentCount = asistencias.filter((a: any) => a.present).length;
    const avgAttendance = asistencias.length > 0
      ? `${Math.round((presentCount / asistencias.length) * 100)}%`
      : "0%";

    // Calcular estadísticas específicas por rol
    const roleStats: any = {
      totalStudents,
      totalTeachers,
      totalCourses,
      avgAttendance,
      avgGrades,
      criticalAlerts: 0,
    };

    // Estadísticas específicas por rol del usuario
    if (user?.role === 'docente' && user?.teacherId) {
      // Crear maps para búsqueda más rápida
      const teacherMap = new Map(teachers.map(t => [t.firestoreId || '', t]));

      const teacherInfo = teacherMap.get(user.teacherId);
      if (teacherInfo) {
        const teacherCourses = courses.filter(c => c.firestoreId === teacherInfo.cursoId);
        const teacherSubjects = subjects.filter(s => s.cursoId === teacherInfo.cursoId);
        const teacherStudents = students.filter(s => 
          teacherCourses.some(c => c.firestoreId === s.cursoId)
        );
        
        // Calcular asistencia del docente de forma optimizada
        const teacherSubjectIds = new Set(teacherSubjects.map(s => s.firestoreId));
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
        
        const teacherGradesSum = teacherCalificaciones.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
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

        const studentsAtRisk = teacherStudents.filter(student => {
          const grades = studentGradesMap.get(student.firestoreId || '') || [];
          if (grades.length === 0) return false;
          const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
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
        const gradesSum = studentCalificaciones.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
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
  }, [students, courses, teachers, calificaciones, asistencias, subjects, user]);

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
      const match = periodoActual.match(/(\d{4})-T(\d)/);
      if (!match) return undefined;
      const year = parseInt(match[1]);
      const trimestre = parseInt(match[2]);
      if (trimestre === 1) {
        return `${year - 1}-T3`;
      } else {
        return `${year}-T${trimestre - 1}`;
      }
    };

    const periodoActual = getPeriodoActual();
    const periodoAnterior = obtenerPeriodoAnterior(periodoActual);

    switch (user?.role) {
      case 'admin':
        // Para admin: alertas de todos los estudiantes
        return students.flatMap((student: any) => {
          const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === student.firestoreId);
          const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === student.firestoreId);
          
          if (calificacionesAlumno.length === 0) return [];

          const datosAlumno: DatosAlumno = {
            studentId: student.firestoreId,
            calificaciones: calificacionesAlumno as any,
            asistencias: asistenciasAlumno as any,
            periodoActual,
            periodoAnterior
          };

          return generarAlertasAutomaticas(datosAlumno, `${student.nombre} ${student.apellido}`);
        });

      case 'docente':
        // Para docente: alertas de sus estudiantes
        const teacher = teachers.find((t: any) => t.firestoreId === user?.teacherId);
        if (!teacher) return [];

        const teacherStudents = students.filter((student: any) => student.cursoId === teacher.cursoId);
        
        return teacherStudents.flatMap((student: any) => {
          const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === student.firestoreId);
          const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === student.firestoreId);
          
          if (calificacionesAlumno.length === 0) return [];

          const datosAlumno: DatosAlumno = {
            studentId: student.firestoreId,
            calificaciones: calificacionesAlumno as any,
            asistencias: asistenciasAlumno as any,
            periodoActual,
            periodoAnterior
          };

          return generarAlertasAutomaticas(datosAlumno, `${student.nombre} ${student.apellido}`);
        });

      case 'alumno':
        // Para alumno: sus propias alertas
        if (!user?.studentId) return [];

        const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === user.studentId);
        const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === user.studentId);
        
        if (calificacionesAlumno.length === 0) return [];

        const datosAlumno: DatosAlumno = {
          studentId: user.studentId,
          calificaciones: calificacionesAlumno as any,
          asistencias: asistenciasAlumno as any,
          periodoActual,
          periodoAnterior
        };

        return generarAlertasAutomaticas(datosAlumno, user.name || "Estudiante");

      default:
        return [];
    }
  }, [user, calificaciones, asistencias, students, teachers]);

  // Calcular estadísticas de alertas normales (de la base de datos)
  useEffect(() => {
    if (!alerts) return;

    let filteredAlerts = alerts;
    
    // Filtrar alertas según el rol
    if (user?.role === "docente" && user?.teacherId) {
      filteredAlerts = alerts.filter((a: any) => a.createdBy === user.teacherId || a.targetUserRole === "docente");
    } else if (user?.role === "alumno" && user?.studentId) {
      filteredAlerts = alerts.filter((a: any) => a.targetUserId === user.studentId);
    }
    
    const normalAlertStatsData = {
      total: filteredAlerts.length,
      critical: filteredAlerts.filter((a: any) => a.priority === "critical").length,
      pending: filteredAlerts.filter((a: any) => a.status === "pending").length,
    };
    
    setAlertStats(normalAlertStatsData);
    
    // Actualizar estadísticas de admin con alertas críticas normales
    if (user?.role === "admin") {
      setStats((prev: any) => ({
        ...prev,
        criticalAlerts: normalAlertStatsData.critical
      }));
    }
  }, [alerts, user]);

  // Actualizar estadísticas de alertas automáticas
  useEffect(() => {
    const automaticAlertStatsData = {
      total: alertasAutomaticas.length,
      critical: alertasAutomaticas.filter((a: any) => a.prioridad === "critica").length,
      pending: alertasAutomaticas.filter((a: any) => !a.leida).length,
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
    <div className="space-y-8">

      {/* Alertas Automáticas Críticas */}
      
      <WelcomeMessage user={user} />
      
      {/* KPIs Principales */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        {statsByRole[role as keyof typeof statsByRole]?.map(key => {
          const kpiKey = key as keyof typeof kpiMeta
          return (
            <StatsCard
              key={kpiKey}
              value={stats[kpiKey] || 0}
              icon={kpiMeta[kpiKey].icon}
              label={kpiMeta[kpiKey].title}
              color={kpiMeta[kpiKey].className}
              subtitle={kpiMeta[kpiKey].description}
            />
          )
        })}
      </div>

      {/* Acceso Rápido */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <ReutilizableCard full title="Acceso Rápido" description="Enlaces rápidos a secciones importantes">
            <div className="space-y-3">
              <QuickAccessList role={role as keyof typeof quickAccessByRole} />
            </div>
          </ReutilizableCard>
        </div>
        
        <div className="lg:col-span-1">
          
            <ReutilizableCard full title="Alertas" description="Gestión de alertas">
              <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                <div className="p-3 bg-red-100 rounded-full mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <span className="text-gray-700 font-medium">Alertas</span>
                <span className="text-2xl font-bold text-red-600 mt-2">{alertStats.total || 0}</span>
                <span className="text-gray-500 text-sm mt-1">Alertas</span>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Inasistencias, calificaciones</p>
                  <p>bajas y eventos del sistema</p>
                </div>
                <Link to="/alertas" className="w-full">
                  <Button variant={"destructive"} className="mt-4 w-full">Ver Alertas</Button>
                </Link>
              </div>
            </ReutilizableCard>
        </div>
        
        <div className="lg:col-span-1">
          <ReutilizableCard full title="Alertas generadas" description="Alertas generadas por IA">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 bg-green-100 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">Alertas generadas</span>
              <span className="text-2xl font-bold text-green-600 mt-2">{automaticAlertStats.total || 0}</span>
              <span className="text-gray-500 text-sm mt-1">Alertas generadas por IA</span>
              <div className="mt-4 text-sm text-gray-600">
                <p>Rendimiento, asistencia</p>
                <p>y tendencias detectadas</p>
              </div>
            </div>
          </ReutilizableCard>
        </div>
      </div>
    </div>
  )
}

function WelcomeMessage({ user }: { user: any }) {
  const currentHour = new Date().getHours();
  let greeting = "";
  let IconComponent = Sun;

  if (currentHour < 6) {
    greeting = "Buenas noches";
    IconComponent = Moon;
  } else if (currentHour < 12) {
    greeting = "Buenos días";
    IconComponent = Sunrise;
  } else if (currentHour < 18) {
    greeting = "Buenas tardes";
    IconComponent = Sun;
  } else {
    greeting = "Buenas noches";
    IconComponent = Moon;
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
    <div className="mb-8 flex items-center gap-4">
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
        <IconComponent className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {greeting}, {user?.name || "Usuario"}!
        </h1>
        <p className="text-gray-600">
          Bienvenido al panel de {getRoleDisplayName(user?.role)}. Aquí tienes un resumen de la actividad de tu institución educativa.
        </p>
      </div>
    </div>
  );
}

