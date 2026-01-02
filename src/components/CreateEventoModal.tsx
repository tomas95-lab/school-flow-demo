import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { db } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateEventoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateEventoModal({ open, onOpenChange, onSuccess }: CreateEventoModalProps) {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    descripcion: "",
    tipo: "evento" as "evento" | "examen",
    fecha: "",
    fechaFin: "",
    courseId: "",
    subjectId: "",
    allDay: true
  });

  const { data: subjects } = useFirestoreCollection("subjects", {
    enableCache: true
  });

  // Si es admin, cargar todos los cursos. Si es docente, usar los del hook
  const { data: allCourses } = useFirestoreCollection("courses", {
    enableCache: true
  });

  const availableCourses = user?.role === 'admin' ? allCourses : teacherCourses;

  const filteredSubjects = subjects?.filter(s => s.cursoId === formData.courseId) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.tipo || !formData.fecha) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        descripcion: formData.descripcion || "",
        tipo: formData.tipo,
        fecha: formData.fecha,
        fechaFin: formData.fechaFin || formData.fecha,
        courseId: formData.courseId || null,
        subjectId: formData.subjectId || null,
        allDay: formData.allDay,
        createdBy: user?.uid || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log("=== DEBUG CREATE EVENTO ===");
      console.log("User:", user);
      console.log("User role:", user?.role);
      console.log("User UID:", user?.uid);
      console.log("Event Data:", eventData);
      console.log("=========================");

      await addDoc(collection(db, "eventos_escolares"), eventData);

      toast.success("Evento creado exitosamente");
      
      setFormData({
        title: "",
        descripcion: "",
        tipo: "evento",
        fecha: "",
        fechaFin: "",
        courseId: "",
        subjectId: "",
        allDay: true
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("=== ERROR CREATING EVENTO ===");
      console.error("Error completo:", error);
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);
      console.error("============================");
      toast.error(`Error al crear el evento: ${error?.code || error?.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Evento</DialogTitle>
          <DialogDescription>
            Crea un nuevo evento en el calendario académico. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Examen Final de Matemáticas"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Evento *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "evento" | "examen") => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evento">📅 Evento Escolar</SelectItem>
                <SelectItem value="examen">📝 Examen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe el evento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Inicio *</Label>
              <Input
                id="fecha"
                type={formData.allDay ? "date" : "datetime-local"}
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha de Fin</Label>
              <Input
                id="fechaFin"
                type={formData.allDay ? "date" : "datetime-local"}
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked as boolean })}
            />
            <Label htmlFor="allDay" className="text-sm font-normal cursor-pointer">
              Evento de todo el día
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Curso (Opcional)</Label>
              <Select
                value={formData.courseId || undefined}
                onValueChange={(value) => setFormData({ ...formData, courseId: value, subjectId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses?.filter(c => c.firestoreId).map((course) => (
                    <SelectItem key={course.firestoreId} value={course.firestoreId!}>
                      {course.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Materia (Opcional)</Label>
              <Select
                value={formData.subjectId || undefined}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                disabled={!formData.courseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una materia (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.filter(s => s.firestoreId).map((subject) => (
                    <SelectItem key={subject.firestoreId} value={subject.firestoreId!}>
                      {subject.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
