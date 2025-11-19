import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Tarea {
  firestoreId: string;
  title: string;
  description?: string;
  dueDate: string;
  points?: number;
}

interface SubmitTareaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: Tarea;
  studentId: string;
  onSuccess?: () => void;
}

export function SubmitTareaModal({ open, onOpenChange, tarea, studentId, onSuccess }: SubmitTareaModalProps) {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "tarea_submissions"), {
        tareaId: tarea.firestoreId,
        studentId: studentId,
        comments: comments || "",
        submittedAt: new Date().toISOString(),
        status: "submitted",
        createdAt: new Date().toISOString()
      });

      setSubmitted(true);
      toast.success("¡Tarea entregada exitosamente!");
      
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setSubmitted(false);
        setComments("");
      }, 1500);
      
    } catch (error) {
      console.error("Error submitting tarea:", error);
      toast.error("Error al entregar la tarea");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-700">¡Tarea Entregada!</h3>
            <p className="text-sm text-gray-600 text-center">
              Tu trabajo ha sido enviado correctamente.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Entregar Tarea
          </DialogTitle>
          <DialogDescription>
            {tarea.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Fecha límite:</span>
              <span className="font-medium text-gray-900">
                {new Date(tarea.dueDate).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            {tarea.points && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Puntos:</span>
                <span className="font-medium text-gray-900">{tarea.points} pts</span>
              </div>
            )}
            {tarea.description && (
              <div className="pt-2 border-t mt-2">
                <p className="text-xs text-gray-600 mb-1">Descripción:</p>
                <p className="text-sm text-gray-700">{tarea.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios (opcional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Agrega comentarios sobre tu entrega..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Puedes agregar notas sobre tu trabajo, dificultades encontradas, o preguntas para el docente.
            </p>
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entregando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Entregar Tarea
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

