import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTareaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateTareaModal({ open, onOpenChange, onSuccess }: CreateTareaModalProps) {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    subjectId: "",
    dueDate: "",
    points: "100"
  });

  const { data: subjects } = useFirestoreCollection("subjects", {
    enableCache: true
  });

  const { data: students } = useFirestoreCollection("students", {
    enableCache: true
  });

  const filteredSubjects = subjects?.filter(s => s.cursoId === formData.courseId) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.courseId || !formData.subjectId || !formData.dueDate) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);

    try {
      const courseStudents = students?.filter(s => s.cursoId === formData.courseId).map(s => s.firestoreId) || [];

      await addDoc(collection(db, "tareas"), {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        subjectId: formData.subjectId,
        teacherId: user?.teacherId || "",
        studentIds: courseStudents,
        dueDate: formData.dueDate,
        status: "active",
        points: parseInt(formData.points) || 100,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success("Tarea creada exitosamente");
      
      setFormData({
        title: "",
        description: "",
        courseId: "",
        subjectId: "",
        dueDate: "",
        points: "100"
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating tarea:", error);
      toast.error("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
          <DialogDescription>
            Crea una nueva tarea para tus estudiantes. Todos los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Trabajo Práctico N°1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe las instrucciones de la tarea..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Curso *</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => setFormData({ ...formData, courseId: value, subjectId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {teacherCourses?.map((course) => (
                    <SelectItem key={course.firestoreId} value={course.firestoreId}>
                      {course.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Materia *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                disabled={!formData.courseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una materia" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de entrega *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Puntos</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                min="0"
                max="1000"
              />
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
              Crear Tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

