import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { db } from "@/firebaseConfig";
import { collection, addDoc, where } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateReunionModal({ open, onOpenChange, onSuccess }: CreateReunionModalProps) {
  const { user } = useContext(AuthContext);
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    courseId: "",
    motivo: "",
    date: "",
    duracion: "30"
  });

  const { data: students } = useFirestoreCollection("students", {
    enableCache: true
  });

  const { data: users } = useFirestoreCollection("users", {
    constraints: [where('role', '==', 'familiar')],
    enableCache: true
  });

  // Si es admin, cargar todos los cursos. Si es docente, usar los del hook
  const { data: allCourses } = useFirestoreCollection("courses", {
    enableCache: true
  });

  const availableCourses = user?.role === 'admin' ? allCourses : teacherCourses;

  const filteredStudents = students?.filter(s => {
    if (!formData.courseId) return true;
    return s.cursoId === formData.courseId;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.motivo || !formData.date) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const student = students?.find(s => s.firestoreId === formData.studentId);
    if (!student) {
      toast.error("No se encontró el estudiante seleccionado");
      return;
    }

    const familiar = users?.find(u => u.studentId === formData.studentId);
    const familyId = familiar?.uid || 'demo-parent-1';

    setLoading(true);

    try {
      await addDoc(collection(db, "reuniones_familias"), {
        teacherId: user?.teacherId || "",
        familyId: familyId,
        studentId: formData.studentId,
        studentName: student.nombre,
        motivo: formData.motivo,
        date: formData.date,
        duracion: parseInt(formData.duracion) || 30,
        status: "programada",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success("Reunión programada exitosamente");
      
      setFormData({
        studentId: "",
        courseId: "",
        motivo: "",
        date: "",
        duracion: "30"
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating reunion:", error);
      toast.error("Error al programar la reunión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Programar Reunión con Familia</DialogTitle>
          <DialogDescription>
            Programa una reunión con los padres o tutores de un estudiante. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Filtrar por Curso</Label>
              <Select
                value={formData.courseId || undefined}
                onValueChange={(value) => setFormData({ ...formData, courseId: value, studentId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
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
              <Label htmlFor="student">Estudiante *</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.filter(s => s.firestoreId).map((student) => (
                    <SelectItem key={student.firestoreId} value={student.firestoreId!}>
                      {student.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la Reunión *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ej: Discutir rendimiento académico del primer trimestre"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha y Hora *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracion">Duración (minutos)</Label>
              <Select
                value={formData.duracion}
                onValueChange={(value) => setFormData({ ...formData, duracion: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
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
              Programar Reunión
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
