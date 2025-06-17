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
  Moon 
} from "lucide-react"
import { ReutilizableCard } from "@/components/ReutilizableCard"
import { useContext, useEffect, useState } from "react"
import { AuthContext } from "@/context/AuthContext"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebaseConfig"
import { SchoolSpinner } from "@/components/SchoolSpinner"
import { Link } from "react-router-dom"

const quickAccessByRole = {
  admin: [
    {
      icon: <PlusCircle className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Crear nuevo Usuario",
      to: "/usuarios/nuevo"
    },
    {
      icon: <Settings className="text-blue-600 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Gestión de Usuarios",
      to: "/usuarios"
    },
    {
      icon: <Book className="text-purple-600 bg-purple-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Gestión de Cursos",
      to: "/cursos"
    },
    {
      icon: <AlertCircle className="text-red-500 bg-red-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Ver Alertas",
      to: "/alertas"
    }
  ],
  docente: [
    {
      icon: <BookOpen className="text-blue-500 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Cursos",
      to: "/mis-cursos"
    },
    {
      icon: <Users className="text-yellow-500 bg-yellow-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Lista de Alumnos",
      to: "/alumnos"
    },
    {
      icon: <AlertCircle className="text-red-500 bg-red-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Alertas",
      to: "/alertas"
    }
  ],
  familiar: [
    {
      icon: <Users className="text-blue-500 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Hijos",
      to: "/mis-hijos"
    },
    {
      icon: <BookOpen className="text-green-500 bg-green-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Calificaciones",
      to: "/calificaciones"
    },
    {
      icon: <AlertCircle className="text-red-500 bg-red-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Alertas",
      to: "/alertas"
    }
  ],
  alumno: [
    {
      icon: <BookOpen className="text-blue-500 bg-blue-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mis Cursos",
      to: "/mis-cursos"
    },
    {
      icon: <Settings className="text-purple-600 bg-purple-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Mi Perfil",
      to: "/perfil"
    },
    {
      icon: <AlertCircle className="text-red-500 bg-red-100 rounded-full w-8 h-8 p-1 shadow" />,
      label: "Alertas",
      to: "/alertas"
    }
  ]
}

const statsByRole = {
  admin: ["alumnos", "docentes", "cursos", "alertas"],
  docente: ["alumnos", "cursos", "alertas"],
  familiar: ["alumnos", "alertas"],
  alumno: ["cursos", "alertas"]
}

const kpiMeta = {
  alumnos: {
    icon: Users,
    className: "text-yellow-500",
    title: "Alumnos",
    description: "Total de estudiantes activos"
  },
  docentes: {
    icon: GraduationCap,
    className: "text-blue-500",
    title: "Docentes",
    description: "Docentes registrados en el sistema"
  },
  cursos: {
    icon: BookOpen,
    className: "text-green-500",
    title: "Cursos",
    description: "Cursos y materias activos"
  },
  alertas: {
    icon: AlertCircle,
    className: "text-red-500",
    title: "Alertas activas",
    description: "Alertas generadas por IA"
  }
}

type StatsCardProps = {
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>
  value: number
  title: string
  description: string
  className?: string
}

function StatsCard({
  IconComponent,
  value,
  title,
  description,
  className
}: StatsCardProps) {
  return (
    <ReutilizableCard full title={title} description={description}>
      <div className="flex items-center gap-4">
        <IconComponent className={`${className} w-8 h-8`} />
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </ReutilizableCard>
  )
}

function QuickAccessList({ role }: { role: keyof typeof quickAccessByRole }) {
  const items = quickAccessByRole[role] || []
  return (
    <div className="flex flex-col w-full items-center gap-4">
      {items.map((item, idx) => (
        <Link
          to={item.to}
          key={idx}
          className="flex w-full items-center gap-4 hover:bg-blue-50 rounded-lg p-2 transition"
        >
          {item.icon}
          <span className="text-base font-semibold">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}

type Alert = { id: string; titulo?: string; descripcion?: string; [key: string]: any }

function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) {
    return <span className="text-gray-500">No hay alertas recientes.</span>
  }
  return (
    <div className="flex flex-col w-full items-center gap-4">
      {alerts.map(alert => (
        <div key={alert.id} className="w-full flex flex-col items-start bg-red-50 rounded-lg p-2 shadow">
          <span className="font-semibold text-red-700">{alert.titulo || "Alerta"}</span>
          <span className="text-gray-700">{alert.descripcion || JSON.stringify(alert)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext)
  const [stats, setStats] = useState({ alumnos: 0, docentes: 0, cursos: 0, alertas: 0 })
  const [latestAlerts, setLatestAlerts] = useState<Alert[]>([])


  useEffect(() => {
    async function fetchData() {
      const [studentsSnap, coursesSnap, notificationsSnap, docentesSnaps] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "notifications")),
        getDocs(collection(db, "teachers"))
      ])
      setStats({
        alumnos: studentsSnap.size,
        docentes: docentesSnaps.size,
        cursos: coursesSnap.size,
        alertas: notificationsSnap.size
      })

      const alertsData = notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setLatestAlerts(alertsData)
    }

    fetchData()
  }, [])

  const role = (user?.role || "alumno").toLowerCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando datos del dashboard..." />
      </div>
    )
  }

  return (
    <div>
      <WelcomeMessage user={user} />
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
        {statsByRole[role as keyof typeof statsByRole]?.map(key => {
          const kpiKey = key as keyof typeof kpiMeta
          return (
            <StatsCard
              key={kpiKey}
              IconComponent={kpiMeta[kpiKey].icon}
              className={kpiMeta[kpiKey].className}
              value={stats[kpiKey]}
              title={kpiMeta[kpiKey].title}
              description={kpiMeta[kpiKey].description}
            />
          )
        })}
      </div>

      <div className="mt-8 grid lg:grid-cols-3 md:grid-cols-1 gap-4">
        <div className="col-span-1">
          <ReutilizableCard full title="Acceso Rápido" description="Enlaces rápidos a secciones importantes">
            <QuickAccessList role={role as keyof typeof quickAccessByRole} />
          </ReutilizableCard>
        </div>
        <div className="lg:col-span-2 h-full">
          <ReutilizableCard full title="Últimas Alertas" description="Alertas recientes generadas por IA">
            <AlertsList alerts={latestAlerts} />
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

  return (
    <div className="mb-8 flex items-center gap-2">
      <IconComponent className="w-10 h-10 text-yellow-500" />
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {greeting}, {user?.name || "Invitado"}!
        </h1>
        <p className="text-gray-600 text-lg">
          Aquí tienes un resumen de la actividad de tu institución educativa.
        </p>
      </div>
    </div>
  );
}

