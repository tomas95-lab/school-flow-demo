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
  MessageSquare,
  FileText,
  Target,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react"
import { ReutilizableCard } from "@/components/ReutilizableCard"
import { useContext, useEffect, useState } from "react"
import { AuthContext } from "@/context/AuthContext"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/firebaseConfig"
import { SchoolSpinner } from "@/components/SchoolSpinner"
import { Link } from "react-router-dom"
import { StatsCard } from "@/components/StatCards"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
    description: "Promedio general de asistencia"
  },
  avgGrades: {
    icon: Award,
    className: "yellow",
    title: "Promedio General",
    description: "Promedio de calificaciones"
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
    description: "Promedio de mis cursos"
  },
  myGrades: {
    icon: Award,
    className: "yellow",
    title: "Promedio General",
    description: "Promedio de mis materias"
  },
  
  // Alumno KPIs
  myAverage: {
    icon: Award,
    className: "blue",
    title: "Mi Promedio",
    description: "Promedio general actual"
  },
  myAttendance: {
    icon: TrendingUp,
    className: "green",
    title: "Mi Asistencia",
    description: "Porcentaje de asistencia"
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

type Alert = { 
  id: string; 
  titulo?: string; 
  descripcion?: string; 
  tipo?: 'critica' | 'importante' | 'informativa';
  fecha?: any;
  [key: string]: any 
}

// Función para obtener el mensaje según el rol
const getRoleMessage = (role: string | undefined) => {
  switch (role) {
    case "admin":
      return "Gestiona y supervisa las asistencias de todos los cursos, docentes y estudiantes del sistema educativo.";
    case "docente":
      return "Registra y administra las asistencias de tus materias y cursos asignados.";
    case "alumno":
      return "Consulta tu historial de asistencias y mantente al día con tu rendimiento académico.";
    default:
      return "Panel de gestión de asistencias del sistema educativo.";
  }
};

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext)
  const [stats, setStats] = useState<any>({})
  const [latestAlerts, setLatestAlerts] = useState<Alert[]>([])
  const [alertStats, setAlertStats] = useState({
    total: 0,
    critical: 0,
    pending: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsSnap, coursesSnap, teachersSnap, calificacionesSnap, asistenciasSnap, subjectsSnap] = await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "calificaciones")),
          getDocs(collection(db, "attendances")),
          getDocs(collection(db, "subjects"))
        ])

        // Convertir snapshots a arrays de datos
        const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        const teachers = teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        const courses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        const calificaciones = calificacionesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        const asistencias = asistenciasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        const subjects = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

        // Calcular estadísticas básicas (admin)
        const totalStudents = students.length
        const totalTeachers = teachers.length
        const totalCourses = courses.length

        // Calcular promedios generales
        const avgGrades = calificaciones.length > 0 
          ? (calificaciones.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) / calificaciones.length).toFixed(1)
          : "0.0"

        const avgAttendance = asistencias.length > 0
          ? Math.round((asistencias.filter((a: any) => a.present).length / asistencias.length) * 100)
          : 0

        // Calcular estadísticas específicas por rol
        const roleStats: any = {
          // Admin stats (siempre disponibles)
          totalStudents,
          totalTeachers,
          totalCourses,
          avgAttendance,
          avgGrades,
          criticalAlerts: 0, // Se calculará después con las alertas
        }

        // Estadísticas específicas por rol del usuario
        if (user?.role === 'docente' && user?.teacherId) {
          // Filtrar datos del docente actual
          const teacherCourses = courses.filter(c => c.teacherId === user.teacherId)
          const teacherSubjects = subjects.filter(s => s.teacherId === user.teacherId)
          const teacherStudents = students.filter(s => 
            teacherCourses.some(c => c.firestoreId === s.cursoId)
          )
          
          // Calcular asistencia del docente
          const teacherAsistencias = asistencias.filter(a => 
            teacherSubjects.some(s => s.firestoreId === a.subjectId)
          )
          const teacherAttendance = teacherAsistencias.length > 0
            ? Math.round((teacherAsistencias.filter(a => a.present).length / teacherAsistencias.length) * 100)
            : 0

          // Calcular calificaciones del docente
          const teacherCalificaciones = calificaciones.filter(c => 
            teacherSubjects.some(s => s.firestoreId === c.subjectId)
          )
          const teacherGrades = teacherCalificaciones.length > 0
            ? (teacherCalificaciones.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) / teacherCalificaciones.length).toFixed(1)
            : "0.0"

          // Estudiantes en riesgo (promedio < 6)
          const studentsAtRisk = teacherStudents.filter(student => {
            const studentGrades = teacherCalificaciones.filter(c => c.studentId === student.firestoreId)
            if (studentGrades.length === 0) return false
            const avg = studentGrades.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) / studentGrades.length
            return avg < 6
          }).length

          // Tareas pendientes (calificaciones sin valor)
          const pendingTasks = teacherCalificaciones.filter(c => !c.valor || c.valor === 0).length

          Object.assign(roleStats, {
            myCourses: teacherCourses.length,
            myStudents: teacherStudents.length,
            myAttendanceDocente: teacherAttendance,
            myGrades: teacherGrades,
            studentsAtRisk,
            pendingTasks
          })
        }

        if (user?.role === 'alumno' && user?.studentId) {
          // Filtrar datos del alumno actual
          const studentInfo = students.find(s => s.firestoreId === user.studentId)
          const studentCalificaciones = calificaciones.filter(c => c.studentId === user.studentId)
          const studentAsistencias = asistencias.filter(a => a.studentId === user.studentId)
          
          // Calcular promedio del alumno
          const myAverage = studentCalificaciones.length > 0
            ? (studentCalificaciones.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) / studentCalificaciones.length).toFixed(1)
            : "0.0"

          // Calcular asistencia del alumno
          const myAttendance = studentAsistencias.length > 0
            ? Math.round((studentAsistencias.filter(a => a.present).length / studentAsistencias.length) * 100)
            : 0

          // Materias del curso del alumno
          const studentSubjects = subjects.filter(s => s.cursoId === studentInfo?.cursoId)
          
          // Materias aprobadas (promedio >= 7)
          const approvedSubjects = studentSubjects.filter(subject => {
            const subjectGrades = studentCalificaciones.filter(c => c.subjectId === subject.firestoreId)
            if (subjectGrades.length === 0) return false
            const avg = subjectGrades.reduce((sum: number, c: any) => sum + (c.valor || 0), 0) / subjectGrades.length
            return avg >= 7
          }).length

          Object.assign(roleStats, {
            myAverage,
            myAttendance,
            approvedSubjects,
            totalSubjects: studentSubjects.length,
            pendingEvaluations: 0, // No hay sistema de evaluaciones pendientes
            unreadMessagesAlumno: 0 // No hay sistema de mensajes
          })
        }

        setStats(roleStats)

        // No hay alertas reales en Firestore, usar array vacío
        setLatestAlerts([])

      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    async function fetchAlerts() {
      try {
        let q = collection(db, "alerts");
        const snapshot = await getDocs(q);
        let alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Filtrar alertas según el rol
        if (user?.role === "docente" && user?.teacherId) {
          alerts = alerts.filter((a: any) => a.createdBy === user.teacherId || a.targetUserRole === "docente");
        } else if (user?.role === "alumno" && user?.studentId) {
          alerts = alerts.filter((a: any) => a.targetUserId === user.studentId);
        }
        
        const alertStatsData = {
          total: alerts.length,
          critical: alerts.filter((a: any) => a.priority === "critical").length,
          pending: alerts.filter((a: any) => a.status === "pending").length,
        };
        
        setAlertStats(alertStatsData);
        
        // Actualizar estadísticas de admin con alertas críticas
        if (user?.role === "admin") {
          setStats((prev: any) => ({
            ...prev,
            criticalAlerts: alertStatsData.critical
          }));
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    }
    fetchAlerts();
  }, [user]);

  const role = (user?.role || "alumno").toLowerCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando datos del dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
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
                  <p>Gestiona y revisa</p>
                  <p>las alertas</p>
                </div>
                <Link to="/alertas" className="w-full">
                  <Button variant={"destructive"} className="mt-4 w-full">Ver Alertas</Button>
                </Link>
              </div>
            </ReutilizableCard>
        </div>
        
        <div className="lg:col-span-1">
          <ReutilizableCard full title="Estado del Sistema" description="Información del sistema">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">Sistema Operativo</span>
              <span className="text-gray-500 text-sm mt-1">Todos los servicios funcionando correctamente</span>
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

