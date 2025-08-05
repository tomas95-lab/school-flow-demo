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
  Bot, 
  MessageSquare, 
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
  Star as StarIcon,
  Play,
  Pause,
  Volume2,
  Mic,
  MicOff,
  Send,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";
import { toast } from "sonner";

interface BotConfiguracion {
  firestoreId: string;
  nombre: string;
  tipo: 'asistente' | 'tutor' | 'notificador' | 'evaluador' | 'comunicador';
  descripcion: string;
  estado: 'activo' | 'inactivo' | 'entrenando' | 'error';
  configuracion: {
    idioma: string;
    personalidad: string;
    conocimientos: string[];
    respuestasAutomaticas: boolean;
    horarioActivo: {
      inicio: string;
      fin: string;
    };
    canales: string[];
  };
  estadisticas: {
    conversaciones: number;
    mensajesEnviados: number;
    satisfaccion: number;
    tiempoRespuesta: number;
  };
  fechaCreacion: string;
  ultimaActualizacion: string;
  version: string;
}

interface EstadisticasBot {
  totalBots: number;
  botsActivos: number;
  botsInactivos: number;
  botsEntrenando: number;
  botsError: number;
  conversacionesTotales: number;
  satisfaccionPromedio: number;
  tiempoRespuestaPromedio: number;
}

export default function BotOverview() {
  const { user } = useContext(AuthContext);
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Datos simulados para demostración
  const bots: BotConfiguracion[] = [
    {
      firestoreId: "1",
      nombre: "Asistente Académico",
      tipo: "asistente",
      descripcion: "Bot especializado en responder preguntas académicas y de orientación estudiantil",
      estado: "activo",
      configuracion: {
        idioma: "español",
        personalidad: "amigable y profesional",
        conocimientos: ["matemáticas", "lengua", "ciencias", "historia"],
        respuestasAutomaticas: true,
        horarioActivo: {
          inicio: "08:00",
          fin: "18:00"
        },
        canales: ["web", "mobile", "chat"]
      },
      estadisticas: {
        conversaciones: 1250,
        mensajesEnviados: 3420,
        satisfaccion: 4.8,
        tiempoRespuesta: 2.3
      },
      fechaCreacion: "2024-01-15",
      ultimaActualizacion: "2024-01-15 10:30",
      version: "2.1"
    },
    {
      firestoreId: "2",
      nombre: "Tutor Virtual",
      tipo: "tutor",
      descripcion: "Bot que proporciona tutoría personalizada en materias específicas",
      estado: "entrenando",
      configuracion: {
        idioma: "español",
        personalidad: "paciente y educativo",
        conocimientos: ["matemáticas avanzadas", "física", "química"],
        respuestasAutomaticas: false,
        horarioActivo: {
          inicio: "09:00",
          fin: "20:00"
        },
        canales: ["web", "mobile"]
      },
      estadisticas: {
        conversaciones: 890,
        mensajesEnviados: 2150,
        satisfaccion: 4.6,
        tiempoRespuesta: 3.1
      },
      fechaCreacion: "2024-01-10",
      ultimaActualizacion: "2024-01-15 09:15",
      version: "1.8"
    },
    {
      firestoreId: "3",
      nombre: "Notificador Escolar",
      tipo: "notificador",
      descripcion: "Bot que envía notificaciones automáticas sobre eventos y recordatorios",
      estado: "activo",
      configuracion: {
        idioma: "español",
        personalidad: "formal y claro",
        conocimientos: ["calendario escolar", "eventos", "recordatorios"],
        respuestasAutomaticas: true,
        horarioActivo: {
          inicio: "07:00",
          fin: "22:00"
        },
        canales: ["email", "sms", "push"]
      },
      estadisticas: {
        conversaciones: 2100,
        mensajesEnviados: 4500,
        satisfaccion: 4.9,
        tiempoRespuesta: 0.5
      },
      fechaCreacion: "2024-01-08",
      ultimaActualizacion: "2024-01-15 08:45",
      version: "1.5"
    },
    {
      firestoreId: "4",
      nombre: "Evaluador Automático",
      tipo: "evaluador",
      descripcion: "Bot que evalúa respuestas y proporciona feedback automático",
      estado: "error",
      configuracion: {
        idioma: "español",
        personalidad: "objetivo y constructivo",
        conocimientos: ["criterios de evaluación", "feedback", "rubricas"],
        respuestasAutomaticas: true,
        horarioActivo: {
          inicio: "00:00",
          fin: "23:59"
        },
        canales: ["web", "api"]
      },
      estadisticas: {
        conversaciones: 650,
        mensajesEnviados: 1800,
        satisfaccion: 4.2,
        tiempoRespuesta: 1.8
      },
      fechaCreacion: "2024-01-05",
      ultimaActualizacion: "2024-01-15 07:30",
      version: "1.2"
    }
  ];

  const estadisticas: EstadisticasBot = {
    totalBots: 8,
    botsActivos: 5,
    botsInactivos: 1,
    botsEntrenando: 1,
    botsError: 1,
    conversacionesTotales: 4790,
    satisfaccionPromedio: 4.6,
    tiempoRespuestaPromedio: 2.0
  };

  const filteredBots = bots.filter(bot => {
    if (selectedTipo !== "todos" && bot.tipo !== selectedTipo) return false;
    if (searchQuery && !bot.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCrearBot = async () => {
    setIsCreating(true);
    try {
      // Simular creación de bot
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Bot creado exitosamente");
    } catch (error) {
      toast.error("Error al crear el bot");
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivarBot = (botId: string) => {
    toast.success("Bot activado");
  };

  const handleDesactivarBot = (botId: string) => {
    toast.success("Bot desactivado");
  };

  const handleTestearBot = async (botId: string) => {
    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Test completado exitosamente");
    } catch (error) {
      toast.error("Error en el test");
    } finally {
      setIsTesting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case "inactivo":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactivo</Badge>;
      case "entrenando":
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Entrenando</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "asistente":
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case "tutor":
        return <Book className="h-5 w-5 text-green-600" />;
      case "notificador":
        return <Bell className="h-5 w-5 text-purple-600" />;
      case "evaluador":
        return <Award className="h-5 w-5 text-orange-600" />;
      case "comunicador":
        return <Users className="h-5 w-5 text-indigo-600" />;
      default:
        return <Bot className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case "web":
        return <Monitor className="h-4 w-4" />;
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Phone className="h-4 w-4" />;
      case "push":
        return <Bell className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bots Inteligentes</h1>
              <p className="text-gray-600 mt-2">
                Administra y monitorea los bots de asistencia educativa
              </p>
            </div>
            <Button onClick={handleCrearBot} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Nuevo Bot
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
                  <p className="text-sm font-medium text-gray-600">Total Bots</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalBots}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.botsActivos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversaciones</p>
                  <p className="text-2xl font-bold text-purple-600">{estadisticas.conversacionesTotales}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción</p>
                  <p className="text-2xl font-bold text-orange-600">{estadisticas.satisfaccionPromedio}/5</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
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
                  placeholder="Buscar bots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de bot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="asistente">Asistente</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="notificador">Notificador</SelectItem>
                  <SelectItem value="evaluador">Evaluador</SelectItem>
                  <SelectItem value="comunicador">Comunicador</SelectItem>
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
                  <SelectItem value="entrenando">Entrenando</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
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
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los canales</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los idiomas</SelectItem>
                    <SelectItem value="español">Español</SelectItem>
                    <SelectItem value="inglés">Inglés</SelectItem>
                    <SelectItem value="portugués">Portugués</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Versión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las versiones</SelectItem>
                    <SelectItem value="1.0">v1.0</SelectItem>
                    <SelectItem value="1.5">v1.5</SelectItem>
                    <SelectItem value="2.0">v2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Bots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBots.map((bot) => (
            <Card key={bot.firestoreId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getTipoIcon(bot.tipo)}
                    <div>
                      <CardTitle className="text-lg">{bot.nombre}</CardTitle>
                      <p className="text-sm text-gray-600">{bot.descripcion}</p>
                    </div>
                  </div>
                  {getEstadoBadge(bot.estado)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Conversaciones:</span>
                      <span className="ml-2 font-medium">{bot.estadisticas.conversaciones}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mensajes:</span>
                      <span className="ml-2 font-medium">{bot.estadisticas.mensajesEnviados}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Satisfacción:</span>
                      <span className="ml-2 font-medium">{bot.estadisticas.satisfaccion}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Respuesta:</span>
                      <span className="ml-2 font-medium">{bot.estadisticas.tiempoRespuesta}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Canales:</span>
                    <div className="flex gap-1">
                      {bot.configuracion.canales.map(canal => (
                        <div key={canal} className="flex items-center gap-1 text-xs">
                          {getCanalIcon(canal)}
                          <span className="capitalize">{canal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Versión:</span>
                    <span className="font-medium">v{bot.version}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestearBot(bot.firestoreId)}
                      disabled={isTesting}
                      className="flex-1"
                    >
                      {isTesting ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Test
                    </Button>
                    
                    {bot.estado === "activo" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDesactivarBot(bot.firestoreId)}
                        className="flex-1"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivarBot(bot.firestoreId)}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Activar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBots.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bots</h3>
              <p className="text-gray-600">No se encontraron bots con los filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 