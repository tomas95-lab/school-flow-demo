import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where, collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Plus, Calendar, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDateTime } from "@/utils/dateUtils";
import ReutilizableDialog from "@/components/DialogReutlizable";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { toast } from "sonner";

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

function CreateReunionCell({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    fecha: "",
    motivo: "",
    modalidad: "presencial",
    duracion: 30
  });

  const { data: students } = useFirestoreCollection("students", {
    constraints: teacherCourseIds.length > 0
      ? [where('cursoId', 'in', teacherCourseIds.slice(0, 10))]
      : [],
    enableCache: true,
    dependencies: [teacherCourseIds.join(',')]
  });

  const { data: users } = useFirestoreCollection("users", {
    constraints: [where('role', '==', 'familiar')],
    enableCache: true
  });

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.fecha || !formData.motivo) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);

    try {
      const familiar = users?.find(u => u.studentId === formData.studentId);
      const familyId = familiar?.uid || 'demo-parent-1';

      await addDoc(collection(db, "reuniones_familias"), {
        teacherId: user?.teacherId || "",
        familyId: familyId,
        studentId: formData.studentId,
        date: formData.fecha,
        motivo: formData.motivo,
        modalidad: formData.modalidad,
        duracion: formData.duracion,
        status: "scheduled",
        createdAt: new Date().toISOString()
      });

      toast.success("Reunión programada exitosamente");

      setFormData({
        studentId: "",
        fecha: "",
        motivo: "",
        modalidad: "presencial",
        duracion: 30
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating reunion:", error);
      toast.error("Error al programar la reunión");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="modalidad">Modalidad</Label>
        <Select
          value={formData.modalidad}
          onValueChange={(value) => setFormData({ ...formData, modalidad: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="virtual">Virtual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duracion">Duración (minutos)</Label>
        <Input
          id="duracion"
          type="number"
          min="15"
          step="15"
          value={formData.duracion}
          onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
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
        />
      </div>

      {loading && (
        <div className="text-blue-600 text-sm mt-2">Guardando...</div>
      )}
    </div>
  );

  const formFooter = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Programar
      </Button>
    </>
  );

  return (
    <ReutilizableDialog
      small={false}
      open={open}
      onOpenChange={setOpen}
      title="Programar Reunión"
      description="Programa una reunión con la familia de un estudiante"
      content={formContent}
      footer={formFooter}
      triger={
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Reunión
        </span>
      }
      background={true}
    />
  );
}

function ViewReunionCell({ reunion }: { reunion: Reunion }) {
  const [open, setOpen] = useState(false);

  const { data: students } = useFirestoreCollection("students", { enableCache: true });
  const student = students?.find(s => s.firestoreId === reunion.studentId);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return map[status] || status;
  };

  const content = (
    <div className="space-y-4">
      <div>
        <Label>Estudiante</Label>
        <p className="text-sm text-gray-700 mt-1">
          {student ? `${student.nombre} ${student.apellido}` : 'Sin estudiante'}
        </p>
      </div>
      <div>
        <Label>Fecha y Hora</Label>
        <p className="text-sm text-gray-700 mt-1">{formatDateTime(reunion.date)}</p>
      </div>
      <div>
        <Label>Modalidad</Label>
        <p className="text-sm text-gray-700 mt-1">{reunion.modalidad || 'N/A'}</p>
      </div>
      <div>
        <Label>Duración</Label>
        <p className="text-sm text-gray-700 mt-1">{reunion.duracion} minutos</p>
      </div>
      <div>
        <Label>Estado</Label>
        <p className="text-sm text-gray-700 mt-1">{getStatusLabel(reunion.status)}</p>
      </div>
      <div>
        <Label>Motivo</Label>
        <p className="text-sm text-gray-700 mt-1">{reunion.motivo}</p>
      </div>
      {reunion.notas && (
        <div>
          <Label>Notas</Label>
          <p className="text-sm text-gray-700 mt-1">{reunion.notas}</p>
        </div>
      )}
    </div>
  );

  return (
    <ReutilizableDialog
      small={true}
      open={open}
      onOpenChange={setOpen}
      title="Detalles de la Reunión"
      description="Información completa de la reunión"
      content={content}
      triger={<Eye className="w-4 h-4" />}
    />
  );
}

function EditReunionCell({ reunion, onSuccess }: { reunion: Reunion; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha: reunion.date,
    motivo: reunion.motivo,
    modalidad: reunion.modalidad || "presencial",
    duracion: reunion.duracion || 30,
    status: reunion.status,
    notas: reunion.notas || ""
  });

  const handleSubmit = async () => {
    if (!formData.fecha || !formData.motivo) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, "reuniones_familias", reunion.firestoreId), {
        date: formData.fecha,
        motivo: formData.motivo,
        modalidad: formData.modalidad,
        duracion: formData.duracion,
        status: formData.status,
        notas: formData.notas
      });

      toast.success("Reunión actualizada exitosamente");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating reunion:", error);
      toast.error("Error al actualizar la reunión");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Fecha y Hora *</Label>
        <Input
          type="datetime-local"
          value={formData.fecha}
          onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Programada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Modalidad</Label>
        <Select
          value={formData.modalidad}
          onValueChange={(value) => setFormData({ ...formData, modalidad: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="virtual">Virtual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Duración (minutos)</Label>
        <Input
          type="number"
          min="15"
          step="15"
          value={formData.duracion}
          onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label>Motivo *</Label>
        <Textarea
          value={formData.motivo}
          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          rows={2}
        />
      </div>

      {loading && (
        <div className="text-blue-600 text-sm">Guardando...</div>
      )}
    </div>
  );

  const formFooter = (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Guardar
      </Button>
    </>
  );

  return (
    <ReutilizableDialog
      small={false}
      open={open}
      onOpenChange={setOpen}
      title="Editar Reunión"
      description="Modifica los detalles de la reunión"
      content={formContent}
      footer={formFooter}
      triger={<Edit className="w-4 h-4" />}
    />
  );
}

function DeleteReunionCell({ reunion, onSuccess }: { reunion: Reunion; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteDoc(doc(db, "reuniones_familias", reunion.firestoreId));
      toast.success("Reunión eliminada exitosamente");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting reunion:", error);
      toast.error("Error al eliminar la reunión");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        ¿Estás seguro de que deseas eliminar esta reunión? Esta acción no se puede deshacer.
      </p>
      {loading && (
        <div className="text-blue-600 text-sm">Eliminando...</div>
      )}
    </div>
  );

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Eliminar
      </Button>
    </>
  );

  return (
    <ReutilizableDialog
      small={true}
      open={open}
      onOpenChange={setOpen}
      title="Eliminar Reunión"
      description="Esta acción no se puede deshacer"
      content={content}
      footer={footer}
      triger={<Trash2 className="w-4 h-4" />}
    />
  );
}

export default function ReunionesFamilias() {
  const { user } = useContext(AuthContext);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
    enableCache: true
  });

  const columns: ColumnDef<Reunion>[] = [
    {
      accessorKey: "studentId",
      header: "Estudiante",
      cell: ({ row }) => {
        const student = students?.find(s => s.firestoreId === row.original.studentId);
        if (!student) {
          return (
            <span className="text-xs text-gray-400 italic" title={`ID: ${row.original.studentId}`}>
              Sin estudiante
            </span>
          );
        }
        return (
          <span className="font-medium text-gray-900">
            {student.nombre} {student.apellido}
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
            <ViewReunionCell reunion={reunion} />
            {(user?.role === 'docente' || user?.role === 'admin') && (
              <>
                <EditReunionCell reunion={reunion} onSuccess={handleRefresh} />
                <DeleteReunionCell reunion={reunion} onSuccess={handleRefresh} />
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
              <CreateReunionCell onSuccess={handleRefresh} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reuniones Programadas</CardTitle>
            <CardDescription>Gestiona las reuniones con las familias</CardDescription>
          </div>
          {user?.role === 'docente' && (
            <CreateReunionCell onSuccess={handleRefresh} />
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
  );
}
