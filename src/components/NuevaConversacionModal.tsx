import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface NuevaConversacionModalProps {
  onSuccess?: () => void;
}

export function NuevaConversacionModal({ onSuccess }: NuevaConversacionModalProps) {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [asunto, setAsunto] = useState("");
  const [primerMensaje, setPrimerMensaje] = useState("");

  const { data: students } = useFirestoreCollection("students", {
    constraints: user?.role === 'docente' && user?.teacherId
      ? []
      : [],
    enableCache: true
  });

  const { data: courses } = useFirestoreCollection("courses", {
    constraints: user?.role === 'docente' && user?.teacherId
      ? [where('teacherId', '==', user.teacherId)]
      : [],
    dependencies: [user?.teacherId]
  });

  const teacherStudents = students?.filter(s => {
    const teacherCourseIds = courses?.map(c => c.firestoreId) || [];
    return teacherCourseIds.includes(s.cursoId);
  });

  const { data: users } = useFirestoreCollection("users", {
    constraints: [where('role', '==', 'familiar')],
    enableCache: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !asunto.trim() || !primerMensaje.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const student = students?.find(s => s.firestoreId === studentId);
    
    if (!student) {
      toast.error("No se encontró el estudiante seleccionado");
      return;
    }

    const familiar = users?.find(u => u.studentId === studentId);
    
    const familyId = familiar?.uid || 'demo-parent-1';

    setLoading(true);

    try {
      const conversacionRef = await addDoc(collection(db, "conversaciones_familias"), {
        teacherId: user?.teacherId || '',
        familyId: familyId,
        studentId: studentId,
        asunto: asunto.trim(),
        ultimoMensaje: primerMensaje.trim(),
        fecha: new Date().toISOString(),
        leido: false,
        status: 'abierta',
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "mensajes_familias"), {
        conversacionId: conversacionRef.id,
        senderId: user?.uid || '',
        senderRole: user?.role || 'docente',
        text: primerMensaje.trim(),
        createdAt: new Date().toISOString(),
        readBy: []
      });

      if (!familiar) {
        toast.success("Conversación iniciada (usando familiar demo)");
      } else {
        toast.success("Conversación iniciada exitosamente");
      }
      
      setOpen(false);
      setStudentId("");
      setAsunto("");
      setPrimerMensaje("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Error al crear la conversación");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'docente') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Conversación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Iniciar Conversación con Familia</DialogTitle>
          <DialogDescription>
            Selecciona un estudiante y escribe tu mensaje
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Estudiante *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estudiante" />
              </SelectTrigger>
              <SelectContent>
                {teacherStudents?.filter(student => student.firestoreId).map(student => (
                  <SelectItem key={student.firestoreId} value={student.firestoreId!}>
                    {student.nombre} {student.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asunto">Asunto *</Label>
            <Input
              id="asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: Reunión sobre rendimiento académico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje *</Label>
            <Textarea
              id="mensaje"
              value={primerMensaje}
              onChange={(e) => setPrimerMensaje(e.target.value)}
              placeholder="Escribe tu mensaje inicial..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Iniciar Conversación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

