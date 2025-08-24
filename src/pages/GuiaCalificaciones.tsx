
import { useContext } from 'react'; 
import { AuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Award, 
  Calculator, 
  User, 
  Calendar, 
  BarChart3, 
  Brain,
  ArrowLeft,
  Users,
  TrendingUp,
  FileText,
  Settings,
  Edit,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuiaCalificaciones = () => {
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
        titulo: "Supervisión General",
        descripcion: "Monitorea calificaciones de todos los cursos y docentes.",
        icon: BarChart3,
        pasos: [
          "Accede a la pestaña 'Resumen' para estadísticas generales",
          "Revisa promedios por curso y materia",
          "Analiza tendencias de rendimiento académico",
          "Monitorea alertas de estudiantes en riesgo"
        ]
      },
      {
        titulo: "Gestión de Períodos",
        descripcion: "Administra períodos académicos y configuraciones.",
        icon: Calendar,
        pasos: [
          "Configura trimestres y períodos académicos",
          "Establece fechas límite para carga de notas",
          "Define escalas de calificación",
          "Supervisa cierre de períodos"
        ]
      },
      {
        titulo: "Reportes Avanzados",
        descripcion: "Genera reportes institucionales de rendimiento.",
        icon: FileText,
        pasos: [
          "Accede a reportes estadísticos",
          "Exporta datos para análisis externos",
          "Genera informes comparativos",
          "Analiza tendencias históricas"
        ]
      }
    ],
    docente: [
      {
        titulo: "Registro de Calificaciones",
        descripcion: "Registra y edita calificaciones de tus estudiantes.",
        icon: Edit,
        pasos: [
          "Ve a la pestaña 'Registrar'",
          "Selecciona el curso y la materia",
          "Elige el tipo de evaluación (examen, tarea, proyecto)",
          "Ingresa las calificaciones para cada estudiante",
          "Agrega comentarios y observaciones",
          "Guarda los cambios"
        ]
      },
      {
        titulo: "Calendario de Evaluaciones",
        descripcion: "Planifica y visualiza evaluaciones en calendario.",
        icon: Calendar,
        pasos: [
          "Accede a la pestaña 'Calendario'",
          "Programa fechas de evaluaciones",
          "Marca deadlines de entrega",
          "Visualiza cronograma académico",
          "Coordina con otros docentes"
        ]
      },
      {
        titulo: "Análisis de Rendimiento",
        descripcion: "Analiza el progreso académico de tus estudiantes.",
        icon: TrendingUp,
        pasos: [
          "Consulta gráficos de tendencias",
          "Identifica estudiantes con dificultades",
          "Compara rendimiento entre evaluaciones",
          "Genera reportes para padres"
        ]
      },
      {
        titulo: "Observaciones IA",
        descripcion: "Utiliza inteligencia artificial para análisis automático.",
        icon: Brain,
        pasos: [
          "Revisa sugerencias automáticas",
          "Analiza patrones de rendimiento",
          "Recibe alertas de estudiantes en riesgo",
          "Aplica intervenciones sugeridas"
        ]
      }
    ],
    alumno: [
      {
        titulo: "Consultar Mis Calificaciones",
        descripcion: "Revisa tus calificaciones y promedios actuales.",
        icon: Eye,
        pasos: [
          "Ve a la pestaña 'Resumen' para ver tu promedio general",
          "Consulta calificaciones por materia",
          "Revisa detalles de cada evaluación",
          "Verifica tu progreso trimestral"
        ]
      },
      {
        titulo: "Seguimiento de Progreso",
        descripcion: "Monitorea tu evolución académica a lo largo del tiempo.",
        icon: TrendingUp,
        pasos: [
          "Accede a gráficos de progreso",
          "Compara rendimiento entre trimestres",
          "Identifica materias que necesitan atención",
          "Establece metas de mejora"
        ]
      },
      {
        titulo: "Calendario Académico",
        descripcion: "Consulta fechas importantes y evaluaciones programadas.",
        icon: Calendar,
        pasos: [
          "Revisa fechas de exámenes próximos",
          "Consulta deadlines de proyectos",
          "Planifica tu estudio",
          "Sincroniza con tu calendario personal"
        ]
      }
    ]
  };

  const tiposEvaluacion = [
    {
      tipo: "Examen",
      descripcion: "Evaluación formal con mayor peso en la calificación final.",
      icon: FileText,
      peso: "30-40%",
      color: "text-red-600"
    },
    {
      tipo: "Tarea",
      descripcion: "Actividades regulares para práctica y refuerzo.",
      icon: Edit,
      peso: "20-30%",
      color: "text-blue-600"
    },
    {
      tipo: "Proyecto",
      descripcion: "Trabajos extensos que integran múltiples conceptos.",
      icon: BookOpen,
      peso: "25-35%",
      color: "text-green-600"
    },
    {
      tipo: "Participación",
      descripcion: "Evaluación continua de participación en clase.",
      icon: Users,
      peso: "10-20%",
      color: "text-purple-600"
    }
  ];

  const escalaCalificacion = [
    { rango: "9.0 - 10.0", nivel: "Excelente", descripcion: "Dominio excepcional", color: "bg-green-500" },
    { rango: "8.0 - 8.9", nivel: "Muy Bueno", descripcion: "Dominio sólido", color: "bg-blue-500" },
    { rango: "7.0 - 7.9", nivel: "Bueno", descripcion: "Dominio satisfactorio", color: "bg-yellow-500" },
    { rango: "6.0 - 6.9", nivel: "Suficiente", descripcion: "Dominio básico", color: "bg-orange-500" },
    { rango: "0.0 - 5.9", nivel: "Insuficiente", descripcion: "Requiere refuerzo", color: "bg-red-500" }
  ];

  const mejoresPracticas = [
    "Registra calificaciones inmediatamente después de la evaluación",
    "Proporciona retroalimentación constructiva en cada evaluación",
    "Utiliza diferentes tipos de evaluación para obtener una visión completa",
    "Revisa regularmente el progreso de los estudiantes",
    "Comunica expectativas claras sobre criterios de evaluación",
    "Mantén registro detallado de cada actividad evaluativa",
    "Identifica tempranamente estudiantes que necesitan apoyo adicional"
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
              onClick={() => navigate('/app/calificaciones')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Guía de Calificaciones
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
            Aprende a gestionar el sistema de calificaciones de EduNova para registrar, consultar y analizar 
            el rendimiento académico de manera efectiva.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tipos de Evaluación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Tipos de Evaluación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tiposEvaluacion.map((evaluacion, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <evaluacion.icon className={`h-4 w-4 ${evaluacion.color}`} />
                        <h3 className="font-semibold text-gray-900">{evaluacion.tipo}</h3>
                        <Badge variant="outline" className="text-xs">{evaluacion.peso}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{evaluacion.descripcion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Escala de Calificación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Escala de Calificación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {escalaCalificacion.map((escala, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${escala.color}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{escala.rango}</span>
                          <Badge variant="outline">{escala.nivel}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{escala.descripcion}</p>
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

            {/* Mejores Prácticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Mejores Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mejoresPracticas.map((practica, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Award className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
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
                    onClick={() => navigate('/app/calificaciones')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ir a Calificaciones
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

            {/* Tips Rápidos */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Calculator className="h-5 w-5" />
                  Tips Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Usa Ctrl+S para guardar rápidamente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Los cambios se guardan automáticamente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Usa comentarios para feedback detallado</span>
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

export default GuiaCalificaciones;
