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
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Award,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  BarChart,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon
} from "lucide-react";
import { toast } from "sonner";

interface Reporte {
  firestoreId: string;
  titulo: string;
  tipo: 'academico' | 'asistencia' | 'comportamiento' | 'rendimiento' | 'tendencias';
  descripcion: string;
  cursoId?: string;
  materiaId?: string;
  periodo: string;
  fechaCreacion: string;
  creadoPor: string;
  estado: 'generado' | 'procesando' | 'error';
  datos: any;
  configuracion: {
    grafico: 'linea' | 'barras' | 'pastel' | 'dispersión';
    filtros: string[];
    agrupacion: string;
  };
}

interface EstadisticasReportes {
  totalReportes: number;
  reportesGenerados: number;
  reportesProcesando: number;
  reportesError: number;
  reportesPopulares: string[];
  ultimaGeneracion: string;
}

export default function ReportesInteligentesOverview() {
  const { user } = useContext(AuthContext);
  const [selectedPeriodo, setSelectedPeriodo] = useState("2024");
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Datos simulados para demostración
  const reportes: Reporte[] = [
    {
      firestoreId: "1",
      titulo: "Rendimiento Académico General",
      tipo: "academico",
      descripcion: "Análisis completo del rendimiento académico de todos los estudiantes",
      periodo: "2024",
      fechaCreacion: "2024-01-15",
      creadoPor: "admin",
      estado: "generado",
      datos: { promedio: 8.5, aprobados: 85, reprobados: 15 },
      configuracion: {
        grafico: "barras",
        filtros: ["curso", "materia"],
        agrupacion: "por_estudiante"
      }
    },
    {
      firestoreId: "2",
      titulo: "Tendencias de Asistencia",
      tipo: "asistencia",
      descripcion: "Evolución de la asistencia a lo largo del año escolar",
      periodo: "2024",
      fechaCreacion: "2024-01-10",
      creadoPor: "admin",
      estado: "generado",
      datos: { promedioAsistencia: 92, tendencia: "positiva" },
      configuracion: {
        grafico: "linea",
        filtros: ["mes", "curso"],
        agrupacion: "por_mes"
      }
    },
    {
      firestoreId: "3",
      titulo: "Análisis de Comportamiento",
      tipo: "comportamiento",
      descripcion: "Reporte de incidentes y comportamiento estudiantil",
      periodo: "2024",
      fechaCreacion: "2024-01-08",
      creadoPor: "admin",
      estado: "procesando",
      datos: { incidentes: 5, mejoras: 80 },
      configuracion: {
        grafico: "pastel",
        filtros: ["tipo_incidente", "curso"],
        agrupacion: "por_tipo"
      }
    }
  ];

  const estadisticas: EstadisticasReportes = {
    totalReportes: 15,
    reportesGenerados: 12,
    reportesProcesando: 2,
    reportesError: 1,
    reportesPopulares: ["Rendimiento Académico", "Tendencias de Asistencia", "Análisis de Comportamiento"],
    ultimaGeneracion: "2024-01-15 10:30"
  };

  const filteredReportes = reportes.filter(reporte => {
    if (selectedTipo !== "todos" && reporte.tipo !== selectedTipo) return false;
    if (searchQuery && !reporte.titulo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleGenerarReporte = async () => {
    setIsGenerating(true);
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Reporte generado exitosamente");
    } catch (error) {
      toast.error("Error al generar el reporte");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDescargarReporte = (reporteId: string) => {
    toast.success("Descarga iniciada");
  };

  const handleVerReporte = (reporteId: string) => {
    setSelectedReporte(reporteId);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "generado":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Generado</Badge>;
      case "procesando":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Procesando</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "academico":
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

  const getGraficoIcon = (tipo: string) => {
    switch (tipo) {
      case "linea":
        return <LineChartIcon className="h-4 w-4" />;
      case "barras":
        return <BarChartIcon className="h-4 w-4" />;
      case "pastel":
        return <PieChartIcon className="h-4 w-4" />;
      case "dispersión":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reportes Inteligentes</h1>
              <p className="text-gray-600 mt-2">
                Genera y visualiza reportes avanzados de rendimiento académico
              </p>
            </div>
            <Button onClick={handleGenerarReporte} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Nuevo Reporte
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
                  <p className="text-sm font-medium text-gray-600">Total Reportes</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalReportes}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Generados</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.reportesGenerados}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Procesando</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.reportesProcesando}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Con Errores</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.reportesError}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
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
                  placeholder="Buscar reportes..."
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
                  <SelectValue placeholder="Tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="academico">Académico</SelectItem>
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
                    <SelectItem value="generado">Generado</SelectItem>
                    <SelectItem value="procesando">Procesando</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Reportes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReportes.map((reporte) => (
            <Card key={reporte.firestoreId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTipoIcon(reporte.tipo)}
                    <div>
                      <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                      <p className="text-sm text-gray-600">{reporte.descripcion}</p>
                    </div>
                  </div>
                  {getEstadoBadge(reporte.estado)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Período:</span>
                    <Badge variant="outline">{reporte.periodo}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Gráfico:</span>
                    <div className="flex items-center gap-1">
                      {getGraficoIcon(reporte.configuracion.grafico)}
                      <span className="text-xs capitalize">{reporte.configuracion.grafico}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fecha:</span>
                    <span>{new Date(reporte.fechaCreacion).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerReporte(reporte.firestoreId)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDescargarReporte(reporte.firestoreId)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReportes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes</h3>
              <p className="text-gray-600">No se encontraron reportes con los filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 