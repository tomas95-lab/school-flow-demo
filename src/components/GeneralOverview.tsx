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
  Settings, 
  Users, 
  BookOpen, 
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Book,
  Calculator,
  PieChart,
  LineChart,
  Globe,
  Shield,
  Database,
  Wrench,
  Cog,
  Bell,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Activity,
  Zap,
  Heart,
  Star as StarIcon
} from "lucide-react";
import { toast } from "sonner";

interface ConfiguracionGeneral {
  firestoreId: string;
  nombre: string;
  categoria: 'sistema' | 'academico' | 'comunicacion' | 'seguridad' | 'notificaciones';
  descripcion: string;
  valor: string | number | boolean;
  tipo: 'texto' | 'numero' | 'booleano' | 'select' | 'fecha';
  opciones?: string[];
  requerido: boolean;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  fechaCreacion: string;
  actualizadoPor: string;
  version: string;
}

interface EstadisticasGenerales {
  totalConfiguraciones: number;
  configuracionesActivas: number;
  configuracionesInactivas: number;
  configuracionesMantenimiento: number;
  categoriasPopulares: string[];
  ultimaActualizacion: string;
}

export default function GeneralOverview() {
  const { user } = useContext(AuthContext);
  const [selectedCategoria, setSelectedCategoria] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Datos simulados para demostración
  const configuraciones: ConfiguracionGeneral[] = [
    {
      firestoreId: "1",
      nombre: "Nombre de la Institución",
      categoria: "sistema",
      descripcion: "Nombre oficial de la institución educativa",
      valor: "Escuela San Martín",
      tipo: "texto",
      requerido: true,
      estado: "activo",
      fechaCreacion: "2024-01-15",
      actualizadoPor: "admin",
      version: "1.0"
    },
    {
      firestoreId: "2",
      nombre: "Año Académico Actual",
      categoria: "academico",
      descripcion: "Año escolar en curso",
      valor: "2024",
      tipo: "numero",
      requerido: true,
      estado: "activo",
      fechaCreacion: "2024-01-10",
      actualizadoPor: "admin",
      version: "1.0"
    },
    {
      firestoreId: "3",
      nombre: "Notificaciones por Email",
      categoria: "notificaciones",
      descripcion: "Habilitar envío de notificaciones por correo electrónico",
      valor: true,
      tipo: "booleano",
      requerido: false,
      estado: "activo",
      fechaCreacion: "2024-01-08",
      actualizadoPor: "admin",
      version: "1.0"
    },
    {
      firestoreId: "4",
      nombre: "Idioma del Sistema",
      categoria: "sistema",
      descripcion: "Idioma principal de la interfaz",
      valor: "español",
      tipo: "select",
      opciones: ["español", "inglés", "portugués"],
      requerido: true,
      estado: "activo",
      fechaCreacion: "2024-01-05",
      actualizadoPor: "admin",
      version: "1.0"
    },
    {
      firestoreId: "5",
      nombre: "Autenticación de Dos Factores",
      categoria: "seguridad",
      descripcion: "Requerir autenticación de dos factores para usuarios administrativos",
      valor: false,
      tipo: "booleano",
      requerido: false,
      estado: "mantenimiento",
      fechaCreacion: "2024-01-03",
      actualizadoPor: "admin",
      version: "1.0"
    }
  ];

  const estadisticas: EstadisticasGenerales = {
    totalConfiguraciones: 25,
    configuracionesActivas: 20,
    configuracionesInactivas: 3,
    configuracionesMantenimiento: 2,
    categoriasPopulares: ["Sistema", "Académico", "Notificaciones", "Seguridad"],
    ultimaActualizacion: "2024-01-15 10:30"
  };

  const filteredConfiguraciones = configuraciones.filter(config => {
    if (selectedCategoria !== "todos" && config.categoria !== selectedCategoria) return false;
    if (searchQuery && !config.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleGuardarConfiguracion = async (configId: string) => {
    setIsSaving(true);
    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Configuración guardada exitosamente");
      setEditMode(null);
      setEditValue("");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditarConfiguracion = (config: ConfiguracionGeneral) => {
    setEditMode(config.firestoreId);
    setEditValue(String(config.valor));
  };

  const handleCancelarEdicion = () => {
    setEditMode(null);
    setEditValue("");
  };

  const handleRestaurarValor = (configId: string) => {
    toast.success("Valor restaurado al predeterminado");
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case "inactivo":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactivo</Badge>;
      case "mantenimiento":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Mantenimiento</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case "sistema":
        return <Cog className="h-5 w-5 text-blue-600" />;
      case "academico":
        return <BookOpen className="h-5 w-5 text-green-600" />;
      case "comunicacion":
        return <Mail className="h-5 w-5 text-purple-600" />;
      case "seguridad":
        return <Shield className="h-5 w-5 text-red-600" />;
      case "notificaciones":
        return <Bell className="h-5 w-5 text-orange-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const renderValor = (config: ConfiguracionGeneral) => {
    if (editMode === config.firestoreId) {
      switch (config.tipo) {
        case "booleano":
          return (
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sí</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          );
        case "select":
          return (
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.opciones?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        default:
          return (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-40"
            />
          );
      }
    }

    switch (config.tipo) {
      case "booleano":
        return (
          <Badge variant={config.valor ? "default" : "secondary"}>
            {config.valor ? "Sí" : "No"}
          </Badge>
        );
      case "select":
        return <Badge variant="outline">{String(config.valor)}</Badge>;
      default:
        return <span className="text-sm text-gray-700">{String(config.valor)}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
              <p className="text-gray-600 mt-2">
                Administra la configuración general del sistema educativo
              </p>
            </div>
            <Button onClick={() => toast.info("Función de nueva configuración")}>
              <Settings className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Configuraciones</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalConfiguraciones}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.configuracionesActivas}</p>
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
                  <p className="text-2xl font-bold text-gray-600">{estadisticas.configuracionesInactivas}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Mantenimiento</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.configuracionesMantenimiento}</p>
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
                  placeholder="Buscar configuraciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                  <SelectItem value="academico">Académico</SelectItem>
                  <SelectItem value="comunicacion">Comunicación</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="notificaciones">Notificaciones</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="numero">Número</SelectItem>
                  <SelectItem value="booleano">Booleano</SelectItem>
                  <SelectItem value="select">Selección</SelectItem>
                  <SelectItem value="fecha">Fecha</SelectItem>
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
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Requerido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="true">Requerido</SelectItem>
                    <SelectItem value="false">Opcional</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Versión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las versiones</SelectItem>
                    <SelectItem value="1.0">v1.0</SelectItem>
                    <SelectItem value="1.1">v1.1</SelectItem>
                    <SelectItem value="2.0">v2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Configuraciones */}
        <div className="space-y-4">
          {filteredConfiguraciones.map((config) => (
            <Card key={config.firestoreId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getCategoriaIcon(config.categoria)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{config.nombre}</h3>
                        {config.requerido && (
                          <Badge variant="destructive" className="text-xs">Requerido</Badge>
                        )}
                        {getEstadoBadge(config.estado)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{config.descripcion}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Categoría:</span>
                          <span className="ml-2 font-medium capitalize">{config.categoria}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tipo:</span>
                          <span className="ml-2 font-medium capitalize">{config.tipo}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Versión:</span>
                          <span className="ml-2 font-medium">{config.version}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <div className="mb-2">
                        {renderValor(config)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Actualizado: {new Date(config.fechaCreacion).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {editMode === config.firestoreId ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleGuardarConfiguracion(config.firestoreId)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelarEdicion}
                          >
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditarConfiguracion(config)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestaurarValor(config.firestoreId)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredConfiguraciones.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay configuraciones</h3>
              <p className="text-gray-600">No se encontraron configuraciones con los filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 