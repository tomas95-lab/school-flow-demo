import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Settings, 
  BookOpen,
  ArrowLeft,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Share,
  Clock,
  GraduationCap,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaBoletines = () => {
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
        titulo: "Generación Masiva de Boletines",
        descripcion: "Genera boletines para todos los cursos y estudiantes.",
        icon: FileText,
        pasos: [
          "Accede al panel principal de boletines",
          "Selecciona el período académico (trimestre/semestre)",
          "Elige cursos específicos o todos los cursos",
          "Configura formato y elementos del boletín",
          "Inicia proceso de generación masiva",
          "Supervisa progreso y descarga resultados"
        ]
      },
      {
        titulo: "Supervisión y Auditoría",
        descripcion: "Supervisa la generación y distribución de boletines.",
        icon: Eye,
        pasos: [
          "Revisa estado de boletines por curso",
          "Verifica completitud de calificaciones",
          "Supervisa descargas por padres y estudiantes",
          "Audita cambios y correcciones realizadas",
          "Genera reportes de distribución"
        ]
      },
      {
        titulo: "Configuración del Sistema",
        descripcion: "Configura plantillas y parámetros de boletines.",
        icon: Settings,
        pasos: [
          "Personaliza plantillas de boletín",
          "Define escalas de calificación",
          "Configura períodos académicos",
          "Establece criterios de promoción",
          "Personaliza logos y datos institucionales"
        ]
      }
    ],
    docente: [
      {
        titulo: "Generar Boletines de Mis Cursos",
        descripcion: "Crea boletines para los estudiantes de tus cursos.",
        icon: GraduationCap,
        pasos: [
          "Ve a la sección de boletines",
          "Selecciona el curso específico",
          "Elige el período a reportar",
          "Verifica que todas las calificaciones estén ingresadas",
          "Genera vista previa del boletín",
          "Confirma y genera boletines finales"
        ]
      },
      {
        titulo: "Revisión y Validación",
        descripcion: "Revisa la precisión de los datos antes de la generación.",
        icon: CheckCircle,
        pasos: [
          "Verifica completitud de calificaciones",
          "Revisa comentarios y observaciones",
          "Valida cálculo de promedios",
          "Confirma datos de asistencia",
          "Aprueba boletines para distribución"
        ]
      },
      {
        titulo: "Comunicación con Padres",
        descripcion: "Facilita la entrega y explicación de boletines.",
        icon: Share,
        pasos: [
          "Envía notificaciones de boletines listos",
          "Programa reuniones para explicar resultados",
          "Prepara comentarios constructivos",
          "Coordina planes de mejora con padres",
          "Documenta compromisos acordados"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Consultar Mi Boletín",
        descripcion: "Accede y revisa tu boletín académico personal.",
        icon: Eye,
        pasos: [
          "Ve a la sección de boletines",
          "Selecciona el período que deseas consultar",
          "Revisa tu boletín académico",
          "Analiza tus calificaciones por materia",
          "Consulta comentarios de docentes",
          "Descarga copia para tus archivos"
        ]
      },
      {
        titulo: "Análisis de Mi Progreso",
        descripcion: "Analiza tu rendimiento académico a través del tiempo.",
        icon: TrendingUp,
        pasos: [
          "Compara boletines de diferentes períodos",
          "Identifica materias con mejores resultados",
          "Reconoce áreas que necesitan atención",
          "Establece metas para próximo período",
          "Consulta con docentes sobre dudas"
        ]
      },
      {
        titulo: "Compartir con Familia",
        descripcion: "Comparte tus resultados académicos responsablemente.",
        icon: Users,
        pasos: [
          "Descarga boletín en formato PDF",
          "Revisa resultados antes de compartir",
          "Explica contexto de calificaciones",
          "Discute planes de mejora",
          "Establece compromisos de estudio"
        ]
      }
    ]
  };

  const componentesBoletín = [
    {
      seccion: "Información Personal",
      descripcion: "Datos básicos del estudiante y curso.",
      incluye: ["Nombre completo", "Curso y división", "Período académico", "Fecha de generación"]
    },
    {
      seccion: "Calificaciones por Materia",
      descripcion: "Notas detalladas de cada asignatura.",
      incluye: ["Calificaciones parciales", "Promedio por materia", "Observaciones docente", "Estado (aprobado/reprobado)"]
    },
    {
      seccion: "Resumen Académico",
      descripcion: "Métricas generales de rendimiento.",
      incluye: ["Promedio general", "Materias aprobadas", "Ranking de curso", "Asistencia general"]
    },
    {
      seccion: "Observaciones Generales",
      descripcion: "Comentarios y recomendaciones.",
      incluye: ["Fortalezas identificadas", "Áreas de mejora", "Recomendaciones", "Compromisos para próximo período"]
    }
  ];

  const periodosAcademicos = [
    {
      periodo: "Primer Trimestre",
      meses: "Marzo - Mayo",
      descripcion: "Evaluación inicial del año académico"
    },
    {
      periodo: "Segundo Trimestre", 
      meses: "Junio - Agosto",
      descripcion: "Evaluación intermedia del progreso"
    },
    {
      periodo: "Tercer Trimestre",
      meses: "Septiembre - Noviembre", 
      descripcion: "Evaluación final del año"
    },
    {
      periodo: "Anual",
      meses: "Marzo - Noviembre",
      descripcion: "Resumen completo del año académico"
    }
  ];

  const formatosDisponibles = [
    {
      formato: "PDF Estándar",
      descripcion: "Formato tradicional para impresión y archivo.",
      icon: FileText,
      usos: ["Impresión física", "Archivo digital", "Envío por email"]
    },
    {
      formato: "PDF Interactivo",
      descripcion: "Versión digital con gráficos y enlaces.",
      icon: BarChart3,
      usos: ["Consulta digital", "Análisis interactivo", "Presentaciones"]
    },
    {
      formato: "Reporte Detallado",
      descripcion: "Versión extendida con análisis completo.",
      icon: TrendingUp,
      usos: ["Análisis profundo", "Reuniones con padres", "Planes de mejora"]
    }
  ];

  const mejoresPracticas = [
    "Verifica que todas las calificaciones estén ingresadas antes de generar boletines",
    "Revisa cálculos de promedios y asistencia para evitar errores",
    "Incluye comentarios constructivos y específicos para cada estudiante",
    "Genera boletines con suficiente anticipación para reuniones con padres",
    "Mantén confidencialidad de la información académica",
    "Documenta cualquier corrección realizada después de la generación",
    "Coordina con otros docentes para comentarios integrados",
    "Utiliza los datos del boletín para planificar intervenciones pedagógicas"
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
              onClick={() => navigate('/app/boletines')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía de Boletines
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
            Aprende a generar, consultar y gestionar boletines académicos en EduNova de manera 
            eficiente y precisa para el seguimiento del progreso estudiantil.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Componentes del Boletín */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Componentes del Boletín
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {componentesBoletín.map((componente, index) => (
                    <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">{componente.seccion}</h4>
                      <p className="text-sm text-purple-700 mb-3">{componente.descripcion}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {componente.incluye.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-purple-500" />
                            <span className="text-sm text-purple-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Períodos Académicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Períodos Académicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {periodosAcademicos.map((periodo, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">{periodo.periodo}</h3>
                      </div>
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">{periodo.meses}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{periodo.descripcion}</p>
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

            {/* Mejores Prácticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  Mejores Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mejoresPracticas.map((practica, index) => (
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
                    onClick={() => navigate('/app/boletines')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ir a Boletines
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/calificaciones')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Calificaciones
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/app/dashboard')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Formatos Disponibles */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Download className="h-5 w-5" />
                  Formatos Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formatosDisponibles.map((formato, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <formato.icon className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold text-purple-900 text-sm">{formato.formato}</h4>
                      </div>
                      <p className="text-xs text-purple-700 mb-2">{formato.descripcion}</p>
                      <div className="flex flex-wrap gap-1">
                        {formato.usos.map((uso, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {uso}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recordatorios */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  Recordatorios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Los boletines se generan automáticamente al final de cada período</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Verifica que todas las calificaciones estén completas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Las correcciones deben realizarse antes del cierre del período</span>
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

export default GuiaBoletines;
