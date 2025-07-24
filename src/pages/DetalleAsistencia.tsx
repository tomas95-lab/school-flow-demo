import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Filter,
  Download,
  Eye,
  Edit,
  Table,
  List,
  Plus
} from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useColumnsDetalle } from "@/app/asistencias/columns";
import { DataTable } from "@/components/data-table";
import { useSearchParams, Link } from "react-router-dom";
import { filterSubjectsByCourse } from "@/utils/subjectUtils";
import QuickAttendanceRegister from "@/components/QuickAttendanceRegister";
import ReutilizableDialog from "@/components/DialogReutlizable";

type Student = {
  firestoreId: string;
  nombre: string;
  apellido: string;
  cursoId: string;
};

type Subject = {
  firestoreId: string;
  nombre: string;
  teacherId: string;
  cursoId: string | string[]; // Array de cursos o string para compatibilidad
};

type Attendance = {
  firestoreId: string;
  studentId: string;
  courseId: string;
  subject: string;
  date: string;
  present: boolean;
  createdAt?: any;
};

export default function DetalleAsistencia() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");
  
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Obtener datos
  const { data: courses, loading: loadingCourses } = useFirestoreCollection("courses");
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>("students");
  const { data: subjects, loading: loadingSubjects } = useFirestoreCollection<Subject>("subjects");
  const { data: attendances, loading: loadingAttendances } = useFirestoreCollection<Attendance>("attendances");

  // Calcular semana actual (siempre se ejecuta)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Encontrar el curso
  const course = useMemo(() => courses?.find(c => c.firestoreId === courseId), [courses, courseId]);

  // Filtrar estudiantes del curso
  const courseStudents = useMemo(() => 
    students?.filter(s => s.cursoId === courseId) || [], 
    [students, courseId]
  );
  
  // Filtrar materias del curso (usando función utilitaria)
  const courseSubjects = useMemo(() => 
    filterSubjectsByCourse(subjects || [], courseId || ''), 
    [subjects, courseId]
  );
  
  // Filtrar asistencias del curso
  const courseAttendances = useMemo(() => 
    attendances?.filter(a => a.courseId === courseId) || [], 
    [attendances, courseId]
  );

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalRecords = courseAttendances.length;
    const presentRecords = courseAttendances.filter(a => a.present).length;
    const absentRecords = totalRecords - presentRecords;
    const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Estadísticas por materia
    const subjectStats = courseSubjects.map(subject => {
      const subjectAttendances = courseAttendances.filter(a => a.subject === subject.nombre);
      const subjectTotal = subjectAttendances.length;
      const subjectPresent = subjectAttendances.filter(a => a.present).length;
      const subjectPercentage = subjectTotal > 0 ? Math.round((subjectPresent / subjectTotal) * 100) : 0;
      
      return {
        subject: subject.nombre,
        total: subjectTotal,
        present: subjectPresent,
        absent: subjectTotal - subjectPresent,
        percentage: subjectPercentage
      };
    });

    // Estadísticas por estudiante
    const studentStats = courseStudents.map(student => {
      const studentAttendances = courseAttendances.filter(a => a.studentId === student.firestoreId);
      const studentTotal = studentAttendances.length;
      const studentPresent = studentAttendances.filter(a => a.present).length;
      const studentPercentage = studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;
      
      return {
        student: student,
        total: studentTotal,
        present: studentPresent,
        absent: studentTotal - studentPresent,
        percentage: studentPercentage
      };
    });

    return {
      totalRecords,
      presentRecords,
      absentRecords,
      attendancePercentage,
      subjectStats,
      studentStats
    };
  }, [courseAttendances, courseSubjects, courseStudents]);

  // Filtrar datos para la tabla
  const filteredAttendances = useMemo(() => {
    let filtered = courseAttendances;

    if (selectedSubject && selectedSubject !== "all") {
      filtered = filtered.filter(a => a.subject === selectedSubject);
    }

    if (selectedDate) {
      filtered = filtered.filter(a => a.date === selectedDate);
    }

    if (filterStatus !== "all") {
      const isPresent = filterStatus === "present";
      filtered = filtered.filter(a => a.present === isPresent);
    }

    return filtered;
  }, [courseAttendances, selectedSubject, selectedDate, filterStatus]);

  // Preparar datos para la tabla
  const tableData = useMemo(() => {
    return filteredAttendances.map(attendance => {
      const student = courseStudents.find(s => s.firestoreId === attendance.studentId);
      return {
        id: attendance.studentId,
        Nombre: student ? `${student.nombre} ${student.apellido}` : "Estudiante no encontrado",
        present: attendance.present,
        fecha: attendance.date,
        idAsistencia: attendance.firestoreId,
        subject: attendance.subject
      };
    });
  }, [filteredAttendances, courseStudents]);

  const columns = useColumnsDetalle(user);

  // Función para exportar a CSV
  const exportToCSV = () => {
    if (!course || tableData.length === 0) return;

    // Crear encabezados
    const headers = [
      "Estudiante",
      "Materia", 
      "Fecha",
      "Estado",
      "Curso"
    ];

    // Crear filas de datos
    const rows = tableData.map(row => [
      row.Nombre,
      row.subject,
      format(new Date(row.fecha), 'dd/MM/yyyy'),
      row.present ? "Presente" : "Ausente",
      `${course.nombre} - ${course.division}`
    ]);

    // Combinar encabezados y datos
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `asistencias_${course.nombre}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mostrar loading si los datos están cargando
  if (loadingCourses || loadingStudents || loadingSubjects || loadingAttendances) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolSpinner text="Cargando detalles de asistencia..." fullScreen={true} />
          <p className="text-gray-500 mt-4">Preparando información del curso</p>
        </div>
      </div>
    );
  }

  // Mostrar error si el curso no existe
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Curso no encontrado</h2>
          <p className="text-gray-600 mb-6">El curso que buscas no existe o no tienes permisos para verlo.</p>
          <Link to="/asistencias">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Asistencias
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/asistencias">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {course.nombre} - {course.division}
                </h1>
                <p className="text-gray-600">
                  Detalle de asistencias del curso
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === "docente" && (
                <Button 
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Asistencias
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={tableData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-r-none"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendario semanal */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Semana del {format(weekStart, 'dd MMM', { locale: es })} al {format(weekEnd, 'dd MMM yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayAttendances = courseAttendances.filter(a => a.date === format(day, 'yyyy-MM-dd'));
                  const dayPresent = dayAttendances.filter(a => a.present).length;
                  const dayTotal = dayAttendances.length;
                  const dayPercentage = dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0;
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 text-center rounded-lg border transition-colors ${
                        dayAttendances.length > 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {format(day, 'EEE', { locale: es })}
                      </div>
                      <div className="text-lg font-semibold">
                        {format(day, 'dd')}
                      </div>
                      {dayAttendances.length > 0 && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          {dayPercentage}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estudiantes</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStudents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Presentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.presentRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ausentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.absentRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asistencia</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.attendancePercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de asistencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Registros de Asistencia ({tableData.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {viewMode === "table" && <Badge variant="outline">Vista Tabla</Badge>}
                {viewMode === "list" && <Badge variant="outline">Vista Lista</Badge>}
              </div>
            </div>
            
            {/* Filtros integrados */}
            <div className="flex items-end gap-4">
              <div>
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-1">Materia</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las materias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las materias</SelectItem>
                    {courseSubjects.map(subject => (
                      <SelectItem key={subject.firestoreId} value={subject.nombre}>
                        {subject.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1 block">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  placeholder="Todas las fechas"
                />
              </div>
              
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1 block">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="present">Presentes</SelectItem>
                    <SelectItem value="absent">Ausentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <DataTable columns={columns} data={tableData} />
            ) : (
              <div className="space-y-3">
                {tableData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay registros que coincidan con los filtros seleccionados.
                  </div>
                ) : (
                  tableData.map((row, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{row.Nombre}</p>
                          <p className="text-sm text-gray-500">{row.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={row.present ? "default" : "destructive"}>
                          {row.present ? "Presente" : "Ausente"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(row.fecha), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de registro de asistencias */}
        <ReutilizableDialog
          open={showRegisterModal}
          onOpenChange={setShowRegisterModal}
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Plus className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Registrar Asistencias</h2>
                <p className="text-sm text-gray-600">
                  {course?.nombre} - {course?.division}
                </p>
              </div>
            </div>
          }
          description="Marca la asistencia de los estudiantes del curso"
          content={<QuickAttendanceRegister courseId={courseId || ""} />}
          small={false}
        />
      </div>
    </div>
  );
}
