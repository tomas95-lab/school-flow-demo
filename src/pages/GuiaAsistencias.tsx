import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  BarChart3, 
  Upload, 
  Brain,
  ArrowLeft,
  BookOpen,
  Users,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaAsistencias = () => {
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
        titulo: "Vista General de Asistencias",
        descripcion: "Supervisa las asistencias de todos los cursos y docentes.",
        icon: BarChart3,
        pasos: [
          "Accede a la pestaña 'Resumen' para ver estadísticas generales",
          "Revisa los gráficos de tendencias por curso y materia",
          "Monitorea alertas automáticas de asistencia irregular"
        ]
      },
      {
        titulo: "Gestión de Importación",
        descripcion: "Importa asistencias masivamente desde archivos CSV.",
        icon: Upload,
        pasos: [
          "Ve a la pestaña 'Importar'",
          "Descarga la plantilla CSV de ejemplo",
          "Sube tu archivo con los datos de asistencia",
          "Revisa y confirma la importación"
        ]
      },
      {
        titulo: "Análisis Inteligente",
        descripcion: "Utiliza IA para detectar patrones de asistencia.",
        icon: Brain,
        pasos: [
          "Consulta la pestaña 'Observaciones IA'",
          "Revisa alertas automáticas generadas",
          "Analiza estudiantes en riesgo por ausentismo"
        ]
      }
    ],
    docente: [
      {
        titulo: "Registro de Asistencia",
        descripcion: "Registra la asistencia de tus estudiantes diariamente.",
        icon: CheckCircle,
        pasos: [
          "Ve a la pestaña 'Registrar'",
          "Selecciona el curso y la fecha",
          "Marca presente/ausente para cada estudiante",
          "Agrega observaciones si es necesario",
          "Guarda el registro"
        ]
      },
      {
        titulo: "Calendario de Asistencias",
        descripcion: "Visualiza y gestiona las asistencias en formato calendario.",
        icon: Calendar,
        pasos: [
          "Accede a la pestaña 'Calendario'",
          "Navega por fechas usando los controles",
          "Haz clic en cualquier día para ver/editar asistencias",
          "Usa los filtros por curso si tienes varios"
        ]
      },
      {
        titulo: "Reportes y Gráficos",
        descripcion: "Analiza patrones de asistencia de tus estudiantes.",
        icon: TrendingUp,
        pasos: [
          "Consulta la pestaña 'Gráficos'",
          "Revisa tendencias por día de la semana",
          "Analiza asistencia por curso",
          "Identifica estudiantes con problemas de asistencia"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Consultar Mi Asistencia",
        descripcion: "Revisa tu historial de asistencia y estadísticas.",
        icon: User,
        pasos: [
          "Ve a la pestaña 'Resumen' para ver tus estadísticas",
          "Revisa tu porcentaje de asistencia general",
          "Consulta asistencias por materia"
        ]
      },
      {
        titulo: "Calendario Personal",
        descripcion: "Visualiza tus asistencias en formato calendario.",
        icon: Calendar,
        pasos: [
          "Accede a la pestaña 'Calendario'",
          "Navega por fechas para ver tu historial",
          "Identifica patrones en tu asistencia"
        ]
      },
      {
        titulo: "Alertas de Asistencia",
        descripcion: "Recibe notificaciones sobre tu asistencia.",
        icon: AlertCircle,
        pasos: [
          "Revisa alertas automáticas en el dashboard",
          "Atiende recomendaciones de mejora",
          "Consulta con tu docente si tienes dudas"
        ]
      }
    ]
  };

  const conceptosBasicos = [
    {
      termino: "Presente",
      definicion: "El estudiante asistió a la clase en el horario establecido.",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      termino: "Ausente",
      definicion: "El estudiante no asistió a la clase sin justificación.",
      icon: AlertCircle,
      color: "text-red-600"
    },
    {
      termino: "Tardanza",
      definicion: "El estudiante llegó después del horario establecido.",
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      termino: "Justificado",
      definicion: "Ausencia o tardanza con documentación que la respalda.",
      icon: FileText,
      color: "text-blue-600"
    }
  ];

  const mejoresPracticas = [
    "Registra la asistencia al inicio de cada clase",
    "Marca tardanzas cuando el estudiante llegue después de los primeros 10 minutos",
    "Agrega observaciones para casos especiales",
    "Revisa los reportes semanalmente para identificar patrones",
    "Comunica problemas de asistencia a tiempo a los padres",
    "Usa las alertas automáticas para intervención temprana"
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
              onClick={() => navigate('/app/asistencias')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía de Asistencias
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
            Aprende a utilizar el sistema de asistencias de EduNova para registrar, consultar y analizar 
            la asistencia de estudiantes de manera eficiente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conceptos Básicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Conceptos Básicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {conceptosBasicos.map((concepto, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <concepto.icon className={`h-4 w-4 ${concepto.color}`} />
                        <h3 className="font-semibold text-gray-900">{concepto.termino}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{concepto.definicion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Funcionalidades por Rol */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Funcionalidades para {user?.role === "admin" ? "Administradores" : user?.role === "docente" ? "Docentes" : "Estudiantes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {funcionalidades.map((funcionalidad, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <funcionalidad.icon className="h-5 w-5 text-green-600" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Mejores Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mejoresPracticas.map((practica, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
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
                    onClick={() => navigate('/app/asistencias')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ir a Asistencias
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

            {/* Soporte */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <AlertCircle className="h-5 w-5" />
                  ¿Necesitas Ayuda?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Si tienes problemas con el sistema de asistencias, contacta a soporte técnico.
                </p>
                <Button variant="outline" size="sm" className="w-full hover:bg-green-50 hover:border-green-300">
                  Contactar Soporte
                </Button>
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

export default GuiaAsistencias;
