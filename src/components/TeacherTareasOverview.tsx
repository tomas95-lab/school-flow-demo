import { useContext, useMemo, useState } from "react";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { AuthContext } from "@/context/AuthContext";
import { where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Award
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { EditTareaModal } from "@/components/EditTareaModal";
import { ViewTareaModal } from "@/components/ViewTareaModal";
import { DeleteTareaModal } from "@/components/DeleteTareaModal";
import { GradeTareaModal } from "@/components/GradeTareaModal";

interface Tarea {
  firestoreId: string;
  title: string;
  description?: string;
  courseId: string;
  subjectId: string;
  teacherId: string;
  studentIds?: string[];
  dueDate: string;
  status: 'active' | 'closed';
  createdAt: string;
  points?: number;
  submissionsCount?: number;
}

export default function TeacherTareasOverview() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { data: tareas } = useFirestoreCollection<Tarea>("tareas", {
    constraints: teacherCourseIds.length > 0 
      ? [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
      : [],
    enableCache: true,
    dependencies: [teacherCourseIds.join(','), refreshKey]
  });

  const { data: courses } = useFirestoreCollection("courses", {
    constraints: user?.teacherId ? [where('teacherId', '==', user.teacherId)] : [],
    dependencies: [user?.teacherId]
  });

  const { data: subjects } = useFirestoreCollection("subjects", {
    constraints: user?.teacherId ? [where('teacherId', '==', user.teacherId)] : [],
    dependencies: [user?.teacherId]
  });

  const { data: submissions } = useFirestoreCollection("tarea_submissions", {
    enableCache: true,
    dependencies: [refreshKey]
  });

  const tareasWithSubmissions = useMemo(() => {
    if (!tareas || !submissions) return tareas || [];
    
    return tareas.map(tarea => {
      const tareaSubmissions = submissions.filter((s: any) => s.tareaId === tarea.firestoreId);
      const submittedCount = tareaSubmissions.filter((s: any) => s.status === 'submitted' || s.status === 'graded').length;
      const gradedCount = tareaSubmissions.filter((s: any) => s.status === 'graded').length;
      
      return {
        ...tarea,
        submissionsCount: submittedCount,
        gradedCount: gradedCount,
        pendingGradeCount: submittedCount - gradedCount
      };
    });
  }, [tareas, submissions]);

  const stats = useMemo(() => {
    if (!tareasWithSubmissions) return { total: 0, activas: 0, cerradas: 0, porCalificar: 0 };

    return {
      total: tareasWithSubmissions.length,
      activas: tareasWithSubmissions.filter(t => t.status === 'active').length,
      cerradas: tareasWithSubmissions.filter(t => t.status === 'closed').length,
      porCalificar: tareasWithSubmissions.filter(t => (t.submissionsCount || 0) > 0 && t.status === 'active').length
    };
  }, [tareasWithSubmissions]);

  const columns: ColumnDef<Tarea>[] = [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "courseId",
      header: "Curso",
      cell: ({ row }) => {
        const course = courses?.find(c => c.firestoreId === row.original.courseId);
        if (!course) {
          return (
            <span className="text-xs text-gray-400 italic" title={`ID: ${row.original.courseId}`}>
              Sin curso
            </span>
          );
        }
        return (
          <Badge variant="outline" className="text-xs">
            {course.nombre}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Fecha límite",
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now && row.original.status === 'active';
        
        return (
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
              {formatDate(row.original.dueDate)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "submissionsCount",
      header: "Entregas",
      cell: ({ row }) => {
        const total = row.original.submissionsCount || 0;
        const pendingGrade = (row.original as any).pendingGradeCount || 0;
        const graded = (row.original as any).gradedCount || 0;
        
        if (total === 0) {
          return (
            <div className="text-center">
              <span className="text-xs text-gray-400">Sin entregas</span>
            </div>
          );
        }
        
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-600">{total}</span>
              <span className="text-xs text-gray-500">total</span>
            </div>
            {pendingGrade > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                {pendingGrade} por calificar
              </Badge>
            )}
            {graded > 0 && (
              <span className="text-xs text-green-600">
                {graded} calificadas
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Activa' : 'Cerrada'}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const tarea = row.original;
        const hasSubmissions = (tarea.submissionsCount || 0) > 0;
        
        return (
          <div className="flex gap-1">
            {hasSubmissions && (
              <Button
                size="sm"
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  setSelectedTarea(tarea);
                  setGradeModalOpen(true);
                }}
                title="Calificar entregas"
              >
                <Award className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedTarea(tarea);
                setViewModalOpen(true);
              }}
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedTarea(tarea);
                setEditModalOpen(true);
              }}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setSelectedTarea(tarea);
                setDeleteModalOpen(true);
              }}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!tareasWithSubmissions || tareasWithSubmissions.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={BookCheck}
          title="No has creado tareas aún"
          description="Comienza creando tu primera tarea para tus estudiantes"
        />
        <div className="flex justify-center">
          <Button onClick={() => navigate("/app/tareas/crear")}>
            <Plus className="w-4 h-4 mr-2" />
            Crear primera tarea
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-indigo-700">Mis Tareas</CardTitle>
              <BookCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{stats.total}</div>
            <p className="text-xs text-indigo-600 mt-1">Tareas creadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700">Activas</CardTitle>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{stats.activas}</div>
            <p className="text-xs text-emerald-600 mt-1">En curso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700">Por calificar</CardTitle>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.porCalificar}</div>
            <p className="text-xs text-amber-600 mt-1">Entregas pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Cerradas</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.cerradas}</div>
            <p className="text-xs text-gray-600 mt-1">Finalizadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Tareas Asignadas</CardTitle>
              <CardDescription>Tareas que has creado para tus estudiantes</CardDescription>
            </div>
            <Button onClick={() => navigate("/app/tareas/crear")}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={tareasWithSubmissions} 
            placeholder="Buscar tareas..."
          />
        </CardContent>
      </Card>

      {selectedTarea && (
        <>
          <ViewTareaModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            tarea={{ ...selectedTarea, studentIds: selectedTarea.studentIds || [] }}
            courseName={courses?.find(c => c.firestoreId === selectedTarea.courseId)?.nombre}
            subjectName={subjects?.find(s => s.firestoreId === selectedTarea.subjectId)?.nombre}
          />
          <EditTareaModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            tarea={{ ...selectedTarea, studentIds: selectedTarea.studentIds || [] }}
            onSuccess={handleRefresh}
          />
          <DeleteTareaModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            tarea={{ ...selectedTarea, studentIds: selectedTarea.studentIds || [] }}
            onSuccess={handleRefresh}
          />
          <GradeTareaModal
            open={gradeModalOpen}
            onOpenChange={setGradeModalOpen}
            tarea={selectedTarea}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
}

