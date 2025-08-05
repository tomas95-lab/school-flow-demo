import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { StatsCard } from "./StatCards";
import { 
  UserPlus, 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import ReutilizableDialog from "./DialogReutlizable";

// Tipos TypeScript
interface Inscripcion {
  firestoreId: string;
  studentId: string;
  courseId: string;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  fechaInscripcion: any;
  fechaAprobacion?: any;
  comentarios?: string;
  documentos: string[];
  estudiante?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    direccion?: string;
  };
  curso?: {
    nombre: string;
    division: string;
  };
}

interface InscripcionWithDetails extends Inscripcion {
  estudiante: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    direccion?: string;
  };
  curso: {
    nombre: string;
    division: string;
  };
}

export default function InscripcionesOverview() {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [sortBy, setSortBy] = useState<"fecha" | "estudiante" | "curso">("fecha");
  const [selectedInscripcion, setSelectedInscripcion] = useState<InscripcionWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    comentarios: "",
    documentos: [] as string[]
  });

  // Obtener datos - TODOS los hooks deben ir antes de cualquier return
  const { data: inscripciones, loading: loadingInscripciones, error: errorInscripciones } = useFirestoreCollection<Inscripcion>("inscripciones");
  const { data: students, loading: loadingStudents, error: errorStudents } = useFirestoreCollection("students");
  const { data: courses, loading: loadingCourses, error: errorCourses } = useFirestoreCollection("courses");

  // Combinar datos de inscripciones con detalles de estudiantes y cursos
  const inscripcionesConDetalles = useMemo((): InscripcionWithDetails[] => {
    // Si no hay datos de Firebase, retornar array vacío
    if (!inscripciones || !students || !courses) {
      return [];
    }

    return inscripciones.map(inscripcion => {
      const estudiante = students.find(s => s.firestoreId === inscripcion.studentId);
      const curso = courses.find(c => c.firestoreId === inscripcion.courseId);

      return {
        ...inscripcion,
        estudiante: {
          nombre: estudiante?.nombre || "Estudiante no encontrado",
          apellido: estudiante?.apellido || "",
          email: estudiante?.email || "",
          telefono: estudiante?.telefono || "",
          direccion: estudiante?.direccion || ""
        },
        curso: {
          nombre: curso?.nombre || "Curso no encontrado",
          division: curso?.division || ""
        }
      };
    });
  }, [inscripciones, students, courses]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = inscripcionesConDetalles.length;
    const pendientes = inscripcionesConDetalles.filter(i => i.status === 'pendiente').length;
    const aprobadas = inscripcionesConDetalles.filter(i => i.status === 'aprobada').length;
    const rechazadas = inscripcionesConDetalles.filter(i => i.status === 'rechazada').length;
    const canceladas = inscripcionesConDetalles.filter(i => i.status === 'cancelada').length;

    return {
      total,
      pendientes,
      aprobadas,
      rechazadas,
      canceladas,
      tasaAprobacion: total > 0 ? Math.round((aprobadas / total) * 100) : 0
    };
  }, [inscripcionesConDetalles]);

  // Filtrar inscripciones
  const filteredInscripciones = useMemo(() => {
    let filtered = inscripcionesConDetalles;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(inscripcion => 
        inscripcion.estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inscripcion.estudiante.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inscripcion.estudiante.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inscripcion.curso.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (filterStatus !== "all") {
      filtered = filtered.filter(inscripcion => inscripcion.status === filterStatus);
    }

    // Filtro por curso
    if (filterCourse !== "all") {
      filtered = filtered.filter(inscripcion => inscripcion.courseId === filterCourse);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "fecha":
          const fechaA = a.fechaInscripcion?.toDate ? a.fechaInscripcion.toDate() : new Date(a.fechaInscripcion);
          const fechaB = b.fechaInscripcion?.toDate ? b.fechaInscripcion.toDate() : new Date(b.fechaInscripcion);
          return fechaB.getTime() - fechaA.getTime();
        case "estudiante":
          return `${a.estudiante.nombre} ${a.estudiante.apellido}`.localeCompare(`${b.estudiante.nombre} ${b.estudiante.apellido}`);
        case "curso":
          return a.curso.nombre.localeCompare(b.curso.nombre);
        default:
          return 0;
      }
    });

    return filtered;
  }, [inscripcionesConDetalles, searchTerm, filterStatus, filterCourse, sortBy]);

  // Verificar acceso solo para administradores
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600 mb-4">
                  Solo los administradores pueden acceder al módulo de inscripciones.
                </p>
                <p className="text-gray-500 text-sm">
                  Contacta al administrador del sistema si necesitas acceso.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Funciones de utilidad
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "aprobada": return "bg-green-100 text-green-800 border-green-200";
      case "rechazada": return "bg-red-100 text-red-800 border-red-200";
      case "cancelada": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente";
      case "aprobada": return "Aprobada";
      case "rechazada": return "Rechazada";
      case "cancelada": return "Cancelada";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente": return Clock;
      case "aprobada": return CheckCircle;
      case "rechazada": return AlertTriangle;
      case "cancelada": return Trash2;
      default: return Clock;
    }
  };

  // Funciones de acción
  const handleAprobarInscripcion = async (inscripcionId: string) => {
    try {
      const inscripcionRef = doc(db, "inscripciones", inscripcionId);
      await updateDoc(inscripcionRef, {
        status: 'aprobada',
        fechaAprobacion: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Inscripción aprobada exitosamente");
    } catch (error) {
      console.error("Error al aprobar inscripción:", error);
      toast.error("Error al aprobar la inscripción");
    }
  };

  const handleRechazarInscripcion = async (inscripcionId: string) => {
    try {
      const inscripcionRef = doc(db, "inscripciones", inscripcionId);
      await updateDoc(inscripcionRef, {
        status: 'rechazada',
        fechaAprobacion: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.error("Inscripción rechazada");
    } catch (error) {
      console.error("Error al rechazar inscripción:", error);
      toast.error("Error al rechazar la inscripción");
    }
  };

  const handleCancelarInscripcion = async (inscripcionId: string) => {
    try {
      const inscripcionRef = doc(db, "inscripciones", inscripcionId);
      await updateDoc(inscripcionRef, {
        status: 'cancelada',
        fechaCancelacion: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.warning("Inscripción cancelada");
    } catch (error) {
      console.error("Error al cancelar inscripción:", error);
      toast.error("Error al cancelar la inscripción");
    }
  };

  const handleVerDetalles = (inscripcion: InscripcionWithDetails) => {
    setSelectedInscripcion(inscripcion);
    setShowDetailsModal(true);
  };

  const handleEditarInscripcion = (inscripcion: InscripcionWithDetails) => {
    setSelectedInscripcion(inscripcion);
    setEditForm({
      comentarios: inscripcion.comentarios || "",
      documentos: inscripcion.documentos || []
    });
    setShowEditModal(true);
  };

  const handleGuardarEdicion = async () => {
    if (!selectedInscripcion) return;
    
    try {
      const inscripcionRef = doc(db, "inscripciones", selectedInscripcion.firestoreId);
      await updateDoc(inscripcionRef, {
        comentarios: editForm.comentarios,
        documentos: editForm.documentos,
        updatedAt: serverTimestamp()
      });
      toast.success("Inscripción actualizada exitosamente");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error al actualizar inscripción:", error);
      toast.error("Error al actualizar la inscripción");
    }
  };

  const handleExportarCSV = () => {
    if (filteredInscripciones.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = [
      "Estudiante",
      "Email",
      "Curso",
      "Estado",
      "Fecha de Inscripción",
      "Comentarios"
    ];

    const rows = filteredInscripciones.map(inscripcion => [
      `${inscripcion.estudiante.nombre} ${inscripcion.estudiante.apellido}`,
      inscripcion.estudiante.email,
      `${inscripcion.curso.nombre} - ${inscripcion.curso.division}`,
      getStatusLabel(inscripcion.status),
      format(
        inscripcion.fechaInscripcion?.toDate ? inscripcion.fechaInscripcion.toDate() : new Date(inscripcion.fechaInscripcion),
        'dd/MM/yyyy HH:mm',
        { locale: es }
      ),
      inscripcion.comentarios || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inscripciones_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Archivo CSV exportado exitosamente");
  };

  // Estados de carga
  if (loadingInscripciones || loadingStudents || loadingCourses) {
    return (
      <LoadingState 
        text="Cargando inscripciones..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Gestión de Inscripciones
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <UserPlus className="h-3 w-3 mr-1" />
                      {user?.role === "admin" && "Administrador"}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">Sistema Educativo</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                Administra y revisa todas las solicitudes de inscripción de estudiantes de manera eficiente.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                      <UserPlus className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Período Actual</p>
                      <p className="font-bold text-gray-900">2025 - Semestre I</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button 
                onClick={handleExportarCSV}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label="Total de Inscripciones"
            value={stats.total}
            icon={UserPlus}
            subtitle="Todas las solicitudes de inscripción"
          />
          <StatsCard
            label="Pendientes"
            value={stats.pendientes}
            icon={Clock}
            color="yellow"
            subtitle="Inscripciones en revisión"
          />
          <StatsCard
            label="Aprobadas"
            value={stats.aprobadas}
            icon={CheckCircle}
            color="green"
            subtitle="Inscripciones confirmadas"
          />
          <StatsCard
            label="Tasa de Aprobación"
            value={`${stats.tasaAprobacion}%`}
            icon={GraduationCap}
            color="blue"
            subtitle="Porcentaje de aprobación"
          />
        </div>

              {/* Filtros y búsqueda */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Lista de Inscripciones
              </h2>
              <p className="text-sm text-gray-600">
                {filteredInscripciones.length} inscripción{filteredInscripciones.length !== 1 ? 'es' : ''} encontrada{filteredInscripciones.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar por Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="aprobada">Aprobadas</SelectItem>
                  <SelectItem value="rechazada">Rechazadas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar por Curso</label>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                   {courses?.map(course => (
                    <SelectItem key={course.firestoreId || ''} value={course.firestoreId || ''}>
                      {course.nombre} - {course.division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Ordenar por</label>
              <Select value={sortBy} onValueChange={(value: "fecha" | "estudiante" | "curso") => setSortBy(value)}>
                <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha">Fecha más reciente</SelectItem>
                  <SelectItem value="estudiante">Nombre del estudiante</SelectItem>
                  <SelectItem value="curso">Nombre del curso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

              {/* Lista de Inscripciones */}
        <div className="space-y-4">
          {filteredInscripciones.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No hay inscripciones"
              description={
                searchTerm || filterStatus !== "all" || filterCourse !== "all"
                  ? "No se encontraron inscripciones con los filtros aplicados"
                  : "No hay inscripciones registradas en el sistema"
              }
              actionText="Limpiar filtros"
              onAction={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterCourse("all");
              }}
            />
          ) : (
            filteredInscripciones.map((inscripcion) => {
              const StatusIcon = getStatusIcon(inscripcion.status);
              
              return (
                <Card key={inscripcion.firestoreId} className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                                                 {/* Header con información principal */}
                         <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                               <span className="text-white font-semibold text-sm">
                                 {inscripcion.estudiante.nombre.charAt(0)}{inscripcion.estudiante.apellido.charAt(0)}
                               </span>
                             </div>
                             <div>
                               <h3 className="text-lg font-semibold text-gray-900">
                                 {inscripcion.estudiante.nombre} {inscripcion.estudiante.apellido}
                               </h3>
                               <p className="text-sm text-gray-500">{inscripcion.estudiante.email}</p>
                             </div>
                           </div>
                           <Badge className={`text-xs px-3 py-1 ${getStatusColor(inscripcion.status)}`}>
                             <StatusIcon className="h-3 w-3 mr-1" />
                             {getStatusLabel(inscripcion.status)}
                           </Badge>
                         </div>
                         
                         {/* Información del curso y fechas */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm">
                               <GraduationCap className="h-4 w-4 text-blue-600" />
                               <span className="font-medium text-gray-900">{inscripcion.curso.nombre}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm">
                               <Calendar className="h-4 w-4 text-orange-600" />
                               <span className="text-gray-600">
                                 {format(
                                   inscripcion.fechaInscripcion?.toDate ? inscripcion.fechaInscripcion.toDate() : new Date(inscripcion.fechaInscripcion),
                                   'dd/MM/yyyy HH:mm',
                                   { locale: es }
                                 )}
                               </span>
                             </div>
                           </div>
                           
                           <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm">
                               <span className="text-gray-500">División:</span>
                               <span className="font-medium text-gray-900">{inscripcion.curso.division}</span>
                             </div>
                             {inscripcion.fechaAprobacion && (
                               <div className="flex items-center gap-2 text-sm">
                                 <CheckCircle className="h-4 w-4 text-green-600" />
                                 <span className="text-gray-600">
                                   {format(
                                     inscripcion.fechaAprobacion?.toDate ? inscripcion.fechaAprobacion.toDate() : new Date(inscripcion.fechaAprobacion),
                                     'dd/MM/yyyy HH:mm',
                                     { locale: es }
                                   )}
                                 </span>
                               </div>
                             )}
                           </div>
                         </div>
                        
                                                 {/* Información adicional */}
                         <div className="flex items-center gap-4 text-xs text-gray-500">
                           {inscripcion.comentarios && (
                             <div className="flex items-center gap-1">
                               <FileText className="h-3 w-3" />
                               <span>Comentarios</span>
                             </div>
                           )}
                           {inscripcion.documentos.length > 0 && (
                             <div className="flex items-center gap-1">
                               <FileText className="h-3 w-3" />
                               <span>{inscripcion.documentos.length} documento{inscripcion.documentos.length !== 1 ? 's' : ''}</span>
                             </div>
                           )}
                         </div>
                      </div>
                      
                                             <div className="flex flex-col items-end gap-3 ml-6">
                         {/* Acciones principales */}
                         {inscripcion.status === 'pendiente' && (
                           <div className="flex gap-2">
                             <Button
                               size="sm"
                               onClick={() => handleAprobarInscripcion(inscripcion.firestoreId)}
                               className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                             >
                               <CheckCircle className="h-4 w-4 mr-1" />
                               Aprobar
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleRechazarInscripcion(inscripcion.firestoreId)}
                               className="border-red-200 text-red-600 hover:bg-red-50"
                             >
                               <AlertTriangle className="h-4 w-4 mr-1" />
                               Rechazar
                             </Button>
                           </div>
                         )}
                         
                         {/* Acciones secundarias */}
                         <div className="flex gap-1">
                           <Button 
                             size="sm" 
                             variant="ghost"
                             onClick={() => handleVerDetalles(inscripcion)}
                             className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                             title="Ver detalles"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           
                           <Button 
                             size="sm" 
                             variant="ghost"
                             onClick={() => handleEditarInscripcion(inscripcion)}
                             className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                             title="Editar inscripción"
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           
                           {(inscripcion.status === 'aprobada' || inscripcion.status === 'pendiente') && (
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={() => handleCancelarInscripcion(inscripcion.firestoreId)}
                               className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                               title="Cancelar inscripción"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
                </div>
      </div>

              {/* Modal de Detalles */}
        <ReutilizableDialog
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          title="Detalles de Inscripción"
          description="Información completa de la inscripción seleccionada"
          small={false}
          content={
            selectedInscripcion ? (
              <div className="space-y-8">
                {/* Header con avatar y estado */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedInscripcion.estudiante.nombre.charAt(0)}{selectedInscripcion.estudiante.apellido.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedInscripcion.estudiante.nombre} {selectedInscripcion.estudiante.apellido}
                    </h3>
                    <p className="text-gray-600">{selectedInscripcion.estudiante.email}</p>
                  </div>
                  <Badge className={`text-sm px-4 py-2 ${getStatusColor(selectedInscripcion.status)}`}>
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedInscripcion.status);
                      return <StatusIcon className="h-4 w-4 mr-2" />;
                    })()}
                    {getStatusLabel(selectedInscripcion.status)}
                  </Badge>
                </div>

                {/* Información del Estudiante */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Información del Estudiante
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-sm text-gray-900">{selectedInscripcion.estudiante.email}</p>
                        </div>
                      </div>
                      {selectedInscripcion.estudiante.telefono && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Teléfono</p>
                            <p className="text-sm text-gray-900">{selectedInscripcion.estudiante.telefono}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedInscripcion.estudiante.direccion && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Dirección</p>
                          <p className="text-sm text-gray-900">{selectedInscripcion.estudiante.direccion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del Curso */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    Información del Curso
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Curso</p>
                      <p className="text-sm text-gray-900">
                        {selectedInscripcion.curso.nombre} - {selectedInscripcion.curso.division}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estado y Fechas */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Estado y Fechas
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fecha de Inscripción</p>
                        <p className="text-sm text-gray-900">
                          {format(
                            selectedInscripcion.fechaInscripcion?.toDate ? selectedInscripcion.fechaInscripcion.toDate() : new Date(selectedInscripcion.fechaInscripcion),
                            'dd/MM/yyyy HH:mm',
                            { locale: es }
                          )}
                        </p>
                      </div>
                    </div>
                    {selectedInscripcion.fechaAprobacion && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha de Aprobación</p>
                          <p className="text-sm text-gray-900">
                            {format(
                              selectedInscripcion.fechaAprobacion?.toDate ? selectedInscripcion.fechaAprobacion.toDate() : new Date(selectedInscripcion.fechaAprobacion),
                              'dd/MM/yyyy HH:mm',
                              { locale: es }
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comentarios */}
                {selectedInscripcion.comentarios && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Comentarios
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedInscripcion.comentarios}
                    </p>
                  </div>
                )}

                {/* Documentos */}
                {selectedInscripcion.documentos.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      Documentos Adjuntos ({selectedInscripcion.documentos.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedInscripcion.documentos.map((documento, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-md border">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{documento}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontró información de la inscripción</p>
              </div>
            )
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDetailsModal(false)}
                className="px-6"
              >
                Cerrar
              </Button>
            </div>
          }
        />

        {/* Modal de Edición */}
        <ReutilizableDialog
          open={showEditModal}
          onOpenChange={setShowEditModal}
          title="Editar Inscripción"
          description="Modifica los detalles de la inscripción"
          small={false}
          content={
            selectedInscripcion ? (
              <div className="space-y-6">
                {/* Header con información del estudiante */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {selectedInscripcion.estudiante.nombre.charAt(0)}{selectedInscripcion.estudiante.apellido.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedInscripcion.estudiante.nombre} {selectedInscripcion.estudiante.apellido}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedInscripcion.estudiante.email}</p>
                  </div>
                </div>

                {/* Comentarios */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Comentarios
                  </h4>
                  <textarea
                    value={editForm.comentarios}
                    onChange={(e) => setEditForm(prev => ({ ...prev, comentarios: e.target.value }))}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                    placeholder="Agregar comentarios sobre la inscripción..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Los comentarios ayudan a mantener un registro de las decisiones tomadas sobre esta inscripción.
                  </p>
                </div>

                {/* Documentos */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Documentos Adjuntos
                  </h4>
                  <div className="space-y-3">
                    {editForm.documentos.map((documento, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        <input
                          type="text"
                          value={documento}
                          onChange={(e) => {
                            const newDocumentos = [...editForm.documentos];
                            newDocumentos[index] = e.target.value;
                            setEditForm(prev => ({ ...prev, documentos: newDocumentos }));
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nombre del documento"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newDocumentos = editForm.documentos.filter((_, i) => i !== index);
                            setEditForm(prev => ({ ...prev, documentos: newDocumentos }));
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditForm(prev => ({
                          ...prev,
                          documentos: [...prev.documentos, ""]
                        }));
                      }}
                      className="w-full border-dashed border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Documento
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Lista los documentos que el estudiante ha proporcionado para esta inscripción.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontró información de la inscripción</p>
              </div>
            )
          }
          footer={
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardarEdicion}
                className="bg-blue-600 hover:bg-blue-700 px-6"
              >
                Guardar Cambios
              </Button>
            </div>
          }
        />
      </div>
    );
  } 