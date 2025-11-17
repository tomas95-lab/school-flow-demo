import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Plus, Calendar, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDateTime } from "@/utils/dateUtils";
import { toast } from "sonner";
import { EditReunionModal } from "@/components/EditReunionModal";
import { ViewReunionModal } from "@/components/ViewReunionModal";
import { DeleteReunionModal } from "@/components/DeleteReunionModal";

interface Reunion {
  firestoreId: string;
  teacherId: string;
  familyId: string;
  studentId: string;
  date: string;
  motivo: string;
  status: string;
  notas?: string;
  duracion?: number;
  modalidad?: string;
}

export default function ReunionesFamilias() {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const [formData, setFormData] = useState({
    studentId: "",
    fecha: "",
    motivo: ""
  });

  const { data: reuniones } = useFirestoreCollection<Reunion>("reuniones_familias", {
    constraints: user?.role === 'familiar' && user?.uid
      ? [where('familyId', '==', user.uid)]
      : user?.role === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    enableCache: true,
    dependencies: [user?.role, user?.uid, user?.teacherId, refreshKey]
  });

  const { data: students } = useFirestoreCollection("students", {
    constraints: user?.role === 'docente' && teacherCourseIds.length > 0
      ? [where('cursoId', 'in', teacherCourseIds.slice(0, 10))]
      : [],
    enableCache: true,
    dependencies: [teacherCourseIds.join(',')]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.fecha || !formData.motivo) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "reuniones_familias"), {
        teacherId: user?.teacherId || "",
        familyId: "demo-parent-1",
        studentId: formData.studentId,
        date: formData.fecha,
        motivo: formData.motivo,
        status: "scheduled",
        createdAt: serverTimestamp()
      });

      toast.success("Reunión programada exitosamente");
      
      setFormData({
        studentId: "",
        fecha: "",
        motivo: ""
      });

      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating reunion:", error);
      toast.error("Error al programar la reunión");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Reunion>[] = [
    {
      accessorKey: "studentId",
      header: "Estudiante",
      cell: ({ row }) => {
        const student = students?.find(s => s.firestoreId === row.original.studentId);
        return (
          <span className="font-medium text-gray-900">
            {student ? `${student.nombre} ${student.apellido}` : 'N/A'}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Fecha y Hora",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{formatDateTime(row.original.date)}</span>
        </div>
      ),
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => (
        <p className="text-sm text-gray-700 truncate max-w-xs">{row.original.motivo}</p>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status || 'scheduled';
        const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
          programada: { label: 'Programada', variant: 'default' },
          realizada: { label: 'Realizada', variant: 'secondary' },
          cancelada: { label: 'Cancelada', variant: 'destructive' },
          scheduled: { label: 'Programada', variant: 'default' },
          completed: { label: 'Realizada', variant: 'secondary' },
          cancelled: { label: 'Cancelada', variant: 'destructive' }
        };
        const statusConfig = config[status] || config.scheduled;
        return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const reunion = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedReunion(reunion);
                setViewModalOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {(user?.role === 'docente' || user?.role === 'admin') && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedReunion(reunion);
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
                    setSelectedReunion(reunion);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (!reuniones || reuniones.length === 0) {
    return (
      <Card className="bg-white shadow-lg border-gray-200">
        <CardContent className="py-12">
          <EmptyState
            icon={Video}
            title="No hay reuniones programadas"
            description={
              user?.role === 'docente'
                ? "Programa reuniones con las familias de tus estudiantes"
                : "Aún no tienes reuniones programadas con los docentes"
            }
          />
          {user?.role === 'docente' && (
            <div className="flex justify-center mt-6">
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Programar Reunión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reuniones Programadas</CardTitle>
              <CardDescription>Gestiona las reuniones con las familias</CardDescription>
            </div>
            {user?.role === 'docente' && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reunión
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={reuniones || []} 
            placeholder="Buscar reuniones..."
          />
        </CardContent>
      </Card>

      {user?.role === 'docente' && (
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Programar Reunión</DialogTitle>
              <DialogDescription>
                Programa una reunión con la familia de un estudiante
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student">Estudiante *</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.filter(s => s.firestoreId).map((student) => (
                      <SelectItem key={student.firestoreId} value={student.firestoreId!}>
                        {student.nombre} {student.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha y Hora *</Label>
                <Input
                  id="fecha"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Describe el motivo de la reunión..."
                  rows={3}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Programar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {selectedReunion && (
        <>
          <ViewReunionModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            reunion={selectedReunion}
          />
          <EditReunionModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            reunion={selectedReunion}
            onSuccess={handleRefresh}
          />
          <DeleteReunionModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            reunion={selectedReunion}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </>
  );
}

