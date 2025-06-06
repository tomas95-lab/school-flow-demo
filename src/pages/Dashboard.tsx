import { Users, GraduationCap, BookOpen, AlertCircle, Plus, PlusCircle, Settings, Book } from "lucide-react";
import { ReutilizableCard } from "@/components/ReutilizableCard";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  console.log("User in Dashboard:", user);
  const [stats, setStats] = useState({
    alumnos: 0,
    docentes: 0,
    cursos: 0,
    alertas: 0,
  });

  // Accesos rápidos por rol
  const quickAccessByRole: Record<string, Array<{
    icon: React.ReactNode,
    label: string,
    to: string
  }>> = {
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
  };

    const [ultimasAlertas, setUltimasAlertas] = useState<any[]>([]);

    useEffect(() => {
    async function fetchData() {
        const [alumnosSnap, usersSnap, cursosSnap, alertasSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "notifications")),
        ]);

        const docentesCount = usersSnap.docs.filter(doc => doc.data().role === "docente").length;

        setStats({
        alumnos: alumnosSnap.size,
        docentes: docentesCount,
        cursos: cursosSnap.size,
        alertas: alertasSnap.size,
        });

        const alertas = alertasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUltimasAlertas(alertas);
    }

    fetchData();
    }, []);

  
  const role = user?.role || "Alumno"; // fallback por si no hay role

  return (
    loading ? (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando datos del dashboard..." />
      </div>
    ) : (
      <div>
        <h1 className="text-4xl font-bold mb-4">Bienvenido, {user?.name ?? "Guest"}!</h1>
        <p className="text-gray-600 mb-8">
          Aquí puedes visualizar un resumen general de la actividad y estado de tu institución educativa.
        </p>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
          <ReutilizableCard title="Alumnos" description="Total de estudiantes activos">
            <div className="flex items-center gap-4">
              <Users className="text-yellow-500 w-8 h-8" />
              <span className="text-2xl font-bold">{stats.alumnos}</span>
            </div>
          </ReutilizableCard>

          <ReutilizableCard title="Docentes" description="Docentes registrados en el sistema">
            <div className="flex items-center gap-4">
              <GraduationCap className="text-blue-500 w-8 h-8" />
              <span className="text-2xl font-bold">{stats.docentes}</span>
            </div>
          </ReutilizableCard>

          <ReutilizableCard title="Cursos" description="Cursos y materias activos">
            <div className="flex items-center gap-4">
              <BookOpen className="text-green-500 w-8 h-8" />
              <span className="text-2xl font-bold">{stats.cursos}</span>
            </div>
          </ReutilizableCard>

          <ReutilizableCard title="Alertas activas" description="Alertas generadas por IA">
            <div className="flex items-center gap-4">
              <AlertCircle className="text-red-500 w-8 h-8" />
              <span className="text-2xl font-bold">{stats.alertas}</span>
            </div>
          </ReutilizableCard>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="col-span-1">
                <ReutilizableCard title="Acceso Rápido" description="Enlaces rápidos a secciones importantes">
                    <div className="flex flex-col w-full items-center gap-4 ">
                    {quickAccessByRole[role?.toLowerCase()]?.map((item, idx) => (
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
                </ReutilizableCard>
            </div>
            <div className="col-span-2 h-full">  
                <ReutilizableCard title="Ultimas Alertas" description="Alertas recientes generadas por IA">
                    <div className="flex flex-col w-full items-center gap-4">
                        {ultimasAlertas && ultimasAlertas.length > 0 ? (
                            ultimasAlertas.map((alerta) => (
                                <div key={alerta.id} className="w-full flex flex-col items-start bg-red-50 rounded-lg p-2 shadow">
                                    <span className="font-semibold text-red-700">{alerta.titulo || "Alerta"}</span>
                                    <span className="text-gray-700">{alerta.descripcion || JSON.stringify(alerta)}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-500">No hay alertas recientes.</span>
                        )}
                        
                    </div>
                </ReutilizableCard>
            </div>
        </div>
      </div>
    )
  );
}
