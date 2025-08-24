import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Edit, 
  User, 
  Settings, 
  BookOpen,
  ArrowLeft,
  Shield,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  BarChart3,
  FileText,
  Eye,
  Mail,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaUsuarios = () => {
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
        titulo: "Gestión Completa de Usuarios",
        descripcion: "Administra todos los usuarios del sistema educativo.",
        icon: Users,
        pasos: [
          "Accede al panel principal de usuarios",
          "Visualiza lista completa de estudiantes, docentes y administradores",
          "Utiliza filtros para encontrar usuarios específicos",
          "Gestiona roles y permisos de cada usuario",
          "Supervisa actividad y estado de cuentas"
        ]
      },
      {
        titulo: "Crear y Editar Usuarios",
        descripcion: "Registra nuevos usuarios y modifica información existente.",
        icon: UserPlus,
        pasos: [
          "Haz clic en 'Agregar Usuario'",
          "Completa formulario con datos personales",
          "Asigna rol (estudiante, docente, admin)",
          "Define permisos específicos",
          "Genera credenciales de acceso",
          "Envía información de acceso al usuario"
        ]
      },
      {
        titulo: "Importación Masiva",
        descripcion: "Importa múltiples usuarios desde archivos CSV.",
        icon: Upload,
        pasos: [
          "Ve a la sección 'Importar'",
          "Descarga plantilla CSV de ejemplo",
          "Completa archivo con datos de usuarios",
          "Sube archivo al sistema",
          "Revisa y confirma importación",
          "Supervisa proceso de creación masiva"
        ]
      },
      {
        titulo: "Gestión de Roles y Permisos",
        descripcion: "Administra roles del sistema y permisos específicos.",
        icon: Shield,
        pasos: [
          "Accede a configuración de roles",
          "Define permisos para cada tipo de usuario",
          "Crea roles personalizados si es necesario",
          "Asigna usuarios a roles específicos",
          "Audita permisos regularmente"
        ]
      }
    ],
    docente: [
      {
        titulo: "Consultar Estudiantes",
        descripcion: "Visualiza información de tus estudiantes asignados.",
        icon: Eye,
        pasos: [
          "Accede a la lista de tus estudiantes",
          "Consulta información básica y académica",
          "Revisa historial de calificaciones",
          "Verifica datos de contacto",
          "Consulta información de padres/tutores"
        ]
      },
      {
        titulo: "Actualizar Información",
        descripcion: "Mantén actualizada la información de tus estudiantes.",
        icon: Edit,
        pasos: [
          "Selecciona el estudiante a editar",
          "Actualiza datos de contacto si es necesario",
          "Agrega observaciones académicas",
          "Reporta cambios importantes a administración",
          "Guarda los cambios realizados"
        ]
      },
      {
        titulo: "Comunicación con Padres",
        descripcion: "Gestiona comunicación con padres y tutores.",
        icon: Mail,
        pasos: [
          "Busca datos de contacto de padres",
          "Envía reportes de progreso",
          "Programa reuniones virtuales",
          "Mantén registro de comunicaciones",
          "Escala situaciones importantes a coordinación"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Consultar Mi Perfil",
        descripcion: "Revisa y actualiza tu información personal.",
        icon: User,
        pasos: [
          "Accede a tu perfil de usuario",
          "Revisa datos personales y académicos",
          "Actualiza información de contacto",
          "Verifica datos de emergencia",
          "Solicita cambios a administración si es necesario"
        ]
      },
      {
        titulo: "Gestionar Privacidad",
        descripcion: "Controla la privacidad de tu información.",
        icon: Shield,
        pasos: [
          "Accede a configuración de privacidad",
          "Define qué información es visible",
          "Gestiona permisos de comunicación",
          "Revisa políticas de privacidad",
          "Reporta problemas de privacidad"
        ]
      },
      {
        titulo: "Contactar Docentes",
        descripcion: "Encuentra información de contacto de tus profesores.",
        icon: BookOpen,
        pasos: [
          "Ve a la lista de tus docentes",
          "Consulta horarios de atención",
          "Revisa información de contacto",
          "Programa reuniones cuando sea necesario",
          "Mantén comunicación respetuosa"
        ]
      }
    ]
  };

  const tiposUsuarios = [
    {
      tipo: "Administrador",
      descripcion: "Acceso completo al sistema y gestión institucional.",
      icon: Settings,
      color: "text-red-600",
      permisos: ["Gestión completa", "Configuración sistema", "Reportes avanzados", "Auditoría"]
    },
    {
      tipo: "Docente",
      descripcion: "Gestión académica de cursos y estudiantes asignados.",
      icon: BookOpen,
      color: "text-blue-600",
      permisos: ["Calificaciones", "Asistencias", "Comunicación", "Reportes curso"]
    },
    {
      tipo: "Estudiante",
      descripcion: "Acceso a información académica personal y comunicación.",
      icon: User,
      color: "text-green-600",
      permisos: ["Consulta calificaciones", "Ver asistencias", "Mensajería", "Perfil personal"]
    },
    {
      tipo: "Padre/Tutor",
      descripcion: "Seguimiento del progreso académico de sus hijos.",
      icon: Users,
      color: "text-purple-600",
      permisos: ["Ver progreso hijo", "Comunicación docentes", "Reportes académicos", "Calendario"]
    }
  ];

  const procesosComunes = [
    {
      proceso: "Registro de Usuario",
      pasos: ["Completar formulario", "Validar información", "Asignar rol", "Enviar credenciales"]
    },
    {
      proceso: "Actualización de Datos",
      pasos: ["Localizar usuario", "Editar información", "Validar cambios", "Guardar actualizaciones"]
    },
    {
      proceso: "Gestión de Permisos",
      pasos: ["Seleccionar usuario", "Revisar rol actual", "Modificar permisos", "Aplicar cambios"]
    },
    {
      proceso: "Importación Masiva",
      pasos: ["Preparar archivo CSV", "Validar formato", "Ejecutar importación", "Verificar resultados"]
    }
  ];

  const buenasPracticas = [
    "Mantén la información de usuarios siempre actualizada",
    "Verifica datos antes de crear nuevos usuarios",
    "Utiliza contraseñas seguras y únicas para cada usuario",
    "Revisa permisos regularmente para mantener seguridad",
    "Realiza respaldos periódicos de la base de usuarios",
    "Documenta todos los cambios importantes en usuarios",
    "Capacita a nuevos usuarios sobre el uso del sistema",
    "Mantén políticas claras de privacidad y uso de datos"
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
              onClick={() => navigate('/app/usuarios')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía de Usuarios
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
            Aprende a gestionar el sistema de usuarios de EduNova para administrar estudiantes, 
            docentes y personal administrativo de manera eficiente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tipos de Usuarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Tipos de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tiposUsuarios.map((usuario, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <usuario.icon className={`h-4 w-4 ${usuario.color}`} />
                        <h3 className="font-semibold text-gray-900">{usuario.tipo}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{usuario.descripcion}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Permisos principales:</p>
                        {usuario.permisos.map((permiso, idx) => (
                          <div key={idx} className="text-xs text-gray-500">• {permiso}</div>
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
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Funcionalidades para {user?.role === "admin" ? "Administradores" : user?.role === "docente" ? "Docentes" : "Estudiantes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {funcionalidades.map((funcionalidad, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <funcionalidad.icon className="h-5 w-5 text-indigo-600" />
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

            {/* Procesos Comunes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  Procesos Comunes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {procesosComunes.map((proceso, index) => (
                    <div key={index} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-900 mb-2">{proceso.proceso}</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-700">
                        {proceso.pasos.map((paso, idx) => (
                          <li key={idx}>{paso}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buenas Prácticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600" />
                  Buenas Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {buenasPracticas.map((practica, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
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
                    onClick={() => navigate('/app/usuarios')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ir a Usuarios
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

            {/* Seguridad y Privacidad */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  <Shield className="h-5 w-5" />
                  Seguridad y Privacidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Contraseñas encriptadas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Auditoría de acceso</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Datos protegidos GDPR</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Permisos granulares</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Herramientas Disponibles */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <FileText className="h-5 w-5" />
                  Herramientas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span>Importación CSV</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Download className="h-4 w-4 text-gray-500" />
                    <span>Exportación de datos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Search className="h-4 w-4 text-gray-500" />
                    <span>Búsqueda avanzada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span>Filtros por rol</span>
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

export default GuiaUsuarios;
