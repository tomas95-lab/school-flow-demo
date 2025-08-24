
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  Send, 
  Users, 
  User, 
  Settings, 
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Inbox,
  Bell,
  Shield,
  Clock,
  CheckCircle,
  BarChart3,
  Paperclip,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaMensajeria = () => {
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
        titulo: "Gestión Completa de Mensajería",
        descripcion: "Administra toda la comunicación del sistema educativo.",
        icon: Settings,
        pasos: [
          "Accede al panel de administración de mensajes",
          "Supervisa conversaciones entre usuarios",
          "Gestiona grupos y canales institucionales",
          "Configura políticas de comunicación",
          "Modera contenido cuando sea necesario"
        ]
      },
      {
        titulo: "Comunicación Masiva",
        descripcion: "Envía anuncios y comunicados a toda la institución.",
        icon: Send,
        pasos: [
          "Ve a la sección 'Comunicados'",
          "Selecciona audiencia (estudiantes, docentes, padres)",
          "Redacta el mensaje institucional",
          "Programa fecha y hora de envío",
          "Confirma y envía el comunicado"
        ]
      },
      {
        titulo: "Análisis y Reportes",
        descripcion: "Analiza patrones de comunicación y engagement.",
        icon: BarChart3,
        pasos: [
          "Consulta estadísticas de mensajería",
          "Analiza actividad por usuario y grupo",
          "Genera reportes de comunicación",
          "Identifica problemas de comunicación"
        ]
      }
    ],
    docente: [
      {
        titulo: "Comunicación con Estudiantes",
        descripcion: "Mantén comunicación directa con tus estudiantes.",
        icon: MessageSquare,
        pasos: [
          "Ve a la pestaña 'Estudiantes'",
          "Selecciona un estudiante o grupo de la lista",
          "Escribe tu mensaje en el campo de texto",
          "Adjunta archivos si es necesario",
          "Envía el mensaje con el botón 'Enviar'"
        ]
      },
      {
        titulo: "Muro de Clase",
        descripcion: "Utiliza el muro para comunicación grupal con cada curso.",
        icon: Users,
        pasos: [
          "Accede a la pestaña 'Muro'",
          "Selecciona el curso correspondiente",
          "Publica anuncios, tareas o recordatorios",
          "Los estudiantes pueden comentar y hacer preguntas",
          "Modera la conversación según sea necesario"
        ]
      },
      {
        titulo: "Comunicación con Padres",
        descripcion: "Mantén informados a los padres sobre el progreso.",
        icon: Users,
        pasos: [
          "Ve a la sección 'Padres/Tutores'",
          "Busca al padre del estudiante",
          "Envía reportes de progreso",
          "Programa reuniones virtuales",
          "Comparte documentos importantes"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Consultar Mensajes",
        descripcion: "Lee y responde mensajes de docentes y administración.",
        icon: Inbox,
        pasos: [
          "Accede a tu bandeja de entrada",
          "Lee mensajes no leídos (marcados en negrita)",
          "Responde a consultas de docentes",
          "Marca mensajes importantes como favoritos"
        ]
      },
      {
        titulo: "Participar en Muro de Clase",
        descripcion: "Interactúa en el espacio grupal de tu curso.",
        icon: MessageCircle,
        pasos: [
          "Ve al muro de tu curso",
          "Lee anuncios de tus docentes",
          "Haz preguntas sobre tareas o materias",
          "Comenta de manera respetuosa",
          "Ayuda a compañeros cuando puedas"
        ]
      },
      {
        titulo: "Comunicación con Docentes",
        descripcion: "Contacta directamente con tus profesores.",
        icon: User,
        pasos: [
          "Busca al docente en tu lista de contactos",
          "Escribe consultas específicas sobre materias",
          "Solicita aclaraciones sobre tareas",
          "Informa sobre situaciones especiales",
          "Mantén un tono respetuoso y profesional"
        ]
      }
    ]
  };

  const caracteristicasPlataforma = [
    {
      caracteristica: "Mensajes Directos",
      descripcion: "Comunicación uno a uno entre usuarios del sistema.",
      icon: MessageSquare,
      disponible: ["admin", "docente", "alumno"]
    },
    {
      caracteristica: "Muro de Clase",
      descripcion: "Espacio grupal para cada curso con posts y comentarios.",
      icon: Users,
      disponible: ["docente", "alumno"]
    },
    {
      caracteristica: "Comunicados",
      descripcion: "Anuncios institucionales para toda la comunidad.",
      icon: Send,
      disponible: ["admin"]
    },
    {
      caracteristica: "Archivos Adjuntos",
      descripcion: "Comparte documentos, imágenes y recursos.",
      icon: Paperclip,
      disponible: ["admin", "docente", "alumno"]
    },
    {
      caracteristica: "Notificaciones",
      descripcion: "Alertas automáticas por nuevos mensajes.",
      icon: Bell,
      disponible: ["admin", "docente", "alumno"]
    },
    {
      caracteristica: "Moderación",
      descripcion: "Control de contenido y supervisión de conversaciones.",
      icon: Shield,
      disponible: ["admin", "docente"]
    }
  ];

  const buenasPracticas = [
    "Mantén un lenguaje respetuoso y profesional en todo momento",
    "Responde a mensajes importantes dentro de 24 horas",
    "Usa el muro de clase para comunicación grupal, mensajes directos para temas personales",
    "Adjunta archivos relevantes para enriquecer la comunicación",
    "Revisa tu bandeja de entrada regularmente",
    "Utiliza asuntos claros y descriptivos",
    "Respeta la privacidad y confidencialidad de otros usuarios",
    "Reporta cualquier comportamiento inapropiado a la administración"
  ];

  const politicasUso = [
    {
      titulo: "Contenido Apropiado",
      descripcion: "Solo contenido educativo y relacionado con actividades académicas."
    },
    {
      titulo: "Respeto Mutuo",
      descripcion: "Todas las comunicaciones deben ser respetuosas y constructivas."
    },
    {
      titulo: "Privacidad",
      descripcion: "No compartir información personal de otros usuarios."
    },
    {
      titulo: "Horarios",
      descripcion: "Respetar horarios de atención para comunicación no urgente."
    }
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
              onClick={() => navigate('/app/mensajes')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía de Mensajería
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
            Aprende a utilizar el sistema de mensajería de EduNova para mantener una comunicación 
            efectiva entre estudiantes, docentes y administración.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Características de la Plataforma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  Características de la Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {caracteristicasPlataforma.map((caracteristica, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <caracteristica.icon className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">{caracteristica.caracteristica}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{caracteristica.descripcion}</p>
                      <div className="flex flex-wrap gap-1">
                        {caracteristica.disponible.map((rol, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {rol === "admin" ? "Admin" : rol === "docente" ? "Docente" : "Estudiante"}
                          </Badge>
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
                  <Users className="h-5 w-5 text-purple-600" />
                  Funcionalidades para {user?.role === "admin" ? "Administradores" : user?.role === "docente" ? "Docentes" : "Estudiantes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {funcionalidades.map((funcionalidad, index) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <funcionalidad.icon className="h-5 w-5 text-purple-600" />
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

            {/* Políticas de Uso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Políticas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {politicasUso.map((politica, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-1">{politica.titulo}</h4>
                      <p className="text-sm text-purple-700">{politica.descripcion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buenas Prácticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  Buenas Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {buenasPracticas.map((practica, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
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
                    onClick={() => navigate('/app/mensajes')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ir a Mensajería
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

            {/* Atajos de Teclado */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Clock className="h-5 w-5" />
                  Atajos de Teclado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Enviar mensaje</span>
                    <Badge variant="outline" className="text-xs">Ctrl + Enter</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Nuevo mensaje</span>
                    <Badge variant="outline" className="text-xs">Ctrl + N</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Buscar contacto</span>
                    <Badge variant="outline" className="text-xs">Ctrl + F</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Insertar emoji</span>
                    <Badge variant="outline" className="text-xs">Ctrl + ;</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de Desarrollo */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Settings className="h-5 w-5" />
                  Estado del Módulo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  El sistema de mensajería está en desarrollo activo. Próximas funcionalidades:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Videollamadas integradas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Mensajes de voz</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Grupos de estudio</span>
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

export default GuiaMensajeria;
