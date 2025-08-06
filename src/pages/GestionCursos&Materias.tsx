import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ReutilizableDialog from "@/components/DialogReutlizable";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";

import { addDoc, collection, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Building, 
  Lock, 
  Award, 
  TrendingUp,
  School,
  FileText,
  Eye,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  UserCheck,
  BarChart3
} from "lucide-react";

// Tipos para las pestañas
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPermission?: boolean;
  permissionCheck?: (role?: string) => boolean;
}

export default function GestionCursosMaterias() {
  const { user, loading: userLoading } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("overview");
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [viewingCourseDetails, setViewingCourseDetails] = useState(false);
  const [newCourse, setNewCourse] = useState({ 
    nombre: "", 
    division: "", 
    año: new Date().getFullYear(), 
    nivel: "",
    teacherId: "",
    modalidad: "presencial",
    turno: "mañana",
    maxStudents: 30,
    description: "",
    aula: "",
    status: "active"
  });
  const [newSubject, setNewSubject] = useState({ 
    nombre: "", 
    teacherId: "", 
    cursoId: "" 
  });


  // Configuración de pestañas
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Resumen",
      icon: School,
      description: "Vista general de cursos y materias"
    },
    {
      id: "courses",
      label: "Cursos",
      icon: Building,
      description: "Gestión de cursos del sistema",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin" || role === "docente"
    },
    {
      id: "subjects",
      label: "Materias",
      icon: BookOpen,
      description: "Gestión de materias y asignaturas",
      requiresPermission: true,
      permissionCheck: (role) => role === "admin" || role === "docente"
    },
    {
      id: "statistics",
      label: "Estadísticas",
      icon: FileText,
      description: "Reportes y estadísticas académicas"
    }
  ];

  // Usar hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);

  const { data: allCourses } = useFirestoreCollection("courses");
  const { data: allSubjects } = useFirestoreCollection("subjects");
  const { data: allTeachers } = useFirestoreCollection("teachers");

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Administra cursos, materias y asignaturas de EduNova de forma completa.";
      case "docente":
        return "Gestiona tus cursos asignados y las materias que impartes.";
      case "alumno":
        return "Consulta información sobre tus cursos y materias inscritas.";
      default:
        return "Panel de gestión académica de EduNova.";
    }
  };

  // Función para obtener el icono del rol
  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return Users;
      case "docente":
        return Award;
      case "alumno":
        return TrendingUp;
      default:
        return GraduationCap;
    }
  };

  // Verificar permisos de acceso
  const canAccessCourses = user?.role === "admin" || user?.role === "docente" || user?.role === "alumno";
  const canManageCourses = user?.role === "admin" || user?.role === "docente";
  const canManageSubjects = user?.role === "admin" || user?.role === "docente";

  // Filtrar pestañas según permisos
  const availableTabs = tabs.filter(tab => {
    if (tab.requiresPermission && tab.permissionCheck) {
      return tab.permissionCheck(user?.role);
    }
    return true;
  });

  // Datos para gráficos
  const chartDataByLevel = [
    {
      nivel: "Inicial",
      cursos: allCourses?.filter(c => c.nivel === 'inicial').length || 0,
      fill: "#fb923c"
    },
    {
      nivel: "Primaria", 
      cursos: allCourses?.filter(c => c.nivel === 'primaria').length || 0,
      fill: "#f59e0b"
    },
    {
      nivel: "Secundaria",
      cursos: allCourses?.filter(c => c.nivel === 'secundaria').length || 0,
      fill: "#ea580c"
    },
    {
      nivel: "Bachillerato",
      cursos: allCourses?.filter(c => c.nivel === 'bachillerato').length || 0,
      fill: "#dc2626"
    },
    {
      nivel: "Técnico",
      cursos: allCourses?.filter(c => c.nivel === 'tecnico').length || 0,
      fill: "#b91c1c"
    }
  ];

  const chartDataByModality = [
    {
      modalidad: "Presencial",
      cursos: allCourses?.filter(c => c.modalidad === 'presencial' || !c.modalidad).length || 0,
      fill: "#fb923c"
    },
    {
      modalidad: "Virtual",
      cursos: allCourses?.filter(c => c.modalidad === 'virtual').length || 0,
      fill: "#f59e0b"
    },
    {
      modalidad: "Híbrida",
      cursos: allCourses?.filter(c => c.modalidad === 'hibrida').length || 0,
      fill: "#ea580c"
    }
  ];

  const chartDataByTurn = [
    {
      turno: "Mañana",
      cursos: allCourses?.filter(c => c.turno === 'mañana' || !c.turno).length || 0,
      materias: allSubjects?.filter(s => {
        const course = allCourses?.find(c => c.firestoreId === s.cursoId);
        return course?.turno === 'mañana' || !course?.turno;
      }).length || 0
    },
    {
      turno: "Tarde", 
      cursos: allCourses?.filter(c => c.turno === 'tarde').length || 0,
      materias: allSubjects?.filter(s => {
        const course = allCourses?.find(c => c.firestoreId === s.cursoId);
        return course?.turno === 'tarde';
      }).length || 0
    },
    {
      turno: "Noche",
      cursos: allCourses?.filter(c => c.turno === 'noche').length || 0,
      materias: allSubjects?.filter(s => {
        const course = allCourses?.find(c => c.firestoreId === s.cursoId);
        return course?.turno === 'noche';
      }).length || 0
    }
  ];

  // Configuraciones de los gráficos
  const levelChartConfig = {
    cursos: {
      label: "Cursos",
    },
    inicial: {
      label: "Inicial",
      color: "#fb923c",
    },
    primaria: {
      label: "Primaria", 
      color: "#f59e0b",
    },
    secundaria: {
      label: "Secundaria",
      color: "#ea580c",
    },
    bachillerato: {
      label: "Bachillerato",
      color: "#dc2626",
    },
    tecnico: {
      label: "Técnico",
      color: "#b91c1c",
    },
  } satisfies ChartConfig;

  const modalityChartConfig = {
    cursos: {
      label: "Cursos",
    },
    presencial: {
      label: "Presencial",
      color: "#fb923c",
    },
    virtual: {
      label: "Virtual",
      color: "#f59e0b",
    },
    hibrida: {
      label: "Híbrida", 
      color: "#ea580c",
    },
  } satisfies ChartConfig;

  const turnChartConfig = {
    cursos: {
      label: "Cursos",
      color: "#fb923c",
    },
    materias: {
      label: "Materias",
      color: "#f59e0b",
    },
  } satisfies ChartConfig;

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading || studentsLoading) {
    return (
      <LoadingState 
        text="Cargando gestión académica..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión a internet."
      />
    );
  }

  // Si no tiene permisos de acceso
  if (!canAccessCourses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
                <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600 mb-4">
                  No tienes permisos para acceder al módulo de gestión académica.
                </p>
                <p className="text-gray-500 text-sm">
                  Contacta al administrador del sistema si crees que esto es un error.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user?.role);

  const handleAddCourse = async () => {
    if (!newCourse.nombre || !newCourse.division || !newCourse.nivel || !newCourse.teacherId) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid,
        updatedBy: user?.uid
      });
      
      toast.success("Curso agregado exitosamente");
      setNewCourse({ 
        nombre: "", 
        division: "", 
        año: new Date().getFullYear(), 
        nivel: "",
        teacherId: "",
        modalidad: "presencial",
        turno: "mañana",
        maxStudents: 30,
        description: "",
        aula: "",
        status: "active"
      });
      setIsAddingCourse(false);
    } catch (error) {
      console.error("Error al agregar curso:", error);
      toast.error("Error al agregar el curso");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.nombre || !newSubject.teacherId || !newSubject.cursoId) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "subjects"), {
        ...newSubject,
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      });
      
      toast.success("Materia agregada exitosamente");
      setNewSubject({ nombre: "", teacherId: "", cursoId: "" });
      setIsAddingSubject(false);
    } catch (error) {
      console.error("Error al agregar materia:", error);
      toast.error("Error al agregar la materia");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este curso?")) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast.success("Curso eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar curso:", error);
      toast.error("Error al eliminar el curso");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta materia?")) return;

    try {
      await deleteDoc(doc(db, "subjects", subjectId));
      toast.success("Materia eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar materia:", error);
      toast.error("Error al eliminar la materia");
    }
  };

  // Funciones de edición
  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setNewCourse({
      nombre: course.nombre || "",
      division: course.division || "",
      año: course.año || new Date().getFullYear(),
      nivel: course.nivel || "",
      teacherId: course.teacherId || "",
      modalidad: course.modalidad || "presencial",
      turno: course.turno || "mañana",
      maxStudents: course.maxStudents || 30,
      description: course.description || "",
      aula: course.aula || "",
      status: course.status || "active"
    });
  };

  const handleUpdateCourse = async () => {
    if (!newCourse.nombre || !newCourse.division || !newCourse.nivel || !newCourse.teacherId) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const courseRef = doc(db, "courses", editingCourse.firestoreId);
      await updateDoc(courseRef, {
        ...newCourse,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      
      toast.success("Curso actualizado exitosamente");
      setEditingCourse(null);
      setNewCourse({ 
        nombre: "", 
        division: "", 
        año: new Date().getFullYear(), 
        nivel: "",
        teacherId: "",
        modalidad: "presencial",
        turno: "mañana",
        maxStudents: 30,
        description: "",
        aula: "",
        status: "active"
      });
    } catch (error) {
      console.error("Error al actualizar curso:", error);
      toast.error("Error al actualizar el curso");
    }
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setNewSubject({
      nombre: subject.nombre || "",
      teacherId: subject.teacherId || "",
      cursoId: subject.cursoId || ""
    });
  };

  const handleUpdateSubject = async () => {
    if (!newSubject.nombre || !newSubject.teacherId || !newSubject.cursoId) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      const subjectRef = doc(db, "subjects", editingSubject.firestoreId);
      await updateDoc(subjectRef, {
        ...newSubject,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      
      toast.success("Materia actualizada exitosamente");
      setEditingSubject(null);
      setNewSubject({ nombre: "", teacherId: "", cursoId: "" });
    } catch (error) {
      console.error("Error al actualizar materia:", error);
      toast.error("Error al actualizar la materia");
    }
  };

  const handleCourseStatusToggle = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      
      toast.success(`Curso ${newStatus === "active" ? "activado" : "desactivado"} exitosamente`);
    } catch (error) {
      console.error("Error al cambiar estado del curso:", error);
      toast.error("Error al cambiar el estado del curso");
    }
  };

  const handleViewCourseDetails = (course: any) => {
    setSelectedCourse(course);
    setViewingCourseDetails(true);
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setEditingSubject(null);
    setNewCourse({ 
      nombre: "", 
      division: "", 
      año: new Date().getFullYear(), 
      nivel: "",
      teacherId: "",
      modalidad: "presencial",
      turno: "mañana",
      maxStudents: 30,
      description: "",
      aula: "",
      status: "active"
    });
    setNewSubject({ nombre: "", teacherId: "", cursoId: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header mejorado con diseño moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
      <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Gestión Académica
                  </h1>
                  <div className="flex items-center gap-3">
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
              <p className="text-gray-600 text-lg max-w-2xl">
                {getRoleMessage(user?.role)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {canManageCourses && (
                <Button 
                  onClick={() => setActiveView("courses")}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Gestionar Cursos
                </Button>
              )}
            </div>
          </div>
      </div>

        {/* Navegación por tabs mejorada */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {availableTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeView === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg' 
                      : 'hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Contenido según vista activa con animaciones */}
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {activeView === "overview" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
      {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Building className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{allCourses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Materias</p>
                <p className="text-2xl font-bold text-gray-900">{allSubjects?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                        <p className="text-sm text-gray-600">
                          {user?.role === "docente" ? "Mis Cursos" : "Docentes"}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {user?.role === "docente" ? teacherCourses.length : allTeachers?.length || 0}
                        </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

              {/* Vista de resumen adicional */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-orange-600" />
                    Resumen del Sistema Académico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <GraduationCap className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sistema de Gestión Académica
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Administra cursos, materias y asignaturas de manera eficiente.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="outline">Cursos Activos: {allCourses?.filter(c => c.status === 'active').length || 0}</Badge>
                      <Badge variant="outline">Materias Registradas: {allSubjects?.length || 0}</Badge>
                      <Badge variant="outline">Docentes: {allTeachers?.length || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === "courses" && canManageCourses && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
      {/* Gestión de Cursos */}
              <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-orange-600" />
                      Gestión de Cursos
                    </CardTitle>
                    <Button 
                      onClick={() => setIsAddingCourse(true)}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                      disabled={editingCourse}
                    >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Curso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isAddingCourse || editingCourse) && (
            <div className="mb-6 p-6 border rounded-lg bg-orange-50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCourse ? "Editar Curso" : "Crear Nuevo Curso"}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingCourse(false);
                    cancelEdit();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información Básica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="courseName">Nombre del Curso *</Label>
                      <Input
                        id="courseName"
                        value={newCourse.nombre}
                        onChange={(e) => setNewCourse({ ...newCourse, nombre: e.target.value })}
                        placeholder="Ej: 1er Año Secundaria"
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseDivision">División *</Label>
                      <Input
                        id="courseDivision"
                        value={newCourse.division}
                        onChange={(e) => setNewCourse({ ...newCourse, division: e.target.value })}
                        placeholder="Ej: A, B, C"
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseYear">Año Lectivo</Label>
                      <Input
                        id="courseYear"
                        type="number"
                        value={newCourse.año}
                        onChange={(e) => setNewCourse({ ...newCourse, año: parseInt(e.target.value) })}
                        placeholder="2025"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuración Académica */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración Académica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="courseLevel">Nivel Educativo *</Label>
                      <Select 
                        value={newCourse.nivel} 
                        onValueChange={(value) => setNewCourse({ ...newCourse, nivel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inicial">Inicial</SelectItem>
                          <SelectItem value="primaria">Primaria</SelectItem>
                          <SelectItem value="secundaria">Secundaria</SelectItem>
                          <SelectItem value="bachillerato">Bachillerato</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="courseTeacher">Profesor Titular *</Label>
                      <Select 
                        value={newCourse.teacherId} 
                        onValueChange={(value) => setNewCourse({ ...newCourse, teacherId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Asignar profesor" />
                        </SelectTrigger>
                        <SelectContent>
                          {allTeachers?.map((teacher) => (
                            <SelectItem key={teacher.firestoreId} value={teacher.firestoreId || ""}>
                              {teacher.nombre} {teacher.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Configuración Operativa */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración Operativa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="courseModality">Modalidad</Label>
                      <Select 
                        value={newCourse.modalidad}
                        onValueChange={(value) => setNewCourse({ ...newCourse, modalidad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="hibrida">Híbrida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="courseTurn">Turno</Label>
                      <Select 
                        value={newCourse.turno}
                        onValueChange={(value) => setNewCourse({ ...newCourse, turno: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mañana">Mañana</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noche">Noche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxStudents">Cupo Máximo</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        value={newCourse.maxStudents}
                        onChange={(e) => setNewCourse({ ...newCourse, maxStudents: parseInt(e.target.value) })}
                        placeholder="30"
                        min="1"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="classroom">Aula Asignada</Label>
                      <Input
                        id="classroom"
                        value={newCourse.aula}
                        onChange={(e) => setNewCourse({ ...newCourse, aula: e.target.value })}
                        placeholder="Ej: Aula 101"
                      />
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <Label htmlFor="courseDescription">Descripción del Curso</Label>
                  <textarea
                    id="courseDescription"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Descripción opcional del curso, objetivos, etc."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button 
                  onClick={editingCourse ? handleUpdateCourse : handleAddCourse} 
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  {editingCourse ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Actualizar Curso
                    </>
                  ) : (
                    <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Curso
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingCourse(false);
                    cancelEdit();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {allCourses?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay cursos registrados</p>
                <p className="text-sm">Crea el primer curso para comenzar</p>
              </div>
            ) : (
              allCourses?.map((course) => (
                <div key={course.firestoreId} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {course.nombre} - División {course.division}
                        </h4>
                        <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                          {course.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge variant="outline">
                          {teacherCourses.some(c => c.firestoreId === course.firestoreId) ? "Mi Curso" : "Otro"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Año:</span> {course.año}
                        </div>
                        <div>
                          <span className="font-medium">Nivel:</span> {course.nivel || 'No definido'}
                        </div>
                        <div>
                          <span className="font-medium">Modalidad:</span> {course.modalidad || 'Presencial'}
                        </div>
                        <div>
                          <span className="font-medium">Turno:</span> {course.turno || 'Mañana'}
                        </div>
                        <div>
                          <span className="font-medium">Cupo:</span> {course.maxStudents || 30} estudiantes
                        </div>
                        <div>
                          <span className="font-medium">Aula:</span> {course.aula || 'No asignada'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Profesor:</span> {
                            allTeachers?.find(t => t.firestoreId === course.teacherId)?.nombre 
                            ? `${allTeachers.find(t => t.firestoreId === course.teacherId)?.nombre} ${allTeachers.find(t => t.firestoreId === course.teacherId)?.apellido}`
                            : 'No asignado'
                          }
                        </div>
                      </div>

                      {course.description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">{course.description}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-500">
                        Creado: {course.createdAt ? new Date(course.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha no disponible'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                          onClick={() => handleViewCourseDetails(course)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                          title="Editar curso"
                          disabled={editingCourse || isAddingCourse}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCourseStatusToggle(course.firestoreId || "", course.status || "active")}
                          title={course.status === 'active' ? 'Desactivar curso' : 'Activar curso'}
                          className={course.status === 'active' ? 'text-orange-600' : 'text-gray-600'}
                        >
                          {course.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.firestoreId || "")}
                          title="Eliminar curso"
                          className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
            </div>
          )}

          {activeView === "subjects" && canManageSubjects && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
      {/* Gestión de Materias */}
              <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                      Gestión de Materias
                    </CardTitle>
                    <Button 
                      onClick={() => setIsAddingSubject(true)}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                      disabled={editingSubject}
                    >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Materia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
                  {(isAddingSubject || editingSubject) && (
                    <div className="mb-6 p-6 border rounded-lg bg-orange-50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {editingSubject ? "Editar Materia" : "Nueva Materia"}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAddingSubject(false);
                            cancelEdit();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subjectName">Nombre de la Materia</Label>
                  <Input
                    id="subjectName"
                    value={newSubject.nombre}
                    onChange={(e) => setNewSubject({ ...newSubject, nombre: e.target.value })}
                    placeholder="Ej: Matemáticas"
                  />
                </div>
                <div>
                  <Label htmlFor="subjectTeacher">Docente</Label>
                  <Select value={newSubject.teacherId} onValueChange={(value) => setNewSubject({ ...newSubject, teacherId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar docente" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTeachers?.map((teacher) => (
                        <SelectItem key={teacher.firestoreId} value={teacher.firestoreId || ""}>
                          {teacher.nombre} {teacher.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subjectCourse">Curso</Label>
                  <Select value={newSubject.cursoId} onValueChange={(value) => setNewSubject({ ...newSubject, cursoId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCourses?.map((course) => (
                        <SelectItem key={course.firestoreId} value={course.firestoreId || ""}>
                          {course.nombre} - {course.division}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={editingSubject ? handleUpdateSubject : handleAddSubject}
                          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                        >
                          {editingSubject ? (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Actualizar Materia
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Crear Materia
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingSubject(false);
                            cancelEdit();
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
                    {allSubjects?.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No hay materias registradas</p>
                        <p className="text-sm">Crea la primera materia para comenzar</p>
                      </div>
                    ) : (
                      allSubjects?.map((subject) => (
                        <div key={subject.firestoreId} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                              <div className="p-3 bg-orange-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-orange-600" />
                              </div>
                  <div>
                                <h4 className="text-lg font-semibold text-gray-900">{subject.nombre}</h4>
                    <p className="text-sm text-gray-600">
                      Docente: {allTeachers?.find(t => t.firestoreId === subject.teacherId)?.nombre} {allTeachers?.find(t => t.firestoreId === subject.teacherId)?.apellido}
                    </p>
                    <p className="text-sm text-gray-600">
                      Curso: {allCourses?.find(c => c.firestoreId === subject.cursoId)?.nombre} - {allCourses?.find(c => c.firestoreId === subject.cursoId)?.division}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {teacherSubjects.some(s => s.firestoreId === subject.firestoreId) ? "Mis Materias" : "Otras"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                                onClick={() => handleEditSubject(subject)}
                                title="Editar materia"
                                disabled={editingSubject || isAddingSubject}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.firestoreId || "")}
                                title="Eliminar materia"
                                className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === "statistics" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                {/* Tarjetas de métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Building className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Cursos</p>
                          <p className="text-2xl font-bold text-gray-900">{allCourses?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cursos Activos</p>
                          <p className="text-2xl font-bold text-gray-900">{allCourses?.filter(c => c.status === 'active').length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Materias</p>
                          <p className="text-2xl font-bold text-gray-900">{allSubjects?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Docentes</p>
                          <p className="text-2xl font-bold text-gray-900">{allTeachers?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos interactivos reales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de barras - Distribución por nivel */}
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                        Distribución por Nivel Educativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={levelChartConfig} className="min-h-[300px]">
                        <BarChart data={chartDataByLevel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="nivel" 
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                          />
                          <YAxis 
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar 
                            dataKey="cursos" 
                            fill="#fb923c"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfico de pie - Modalidades */}
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5 text-orange-600" />
                        Modalidades de Enseñanza
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={modalityChartConfig} className="min-h-[300px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={chartDataByModality}
                            dataKey="cursos"
                            nameKey="modalidad"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                          >
                            {chartDataByModality.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfico de barras comparativo - Cursos vs Materias por turno */}
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-600" />
                        Cursos y Materias por Turno
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={turnChartConfig} className="min-h-[300px]">
                        <BarChart data={chartDataByTurn} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="turno"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                          />
                          <YAxis 
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar 
                            dataKey="cursos" 
                            fill="#fb923c"
                            radius={[2, 2, 0, 0]}
                            name="Cursos"
                          />
                          <Bar 
                            dataKey="materias" 
                            fill="#f59e0b"
                            radius={[2, 2, 0, 0]}
                            name="Materias"
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Resumen de materias por curso */}
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-orange-600" />
                        Materias por Curso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {allCourses?.slice(0, 5).map((course) => {
                          const subjectCount = allSubjects?.filter(s => s.cursoId === course.firestoreId).length || 0;
                          
                          return (
                            <div key={course.firestoreId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{course.nombre} - {course.division}</p>
                                <p className="text-sm text-gray-600">{course.nivel || 'Nivel no definido'}</p>
                              </div>
                              <Badge variant="outline">
                                {subjectCount} materias
                              </Badge>
                            </div>
                          );
                        })}
                        
                        {allCourses?.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <Building className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No hay cursos para mostrar</p>
                          </div>
                        )}
          </div>
        </CardContent>
      </Card>
                </div>
              </div>
            </div>
          )}

          {/* Estado vacío cuando no hay vista activa */}
          {!activeView && (
            <div className="text-center py-12 animate-in fade-in-50 duration-500">
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay vista seleccionada
                  </h3>
                  <p className="text-gray-600">
                    Selecciona una opción del menú para comenzar.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Estado vacío para vistas sin permisos */}
          {(activeView === "courses" && !canManageCourses) && (
            <div className="text-center py-12 animate-in fade-in-50 duration-500">
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Acceso Restringido
                  </h3>
                  <p className="text-gray-600">
                    No tienes permisos para gestionar cursos.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {(activeView === "subjects" && !canManageSubjects) && (
            <div className="text-center py-12 animate-in fade-in-50 duration-500">
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Acceso Restringido
                  </h3>
                  <p className="text-gray-600">
                    No tienes permisos para gestionar materias.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Modal de detalles del curso usando DialogReutilizable */}
        <ReutilizableDialog
          open={viewingCourseDetails}
          onOpenChange={(open) => {
            setViewingCourseDetails(open);
            if (!open) setSelectedCourse(null);
          }}
          small={false}
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedCourse?.nombre} - División {selectedCourse?.division}
                </span>
              </div>
            </div>
          }
          description="Información detallada del curso y materias asignadas"
          content={
            selectedCourse && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del curso */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-orange-600" />
                        Información del Curso
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Año Lectivo</Label>
                          <p className="text-gray-900">{selectedCourse.año}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Nivel</Label>
                          <p className="text-gray-900 capitalize">{selectedCourse.nivel || 'No definido'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Modalidad</Label>
                          <p className="text-gray-900 capitalize">{selectedCourse.modalidad || 'Presencial'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Turno</Label>
                          <p className="text-gray-900 capitalize">{selectedCourse.turno || 'Mañana'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Cupo Máximo</Label>
                          <p className="text-gray-900">{selectedCourse.maxStudents || 30} estudiantes</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Aula</Label>
                          <p className="text-gray-900">{selectedCourse.aula || 'No asignada'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Profesor Titular</Label>
                        <p className="text-gray-900">
                          {allTeachers?.find(t => t.firestoreId === selectedCourse.teacherId)?.nombre 
                            ? `${allTeachers.find(t => t.firestoreId === selectedCourse.teacherId)?.nombre} ${allTeachers.find(t => t.firestoreId === selectedCourse.teacherId)?.apellido}`
                            : 'No asignado'
                          }
                        </p>
                      </div>

                      {selectedCourse.description && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedCourse.description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-gray-600">Estado:</Label>
                        <Badge variant={selectedCourse.status === 'active' ? 'default' : 'secondary'}>
                          {selectedCourse.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Materias del curso */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-orange-600" />
                        Materias Asignadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {allSubjects?.filter(s => s.cursoId === selectedCourse.firestoreId).length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No hay materias asignadas a este curso</p>
                          </div>
                        ) : (
                          allSubjects?.filter(s => s.cursoId === selectedCourse.firestoreId).map((subject) => (
                            <div key={subject.firestoreId} className="p-3 border rounded-lg bg-orange-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{subject.nombre}</h4>
                                  <p className="text-sm text-gray-600">
                                    Docente: {allTeachers?.find(t => t.firestoreId === subject.teacherId)?.nombre} {allTeachers?.find(t => t.firestoreId === subject.teacherId)?.apellido}
                                  </p>
                                </div>
                                <BookOpen className="h-4 w-4 text-orange-600" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Información adicional */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Creado: {selectedCourse.createdAt ? new Date(selectedCourse.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha no disponible'}
                    </span>
                    {selectedCourse.updatedAt && (
                      <span>
                        Actualizado: {new Date(selectedCourse.updatedAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          }
          footer={
            <Button 
              onClick={() => {
                setViewingCourseDetails(false);
                setSelectedCourse(null);
              }}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          }
        />
      </div>
    </div>
  );
}
