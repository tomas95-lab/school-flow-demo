import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Settings, 
  BarChart3, 
  Plus, 
  Brain,
  ArrowLeft,
  Users,
  TrendingUp,
  MessageSquare,
  Zap,
  Eye,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaAlertas = () => {
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
        titulo: "Gestión Completa de Alertas",
        descripcion: "Administra todas las alertas del sistema educativo.",
        icon: Settings,
        pasos: [
          "Accede al panel principal de alertas",
          "Revisa alertas críticas pendientes",
          "Supervisa alertas automáticas generadas por IA",
          "Configura reglas globales de alertas",
          "Administra plantillas de notificaciones"
        ]
      },
      {
        titulo: "Configuración del Sistema",
        descripcion: "Establece parámetros y reglas para alertas automáticas.",
        icon: Settings,
        pasos: [
          "Ve a la pestaña 'Configuración'",
          "Define umbrales para alertas académicas",
          "Configura alertas de asistencia",
          "Establece reglas de comportamiento",
          "Programa alertas recurrentes"
        ]
      },
      {
        titulo: "Análisis y Reportes",
        descripcion: "Analiza patrones y genera reportes de alertas.",
        icon: BarChart3,
        pasos: [
          "Consulta estadísticas de alertas",
          "Analiza tendencias por período",
          "Genera reportes institucionales",
          "Identifica áreas de intervención prioritaria"
        ]
      }
    ],
    docente: [
      {
        titulo: "Crear Alertas Personalizadas",
        descripcion: "Crea alertas específicas para tus estudiantes.",
        icon: Plus,
        pasos: [
          "Ve a la pestaña 'Crear'",
          "Selecciona el tipo de alerta",
          "Elige el estudiante o grupo objetivo",
          "Define la prioridad (baja, media, alta, crítica)",
          "Escribe el mensaje descriptivo",
          "Configura destinatarios (padres, coordinadores)",
          "Programa fecha y hora de envío"
        ]
      },
      {
        titulo: "Gestionar Alertas Activas",
        descripcion: "Supervisa y gestiona alertas de tus estudiantes.",
        icon: Eye,
        pasos: [
          "Revisa alertas pendientes en el dashboard",
          "Marca alertas como resueltas",
          "Agrega seguimientos y observaciones",
          "Escalona alertas críticas cuando sea necesario",
          "Coordina con otros docentes"
        ]
      },
      {
        titulo: "Alertas Inteligentes",
        descripcion: "Utiliza IA para detectar situaciones automáticamente.",
        icon: Brain,
        pasos: [
          "Consulta la pestaña 'IA'",
          "Revisa alertas generadas automáticamente",
          "Valida sugerencias del sistema",
          "Personaliza intervenciones recomendadas",
          "Programa seguimientos automáticos"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Consultar Mis Alertas",
        descripcion: "Revisa alertas y notificaciones dirigidas a ti.",
        icon: Eye,
        pasos: [
          "Accede a tu panel de alertas",
          "Lee alertas marcadas como importantes",
          "Marca alertas como leídas",
          "Responde a alertas que requieren acción"
        ]
      },
      {
        titulo: "Alertas de Rendimiento",
        descripcion: "Recibe notificaciones sobre tu progreso académico.",
        icon: TrendingUp,
        pasos: [
          "Monitorea alertas de calificaciones bajas",
          "Atiende avisos de asistencia irregular",
          "Consulta recomendaciones de mejora",
          "Programa reuniones con docentes si es necesario"
        ]
      },
      {
        titulo: "Comunicación con Docentes",
        descripcion: "Usa alertas para comunicarte con tus profesores.",
        icon: MessageSquare,
        pasos: [
          "Responde a consultas de docentes",
          "Solicita aclaraciones sobre materias",
          "Reporta situaciones especiales",
          "Mantén comunicación fluida con coordinadores"
        ]
      }
    ]
  };

  const tiposAlertas = [
    {
      tipo: "Académica",
      descripcion: "Relacionada con rendimiento escolar y calificaciones.",
      icon: BookOpen,
      color: "text-blue-600",
      ejemplos: ["Calificación baja", "Falta de tareas", "Riesgo de reprobación"]
    },
    {
      tipo: "Asistencia",
      descripcion: "Problemas de puntualidad o ausentismo.",
      icon: Clock,
      color: "text-yellow-600",
      ejemplos: ["Ausencias frecuentes", "Tardanzas reiteradas", "Inasistencia injustificada"]
    },
    {
      tipo: "Comportamental",
      descripcion: "Relacionada con conducta y disciplina.",
      icon: AlertTriangle,
      color: "text-red-600",
      ejemplos: ["Indisciplina en clase", "Conflictos entre estudiantes", "Falta de respeto"]
    },
    {
      tipo: "Positiva",
      descripcion: "Reconocimiento de logros y mejoras.",
      icon: CheckCircle,
      color: "text-green-600",
      ejemplos: ["Excelente rendimiento", "Mejora notable", "Participación destacada"]
    }
  ];

  const nivelesUrgencia = [
    { nivel: "Crítica", descripcion: "Requiere atención inmediata", color: "bg-red-500", ejemplo: "Riesgo de abandono escolar" },
    { nivel: "Alta", descripcion: "Atender en 24 horas", color: "bg-orange-500", ejemplo: "Calificaciones muy bajas" },
    { nivel: "Media", descripcion: "Atender en 2-3 días", color: "bg-yellow-500", ejemplo: "Ausencias frecuentes" },
    { nivel: "Baja", descripcion: "Seguimiento regular", color: "bg-blue-500", ejemplo: "Recordatorios generales" }
  ];

  const mejoresPracticas = [
    "Revisa alertas diariamente para intervención temprana",
    "Utiliza un lenguaje claro y constructivo en las alertas",
    "Documenta todas las acciones tomadas en respuesta a alertas",
    "Coordina con padres y tutores para alertas importantes",
    "Usa las alertas automáticas como complemento, no reemplazo",
    "Mantén un seguimiento sistemático de alertas críticas",
    "Aprovecha los datos de IA para prevenir problemas antes de que escalen"
  ];

  const funcionalidades = funcionalidadesPorRol[user?.role as keyof typeof funcionalidadesPorRol] || funcionalidadesPorRol.alumno;

  return (
    <div className="h-min bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/alertas')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía de Alertas
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
            Aprende a utilizar el sistema de alertas de EduNova para crear, gestionar y responder 
            a notificaciones importantes del ámbito educativo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tipos de Alertas */}
            <Card className='h-min'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-red-600" />
                  Tipos de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tiposAlertas.map((alerta, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <alerta.icon className={`h-4 w-4 ${alerta.color}`} />
                        <h3 className="font-semibold text-gray-900">{alerta.tipo}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{alerta.descripcion}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Ejemplos:</p>
                        {alerta.ejemplos.map((ejemplo, idx) => (
                          <div key={idx} className="text-xs text-gray-500">• {ejemplo}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Niveles de Urgencia */}
            <Card className='h-min'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-600" />
                  Niveles de Urgencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nivelesUrgencia.map((nivel, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${nivel.color}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{nivel.nivel}</span>
                          <span className="text-sm text-gray-600">{nivel.descripcion}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: {nivel.ejemplo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Funcionalidades por Rol */}
            <Card className='h-min'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-600" />
                  Funcionalidades para {user?.role === "admin" ? "Administradores" : user?.role === "docente" ? "Docentes" : "Estudiantes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {funcionalidades.map((funcionalidad, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <funcionalidad.icon className="h-5 w-5 text-red-600" />
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

            {/* Mejores Prácticas */}
            <Card className='h-min'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  Mejores Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mejoresPracticas.map((practica, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
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
            <Card className='h-min'>
              <CardHeader>
                <CardTitle className="text-lg">Navegación Rápida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/alertas')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Ir a Alertas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/dashboard')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alertas Automáticas */}
            <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 h-min">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Brain className="h-5 w-5" />
                  Alertas Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  El sistema de IA genera alertas automáticamente basadas en:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Patrones de calificaciones</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Tendencias de asistencia</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Cambios en comportamiento</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Versión */}
            <Card className='h-min'>
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

export default GuiaAlertas;
