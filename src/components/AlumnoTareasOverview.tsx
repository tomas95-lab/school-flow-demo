import { useContext, useMemo, useState } from "react";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
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
  Calendar,
  FileText,
  Upload,
  Award
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/utils/dateUtils";
import { Progress } from "@/components/ui/progress";
import { SubmitTareaModal } from "@/components/SubmitTareaModal";

interface Tarea {
  firestoreId: string;
  title: string;
  description?: string;
  courseId: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  status: 'active' | 'closed';
  createdAt: string;
  points?: number;
  studentStatus?: 'pending' | 'submitted' | 'graded';
  studentGrade?: number;
}

export default function AlumnoTareasOverview() {
  const { user } = useContext(AuthContext);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { data: tareas } = useFirestoreCollection<Tarea>("tareas", {
    constraints: user?.studentId 
      ? [where('studentIds', 'array-contains', user.studentId)]
      : [],
    enableCache: true,
    dependencies: [user?.studentId, refreshKey]
  });

  const { data: submissions } = useFirestoreCollection("tarea_submissions", {
    constraints: user?.studentId 
      ? [where('studentId', '==', user.studentId)]
      : [],
    enableCache: true,
    dependencies: [user?.studentId, refreshKey]
  });

  const { data: subjects } = useFirestoreCollection("subjects", { enableCache: true });

  const tareasWithStatus = useMemo(() => {
    if (!tareas || !submissions) return tareas || [];
    
    return tareas.map(tarea => {
      const submission = submissions.find((s: any) => s.tareaId === tarea.firestoreId);
      
      if (!submission) {
        return { ...tarea, studentStatus: 'pending' as const };
      }
      
      return {
        ...tarea,
        studentStatus: submission.status as 'pending' | 'submitted' | 'graded',
        studentGrade: submission.grade,
        submittedAt: submission.submittedAt
      };
    });
  }, [tareas, submissions]);

  const stats = useMemo(() => {
    if (!tareasWithStatus) return { 
      total: 0, 
      pendientes: 0, 
      entregadas: 0, 
      calificadas: 0, 
      atrasadas: 0,
      promedioNotas: 0 
    };

    const now = new Date();
    const calificadas = tareasWithStatus.filter(t => t.studentStatus === 'graded');
    const promedio = calificadas.length > 0
      ? calificadas.reduce((sum, t) => sum + (t.studentGrade || 0), 0) / calificadas.length
      : 0;

    return {
      total: tareasWithStatus.length,
      pendientes: tareasWithStatus.filter(t => t.studentStatus === 'pending' || !t.studentStatus).length,
      entregadas: tareasWithStatus.filter(t => t.studentStatus === 'submitted').length,
      calificadas: calificadas.length,
      atrasadas: tareasWithStatus.filter(t => {
        const dueDate = new Date(t.dueDate);
        return (t.studentStatus === 'pending' || !t.studentStatus) && dueDate < now;
      }).length,
      promedioNotas: promedio
    };
  }, [tareasWithStatus]);

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
      accessorKey: "subjectId",
      header: "Materia",
      cell: ({ row }) => {
        const subject = subjects?.find(s => s.firestoreId === row.original.subjectId);
        if (!subject) {
          return (
            <span className="text-xs text-gray-400 italic" title={`ID: ${row.original.subjectId}`}>
              Sin materia
            </span>
          );
        }
        return (
          <Badge variant="outline" className="text-xs">
            {subject.nombre}
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
        const isOverdue = dueDate < now && (row.original.studentStatus === 'pending' || !row.original.studentStatus);
        
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
      accessorKey: "studentStatus",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.studentStatus || 'pending';
        const statusConfig = {
          pending: { label: 'Pendiente', variant: 'secondary' as const, color: 'text-amber-600' },
          submitted: { label: 'Entregada', variant: 'outline' as const, color: 'text-blue-600' },
          graded: { label: 'Calificada', variant: 'default' as const, color: 'text-green-600' }
        };
        const config = statusConfig[status];
        
        return (
          <Badge variant={config.variant} className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "studentGrade",
      header: "Nota",
      cell: ({ row }) => {
        if (row.original.studentStatus !== 'graded') {
          return <span className="text-xs text-gray-400">-</span>;
        }
        const grade = row.original.studentGrade || 0;
        const color = grade >= 7 ? 'text-green-600' : grade >= 4 ? 'text-amber-600' : 'text-red-600';
        
        return (
          <div className="flex items-center gap-1">
            <Award className={`w-4 h-4 ${color}`} />
            <span className={`text-sm font-medium ${color}`}>
              {grade.toFixed(1)}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const tarea = row.original;
        return (
          <div className="flex gap-2">
            {tarea.studentStatus === 'pending' || !tarea.studentStatus ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setSelectedTarea(tarea);
                  setSubmitModalOpen(true);
                }}
              >
                <Upload className="w-3 h-3 mr-1" />
                Entregar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled
              >
                <FileText className="w-3 h-3 mr-1" />
                Entregada
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (!tareasWithStatus || tareasWithStatus.length === 0) {
    return (
      <EmptyState
        icon={BookCheck}
        title="No tienes tareas asignadas"
        description="Cuando tus docentes asignen tareas, aparecerán aquí"
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
            <p className="text-xs text-indigo-600 mt-1">Tareas asignadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700">Pendientes</CardTitle>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.pendientes}</div>
            <p className="text-xs text-amber-600 mt-1">Por entregar</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Entregadas</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.entregadas}</div>
            <p className="text-xs text-blue-600 mt-1">Esperando calificación</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700">Atrasadas</CardTitle>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats.atrasadas}</div>
            <p className="text-xs text-red-600 mt-1">Fecha vencida</p>
          </CardContent>
        </Card>
      </div>

      {stats.atrasadas > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Tienes {stats.atrasadas} tarea{stats.atrasadas > 1 ? 's' : ''} atrasada{stats.atrasadas > 1 ? 's' : ''}</h3>
                <p className="text-sm text-red-700 mt-1">
                  Revisa las tareas pendientes y entrega lo antes posible para evitar perder puntos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white shadow border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Progreso General</CardTitle>
            <CardDescription>Tu avance en las tareas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Completadas</span>
                <span className="font-medium">{stats.calificadas}/{stats.total}</span>
              </div>
              <Progress value={(stats.calificadas / stats.total) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Promedio de notas</span>
                <span className="font-bold text-indigo-600">{stats.promedioNotas.toFixed(1)}</span>
              </div>
              <Progress value={(stats.promedioNotas / 10) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Rendimiento
            </CardTitle>
            <CardDescription>Tu desempeño en tareas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-700">{stats.promedioNotas.toFixed(1)}</div>
              <p className="text-sm text-green-600 mt-1">Promedio general</p>
              <div className="mt-4 text-xs text-gray-600">
                {stats.calificadas} tareas calificadas
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Tareas</CardTitle>
              <CardDescription>Todas las tareas asignadas a ti</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {tareasWithStatus.length} tareas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={tareasWithStatus} 
            placeholder="Buscar tareas..."
          />
        </CardContent>
      </Card>

      {selectedTarea && user?.studentId && (
        <SubmitTareaModal
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          tarea={selectedTarea}
          studentId={user.studentId}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

