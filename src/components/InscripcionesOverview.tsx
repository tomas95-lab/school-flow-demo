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
  UserPlus, 
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
  GraduationCap,
  School,
  Building,
  Home,
  Car,
  Bus,
  Train,
  Plane,
  CreditCard,
  DollarSign,
  Receipt,
  FileText as FileTextIcon,
  Clipboard,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  Send,
  Archive,
  Clock as ClockIcon
} from "lucide-react";
import { toast } from "sonner";

interface Inscripcion {
  firestoreId: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteApellido: string;
  cursoId: string;
  cursoNombre: string;
  division: string;
  año: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | 'completada';
  fechaInscripcion: string;
  fechaAprobacion?: string;
  documentos: {
    nombre: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fechaSubida: string;
    url?: string;
  }[];
  informacionAdicional: {
    direccion: string;
    telefono: string;
    email: string;
    fechaNacimiento: string;
    nombrePadre?: string;
    nombreMadre?: string;
    telefonoEmergencia: string;
    alergias?: string;
    condicionesMedicas?: string;
  };
  pagos: {
    monto: number;
    estado: 'pendiente' | 'pagado' | 'vencido' | 'reembolsado';
    fechaVencimiento: string;
    fechaPago?: string;
    metodoPago?: string;
  }[];
  observaciones?: string;
  creadoPor: string;
  actualizadoPor: string;
}

interface EstadisticasInscripciones {
  totalInscripciones: number;
  inscripcionesPendientes: number;
  inscripcionesAprobadas: number;
  inscripcionesRechazadas: number;
  inscripcionesCanceladas: number;
  inscripcionesCompletadas: number;
  ingresosTotales: number;
  promedioAprobacion: number;
}

export default function InscripcionesOverview() {
  const { user } = useContext(AuthContext);
  const [selectedEstado, setSelectedEstado] = useState("todos");
  const [selectedDivision, setSelectedDivision] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInscripcion, setSelectedInscripcion] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Datos simulados para demostración
  const inscripciones: Inscripcion[] = [
    {
      firestoreId: "1",
      estudianteId: "EST001",
      estudianteNombre: "María",
      estudianteApellido: "González",
      cursoId: "CUR001",
      cursoNombre: "Primer Año",
      division: "Primaria",
      año: "2024",
      estado: "aprobada",
      fechaInscripcion: "2024-01-15",
      fechaAprobacion: "2024-01-18",
      documentos: [
        {
          nombre: "Certificado de Nacimiento",
          estado: "aprobado",
          fechaSubida: "2024-01-15",
          url: "https://ejemplo.com/doc1.pdf"
        },
        {
          nombre: "Certificado de Vacunación",
          estado: "aprobado",
          fechaSubida: "2024-01-15",
          url: "https://ejemplo.com/doc2.pdf"
        },
        {
          nombre: "Formulario de Inscripción",
          estado: "aprobado",
          fechaSubida: "2024-01-15",
          url: "https://ejemplo.com/doc3.pdf"
        }
      ],
      informacionAdicional: {
        direccion: "Av. San Martín 123, Buenos Aires",
        telefono: "+54 11 1234-5678",
        email: "maria.gonzalez@email.com",
        fechaNacimiento: "2018-03-15",
        nombrePadre: "Carlos González",
        nombreMadre: "Ana López",
        telefonoEmergencia: "+54 11 9876-5432",
        alergias: "Polen",
        condicionesMedicas: "Ninguna"
      },
      pagos: [
        {
          monto: 50000,
          estado: "pagado",
          fechaVencimiento: "2024-02-15",
          fechaPago: "2024-01-20",
          metodoPago: "Transferencia bancaria"
        }
      ],
      observaciones: "Estudiante con excelente rendimiento académico previo",
      creadoPor: "admin",
      actualizadoPor: "admin"
    },
    {
      firestoreId: "2",
      estudianteId: "EST002",
      estudianteNombre: "Juan",
      estudianteApellido: "Rodríguez",
      cursoId: "CUR002",
      cursoNombre: "Tercer Año",
      division: "Secundaria",
      año: "2024",
      estado: "pendiente",
      fechaInscripcion: "2024-01-20",
      documentos: [
        {
          nombre: "Certificado de Nacimiento",
          estado: "aprobado",
          fechaSubida: "2024-01-20",
          url: "https://ejemplo.com/doc4.pdf"
        },
        {
          nombre: "Certificado de Vacunación",
          estado: "pendiente",
          fechaSubida: "2024-01-20"
        },
        {
          nombre: "Formulario de Inscripción",
          estado: "aprobado",
          fechaSubida: "2024-01-20",
          url: "https://ejemplo.com/doc5.pdf"
        }
      ],
      informacionAdicional: {
        direccion: "Calle Rivadavia 456, Córdoba",
        telefono: "+54 351 234-5678",
        email: "juan.rodriguez@email.com",
        fechaNacimiento: "2010-07-22",
        nombrePadre: "Miguel Rodríguez",
        nombreMadre: "Carmen Silva",
        telefonoEmergencia: "+54 351 876-5432",
        alergias: "Ninguna",
        condicionesMedicas: "Ninguna"
      },
      pagos: [
        {
          monto: 75000,
          estado: "pendiente",
          fechaVencimiento: "2024-02-20"
        }
      ],
      observaciones: "Pendiente documentación de vacunación",
      creadoPor: "admin",
      actualizadoPor: "admin"
    },
    {
      firestoreId: "3",
      estudianteId: "EST003",
      estudianteNombre: "Sofía",
      estudianteApellido: "Martínez",
      cursoId: "CUR003",
      cursoNombre: "Quinto Año",
      division: "Secundaria",
      año: "2024",
      estado: "rechazada",
      fechaInscripcion: "2024-01-10",
      documentos: [
        {
          nombre: "Certificado de Nacimiento",
          estado: "aprobado",
          fechaSubida: "2024-01-10",
          url: "https://ejemplo.com/doc6.pdf"
        },
        {
          nombre: "Certificado de Vacunación",
          estado: "rechazado",
          fechaSubida: "2024-01-10"
        }
      ],
      informacionAdicional: {
        direccion: "Av. Libertador 789, Rosario",
        telefono: "+54 341 345-6789",
        email: "sofia.martinez@email.com",
        fechaNacimiento: "2008-11-08",
        nombrePadre: "Roberto Martínez",
        nombreMadre: "Laura Fernández",
        telefonoEmergencia: "+54 341 765-4321",
        alergias: "Ninguna",
        condicionesMedicas: "Ninguna"
      },
      pagos: [
        {
          monto: 80000,
          estado: "vencido",
          fechaVencimiento: "2024-02-10"
        }
      ],
      observaciones: "Certificado de vacunación incompleto",
      creadoPor: "admin",
      actualizadoPor: "admin"
    }
  ];

  const estadisticas: EstadisticasInscripciones = {
    totalInscripciones: 45,
    inscripcionesPendientes: 12,
    inscripcionesAprobadas: 25,
    inscripcionesRechazadas: 5,
    inscripcionesCanceladas: 2,
    inscripcionesCompletadas: 1,
    ingresosTotales: 2500000,
    promedioAprobacion: 83.3
  };

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    if (selectedEstado !== "todos" && inscripcion.estado !== selectedEstado) return false;
    if (selectedDivision !== "todos" && inscripcion.division !== selectedDivision) return false;
    if (searchQuery && !inscripcion.estudianteNombre.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !inscripcion.estudianteApellido.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAprobarInscripcion = async (inscripcionId: string) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Inscripción aprobada exitosamente");
    } catch (error) {
      toast.error("Error al aprobar la inscripción");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRechazarInscripcion = async (inscripcionId: string) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Inscripción rechazada");
    } catch (error) {
      toast.error("Error al rechazar la inscripción");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerDetalles = (inscripcionId: string) => {
    setSelectedInscripcion(inscripcionId);
  };

  const handleEditarInscripcion = (inscripcionId: string) => {
    toast.success("Modo edición activado");
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "aprobada":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case "rechazada":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      case "cancelada":
        return <Badge className="bg-gray-100 text-gray-800"><UserX className="h-3 w-3 mr-1" />Cancelada</Badge>;
      case "completada":
        return <Badge className="bg-blue-100 text-blue-800"><CheckSquare className="h-3 w-3 mr-1" />Completada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getDivisionIcon = (division: string) => {
    switch (division) {
      case "Primaria":
        return <School className="h-5 w-5 text-green-600" />;
      case "Secundaria":
        return <GraduationCap className="h-5 w-5 text-blue-600" />;
      case "Superior":
        return <Building className="h-5 w-5 text-purple-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDocumentosCompletados = (documentos: any[]) => {
    const aprobados = documentos.filter(doc => doc.estado === "aprobado").length;
    return `${aprobados}/${documentos.length}`;
  };

  const getPagosCompletados = (pagos: any[]) => {
    const pagados = pagos.filter(pago => pago.estado === "pagado").length;
    return `${pagados}/${pagos.length}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Inscripciones</h1>
              <p className="text-gray-600 mt-2">
                Administra el proceso de inscripción de estudiantes
              </p>
            </div>
            <Button onClick={() => toast.info("Función de nueva inscripción")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nueva Inscripción
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inscripciones</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalInscripciones}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.inscripcionesAprobadas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.inscripcionesPendientes}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-purple-600">${estadisticas.ingresosTotales.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
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
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="División" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las divisiones</SelectItem>
                  <SelectItem value="Primaria">Primaria</SelectItem>
                  <SelectItem value="Secundaria">Secundaria</SelectItem>
                  <SelectItem value="Superior">Superior</SelectItem>
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
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los años</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los cursos</SelectItem>
                    <SelectItem value="Primer Año">Primer Año</SelectItem>
                    <SelectItem value="Segundo Año">Segundo Año</SelectItem>
                    <SelectItem value="Tercer Año">Tercer Año</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Documentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="completos">Completos</SelectItem>
                    <SelectItem value="incompletos">Incompletos</SelectItem>
                    <SelectItem value="pendientes">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Inscripciones */}
        <div className="space-y-4">
          {filteredInscripciones.map((inscripcion) => (
            <Card key={inscripcion.firestoreId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getDivisionIcon(inscripcion.division)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {inscripcion.estudianteNombre} {inscripcion.estudianteApellido}
                        </h3>
                        {getEstadoBadge(inscripcion.estado)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Curso:</span>
                          <span className="ml-2 font-medium">{inscripcion.cursoNombre}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">División:</span>
                          <span className="ml-2 font-medium">{inscripcion.division}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Año:</span>
                          <span className="ml-2 font-medium">{inscripcion.año}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Documentos:</span>
                          <span className="ml-2 font-medium">{getDocumentosCompletados(inscripcion.documentos)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pagos:</span>
                          <span className="ml-2 font-medium">{getPagosCompletados(inscripcion.pagos)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha:</span>
                          <span className="ml-2 font-medium">{new Date(inscripcion.fechaInscripcion).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {inscripcion.observaciones && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-500">Observaciones:</span>
                          <span className="ml-2 text-gray-700">{inscripcion.observaciones}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerDetalles(inscripcion.firestoreId)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    
                    {inscripcion.estado === "pendiente" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleAprobarInscripcion(inscripcion.firestoreId)}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRechazarInscripcion(inscripcion.firestoreId)}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditarInscripcion(inscripcion.firestoreId)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInscripciones.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inscripciones</h3>
              <p className="text-gray-600">No se encontraron inscripciones con los filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 