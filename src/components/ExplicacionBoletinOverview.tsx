import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Award,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  Info,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Book,
  Calculator,
  PieChart,
  LineChart
} from "lucide-react";
import { toast } from "sonner";

interface ExplicacionBoletin {
  firestoreId: string;
  titulo: string;
  tipo: 'calificacion' | 'asistencia' | 'comportamiento' | 'rendimiento' | 'tendencias';
  descripcion: string;
  cursoId?: string;
  materiaId?: string;
  periodo: string;
  fechaCreacion: string;
  creadoPor: string;
  estado: 'activo' | 'inactivo' | 'borrador';
  contenido: {
    secciones: string[];
    formulas: string[];
    criterios: string[];
    ejemplos: string[];
  };
  configuracion: {
    mostrarFormulas: boolean;
    mostrarEjemplos: boolean;
    mostrarCriterios: boolean;
    idioma: 'español' | 'ingles';
  };
}

interface EstadisticasExplicaciones {
  totalExplicaciones: number;
  explicacionesActivas: number;
  explicacionesInactivas: number;
  explicacionesBorrador: number;
  explicacionesPopulares: string[];
  ultimaActualizacion: string;
}

export default function ExplicacionBoletinOverview() {
  const { user } = useContext(AuthContext);
  const [selectedPeriodo, setSelectedPeriodo] = useState("2024");
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExplicacion, setSelectedExplicacion] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Datos simulados para demostración
  const explicaciones: ExplicacionBoletin[] = [
    {
      firestoreId: "1",
      titulo: "Cálculo de Promedio General",
      tipo: "calificacion",
      descripcion: "Explicación detallada de cómo se calcula el promedio general del estudiante",
      periodo: "2024",
      fechaCreacion: "2024-01-15",
      creadoPor: "admin",
      estado: "activo",
      contenido: {
        secciones: ["Fórmula del promedio", "Ponderación por materia", "Criterios de aprobación"],
        formulas: ["Promedio = (Suma de calificaciones) / Número de materias", "Ponderado = Σ(Calificación × Peso) / Σ(Pesos)"],
        criterios: ["Aprobado: ≥ 6.0", "Promedio alto: ≥ 8.0", "Excelencia: ≥ 9.0"],
        ejemplos: ["Estudiante con calificaciones: 8, 7, 9, 6 → Promedio = 7.5"]
      },
      configuracion: {
        mostrarFormulas: true,
        mostrarEjemplos: true,
        mostrarCriterios: true,
        idioma: "español"
      }
    },
    {
      firestoreId: "2",
      titulo: "Criterios de Asistencia",
      tipo: "asistencia",
      descripcion: "Guía completa sobre los criterios de asistencia y justificaciones",
      periodo: "2024",
      fechaCreacion: "2024-01-10",
      creadoPor: "admin",
      estado: "activo",
      contenido: {
        secciones: ["Porcentaje mínimo de asistencia", "Tipos de justificación", "Consecuencias de inasistencia"],
        formulas: ["Porcentaje = (Días asistidos / Total días) × 100", "Faltas permitidas = Total días × 0.15"],
        criterios: ["Mínimo 85% de asistencia", "Justificación médica válida", "Máximo 3 faltas injustificadas"],
        ejemplos: ["20 días de clase, 17 asistidos → 85% de asistencia"]
      },
      configuracion: {
        mostrarFormulas: true,
        mostrarEjemplos: true,
        mostrarCriterios: true,
        idioma: "español"
      }
    },
    {
      firestoreId: "3",
      titulo: "Evaluación de Comportamiento",
      tipo: "comportamiento",
      descripcion: "Criterios y metodología para evaluar el comportamiento estudiantil",
      periodo: "2024",
      fechaCreacion: "2024-01-08",
      creadoPor: "admin",
      estado: "borrador",
      contenido: {
        secciones: ["Criterios de evaluación", "Escala de comportamiento", "Proceso de mejora"],
        formulas: ["Puntuación = (Puntos positivos - Puntos negativos) / Total observaciones"],
        criterios: ["Excelente: 9-10", "Bueno: 7-8", "Regular: 5-6", "Necesita mejora: <5"],
        ejemplos: ["Estudiante con 8 observaciones positivas y 2 negativas → Puntuación = 6/10"]
      },
      configuracion: {
        mostrarFormulas: true,
        mostrarEjemplos: true,
        mostrarCriterios: true,
        idioma: "español"
      }
    }
  ];

  const estadisticas: EstadisticasExplicaciones = {
    totalExplicaciones: 12,
    explicacionesActivas: 8,
    explicacionesInactivas: 2,
    explicacionesBorrador: 2,
    explicacionesPopulares: ["Cálculo de Promedio", "Criterios de Asistencia", "Evaluación de Comportamiento"],
    ultimaActualizacion: "2024-01-15 10:30"
  };

  const filteredExplicaciones = explicaciones.filter(explicacion => {
    if (selectedTipo !== "todos" && explicacion.tipo !== selectedTipo) return false;
    if (searchQuery && !explicacion.titulo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCrearExplicacion = async () => {
    setIsCreating(true);
    try {
      // Simular creación de explicación
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Explicación creada exitosamente");
    } catch (error) {
      toast.error("Error al crear la explicación");
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerExplicacion = (explicacionId: string) => {
    setSelectedExplicacion(explicacionId);
  };

  const handleEditarExplicacion = (explicacionId: string) => {
    toast.success("Modo edición activado");
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case "inactivo":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactivo</Badge>;
      case "borrador":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Borrador</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "calificacion":
        return <Award className="h-5 w-5 text-blue-600" />;
      case "asistencia":
        return <Calendar className="h-5 w-5 text-green-600" />;
      case "comportamiento":
        return <Users className="h-5 w-5 text-purple-600" />;
      case "rendimiento":
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case "tendencias":
        return <BarChart3 className="h-5 w-5 text-indigo-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explicación de Boletín</h1>
              <p className="text-gray-600 mt-2">
                Guías y explicaciones detalladas sobre criterios de evaluación
              </p>
            </div>
            <Button onClick={handleCrearExplicacion} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Nueva Explicación
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Explicaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalExplicaciones}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.explicacionesActivas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivas</p>
                  <p className="text-2xl font-bold text-gray-600">{estadisticas.explicacionesInactivas}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Borradores</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.explicacionesBorrador}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar explicaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de explicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="calificacion">Calificación</SelectItem>
                  <SelectItem value="asistencia">Asistencia</SelectItem>
                  <SelectItem value="comportamiento">Comportamiento</SelectItem>
                  <SelectItem value="rendimiento">Rendimiento</SelectItem>
                  <SelectItem value="tendencias">Tendencias</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Avanzado
              </Button>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los cursos</SelectItem>
                    <SelectItem value="primaria">Primaria</SelectItem>
                    <SelectItem value="secundaria">Secundaria</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Materia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las materias</SelectItem>
                    <SelectItem value="matematicas">Matemáticas</SelectItem>
                    <SelectItem value="lengua">Lengua</SelectItem>
                    <SelectItem value="ciencias">Ciencias</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Explicaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExplicaciones.map((explicacion) => (
            <Card key={explicacion.firestoreId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTipoIcon(explicacion.tipo)}
                    <div>
                      <CardTitle className="text-lg">{explicacion.titulo}</CardTitle>
                      <p className="text-sm text-gray-600">{explicacion.descripcion}</p>
                    </div>
                  </div>
                  {getEstadoBadge(explicacion.estado)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Período:</span>
                    <Badge variant="outline">{explicacion.periodo}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Secciones:</span>
                    <span className="text-xs text-gray-500">{explicacion.contenido.secciones.length} secciones</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fórmulas:</span>
                    <span className="text-xs text-gray-500">{explicacion.contenido.formulas.length} fórmulas</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fecha:</span>
                    <span>{new Date(explicacion.fechaCreacion).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerExplicacion(explicacion.firestoreId)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditarExplicacion(explicacion.firestoreId)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExplicaciones.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay explicaciones</h3>
              <p className="text-gray-600">No se encontraron explicaciones con los filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 