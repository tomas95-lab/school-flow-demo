import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  BookOpen,
  TrendingUp,
  Calendar,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/utils/dateUtils";
import { EditTareaModal } from "@/components/EditTareaModal";
import { ViewTareaModal } from "@/components/ViewTareaModal";
import { DeleteTareaModal } from "@/components/DeleteTareaModal";

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
}

export default function AdminTareasOverview() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: tareas } = useFirestoreCollection<Tarea>("tareas", { 
    enableCache: true,
    dependencies: [refreshKey]
  });
  const { data: courses } = useFirestoreCollection("courses", { enableCache: true });
  const { data: subjects } = useFirestoreCollection("subjects", { enableCache: true });
  const { data: students } = useFirestoreCollection("students", { enableCache: true });

  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const stats = useMemo(() => {
    if (!tareas) return { total: 0, activas: 0, cerradas: 0, proximasVencer: 0 };

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return {
      total: tareas.length,
      activas: tareas.filter(t => t.status === 'active').length,
      cerradas: tareas.filter(t => t.status === 'closed').length,
      proximasVencer: tareas.filter(t => {
        const dueDate = new Date(t.dueDate);
        return t.status === 'active' && dueDate <= in3Days && dueDate >= now;
      }).length
    };
  }, [tareas]);

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
        return <span className="text-sm text-gray-700">{course?.nombre || 'N/A'}</span>;
      },
    },
    {
      accessorKey: "subjectId",
      header: "Materia",
      cell: ({ row }) => {
        const subject = subjects?.find(s => s.firestoreId === row.original.subjectId);
        return <span className="text-sm text-gray-700">{subject?.nombre || 'N/A'}</span>;
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
      accessorKey: "points",
      header: "Puntos",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-indigo-600">
          {row.original.points || 0} pts
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const tarea = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedTarea(tarea);
                setViewModalOpen(true);
              }}
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
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!tareas || tareas.length === 0) {
    return (
      <EmptyState
        icon={BookCheck}
        title="No hay tareas creadas"
        description="Comienza creando la primera tarea para tus estudiantes"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-indigo-700">Total Tareas</CardTitle>
              <BookCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{stats.total}</div>
            <p className="text-xs text-indigo-600 mt-1">Todas las tareas del sistema</p>
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
            <p className="text-xs text-emerald-600 mt-1">En curso actualmente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700">Por vencer</CardTitle>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.proximasVencer}</div>
            <p className="text-xs text-amber-600 mt-1">Vencen en 3 días</p>
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
            <p className="text-xs text-gray-600 mt-1">Tareas completadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listado de Tareas</CardTitle>
              <CardDescription>Todas las tareas del sistema</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {tareas.length} tareas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={tareas} 
            placeholder="Buscar tareas..."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">Estudiantes Activos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{students?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Con tareas asignadas</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">Cursos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{courses?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Cursos con tareas</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">Tasa de Entrega</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">85%</div>
            <p className="text-xs text-gray-500 mt-1">Promedio general</p>
          </CardContent>
        </Card>
      </div>

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
        </>
      )}
    </div>
  );
}

