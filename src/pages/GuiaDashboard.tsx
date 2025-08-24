import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  User, 
  Settings, 
  BookOpen,
  ArrowLeft,
  Activity,
  PieChart,
  Bell,
  CheckCircle,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin": return Settings;
      case "docente": return BookOpen;
      case "alumno": return User;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon(user?.role);

  const funcionalidadesPorRol = {
    admin: [
      {
        titulo: "Vista General Institucional",
        descripcion: "Supervisa todas las métricas clave de la institución.",
        icon: BarChart3,
        pasos: [
          "Revisa KPIs principales en la parte superior",
          "Analiza tendencias de estudiantes, docentes y cursos",
          "Monitorea alertas críticas pendientes",
          "Consulta gráficos de rendimiento general",
          "Identifica áreas que requieren atención inmediata"
        ]
      },
      {
        titulo: "Análisis de Datos",
        descripcion: "Utiliza gráficos y métricas para tomar decisiones informadas.",
        icon: PieChart,
        pasos: [
          "Examina gráficos de rendimiento por curso",
          "Analiza distribución de calificaciones",
          "Revisa tendencias de asistencia mensual",
          "Compara métricas entre diferentes períodos",
          "Exporta datos para análisis externos"
        ]
      },
      {
        titulo: "Gestión de Alertas",
        descripcion: "Supervisa y responde a alertas del sistema.",
        icon: Bell,
        pasos: [
          "Revisa panel de alertas críticas",
          "Analiza alertas generadas por IA",
          "Prioriza intervenciones necesarias",
          "Coordina respuestas con equipo docente",
          "Monitorea resolución de alertas"
        ]
      }
    ],
    docente: [
      {
        titulo: "Panel Personal de Docente",
        descripcion: "Monitorea el progreso de tus cursos y estudiantes.",
        icon: Activity,
        pasos: [
          "Revisa métricas de tus cursos asignados",
          "Consulta promedio de calificaciones de tus materias",
          "Monitorea asistencia promedio de tus estudiantes",
          "Identifica estudiantes que necesitan apoyo",
          "Accede rápidamente a funciones principales"
        ]
      },
      {
        titulo: "Acceso Rápido a Funciones",
        descripcion: "Navega eficientemente a las herramientas principales.",
        icon: Zap,
        pasos: [
          "Usa los enlaces de acceso rápido",
          "Accede directamente a asistencias de tus cursos",
          "Navega a calificaciones de tus materias",
          "Consulta boletines de tus estudiantes",
          "Utiliza atajos de teclado para mayor eficiencia"
        ]
      },
      {
        titulo: "Monitoreo de Estudiantes",
        descripcion: "Supervisa el progreso académico de tus estudiantes.",
        icon: Users,
        pasos: [
          "Revisa alertas de estudiantes en riesgo",
          "Consulta estadísticas de rendimiento",
          "Identifica patrones de asistencia irregular",
          "Planifica intervenciones pedagógicas",
          "Coordina con otros docentes si es necesario"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Mi Progreso Académico",
        descripcion: "Consulta tu rendimiento y estadísticas personales.",
        icon: TrendingUp,
        pasos: [
          "Revisa tu promedio general actual",
          "Consulta tu porcentaje de asistencia",
          "Verifica materias aprobadas vs total",
          "Analiza tu progreso a lo largo del tiempo",
          "Identifica áreas de mejora"
        ]
      },
      {
        titulo: "Navegación Personalizada",
        descripcion: "Accede rápidamente a tus funciones principales.",
        icon: Target,
        pasos: [
          "Usa enlaces de acceso rápido personalizados",
          "Consulta tus calificaciones actuales",
          "Revisa tu historial de asistencias",
          "Accede a tu boletín académico",
          "Mantente al día con notificaciones"
        ]
      },
      {
        titulo: "Alertas Personales",
        descripcion: "Recibe notificaciones sobre tu progreso académico.",
        icon: Bell,
        pasos: [
          "Revisa alertas en el panel lateral",
          "Atiende notificaciones importantes",
          "Consulta recomendaciones de IA",
          "Responde a comunicaciones de docentes",
          "Mantén al día tus tareas y evaluaciones"
        ]
      }
    ]
  };

  const componentesDashboard = [
    {
      componente: "KPIs Principales",
      descripcion: "Métricas clave mostradas en tarjetas destacadas.",
      icon: Target,
      ubicacion: "Parte superior del dashboard",
      funciones: ["Visualización de datos clave", "Comparación con períodos anteriores", "Indicadores de tendencia"]
    },
    {
      componente: "Gráficos Interactivos",
      descripcion: "Visualizaciones de datos en diferentes formatos.",
      icon: PieChart,
      ubicacion: "Sección central principal",
      funciones: ["Gráficos de barras", "Gráficos circulares", "Líneas de tendencia"]
    },
    {
      componente: "Acceso Rápido",
      descripcion: "Enlaces directos a funciones principales por rol.",
      icon: Zap,
      ubicacion: "Panel izquierdo principal",
      funciones: ["Navegación directa", "Funciones contextuales", "Atajos personalizados"]
    },
    {
      componente: "Panel de Alertas",
      descripcion: "Notificaciones y alertas importantes del sistema.",
      icon: Bell,
      ubicacion: "Panel derecho lateral",
      funciones: ["Alertas críticas", "Notificaciones IA", "Estado del sistema"]
    }
  ];

  const filtrosDisponibles = [
    {
      filtro: "Período de Tiempo",
      opciones: ["Última semana", "Últimos 30 días", "Últimos 90 días", "Todo"],
      proposito: "Analizar datos en rangos temporales específicos"
    },
    {
      filtro: "Curso/Materia",
      opciones: ["Todos los cursos", "Cursos específicos", "Por docente"],
      proposito: "Filtrar información por contexto académico"
    },
    {
      filtro: "Tipo de Usuario",
      opciones: ["Estudiantes", "Docentes", "Administradores"],
      proposito: "Segmentar datos por rol de usuario"
    }
  ];

  const mejoresPracticas = [
    "Revisa el dashboard diariamente para mantener visibilidad del estado general",
    "Utiliza los filtros de tiempo para analizar tendencias y patrones",
    "Presta atención especial a las alertas críticas y actúa rápidamente",
    "Aprovecha los enlaces de acceso rápido para navegar eficientemente",
    "Compara métricas entre diferentes períodos para identificar mejoras",
    "Usa los gráficos para presentaciones y reportes a stakeholders",
    "Mantén actualizados los datos consultando regularmente",
    "Coordina con tu equipo basándote en las métricas del dashboard"
  ];

  const funcionalidades = funcionalidadesPorRol[user?.role as keyof typeof funcionalidadesPorRol] || funcionalidadesPorRol.alumno;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/dashboard')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía del Dashboard
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {user?.role === "admin" && "Administrador"}
                    {user?.role === "docente" && "Docente"}
                    {user?.role === "alumno" && "Estudiante"}
                  </Badge>
                  <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-500">EduNova</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-3xl">
            Aprende a utilizar el dashboard de EduNova para monitorear métricas clave, 
            analizar tendencias y acceder rápidamente a las funciones principales del sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Componentes del Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Componentes del Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {componentesDashboard.map((componente, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <componente.icon className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">{componente.componente}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{componente.descripcion}</p>
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs">{componente.ubicacion}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Funciones:</p>
                        {componente.funciones.map((funcion, idx) => (
                          <div key={idx} className="text-xs text-gray-500">• {funcion}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Funcionalidades por Rol */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Funcionalidades para {user?.role === "admin" ? "Administradores" : user?.role === "docente" ? "Docentes" : "Estudiantes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {funcionalidades.map((funcionalidad, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <funcionalidad.icon className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{funcionalidad.titulo}</h3>
                      </div>
                      <p className="text-gray-600 mb-3">{funcionalidad.descripcion}</p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Pasos a seguir:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                          {funcionalidad.pasos.map((paso, pasoIndex) => (
                            <li key={pasoIndex}>{paso}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filtros Disponibles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filtros y Personalización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filtrosDisponibles.map((filtro, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">{filtro.filtro}</h4>
                      </div>
                      <p className="text-sm text-blue-700 mb-2">{filtro.proposito}</p>
                      <div className="flex flex-wrap gap-1">
                        {filtro.opciones.map((opcion, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-white">
                            {opcion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mejores Prácticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Mejores Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mejoresPracticas.map((practica, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{practica}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navegación Rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navegación Rápida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/dashboard')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/asistencias')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Asistencias
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/calificaciones')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Calificaciones
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Atajos de Teclado */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Zap className="h-5 w-5" />
                  Atajos de Teclado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Comando rápido</span>
                    <Badge variant="outline" className="text-xs">Ctrl + K</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ir a Dashboard</span>
                    <Badge variant="outline" className="text-xs">G + D</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ir a Asistencias</span>
                    <Badge variant="outline" className="text-xs">G + A</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ir a Calificaciones</span>
                    <Badge variant="outline" className="text-xs">G + C</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actualización de Datos */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <RefreshCw className="h-5 w-5" />
                  Actualización de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Los datos del dashboard se actualizan automáticamente:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>Cada 5 minutos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <span>Al cambiar de página</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-green-500" />
                    <span>Manual con F5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Versión */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Guía actualizada</p>
                  <p className="text-xs text-gray-400">Versión 1.0 - EduNova</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuiaDashboard;
