import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { Tarea } from "@/types";

interface DeleteTareaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: Tarea;
  onSuccess?: () => void;
}

export function DeleteTareaModal({ open, onOpenChange, tarea, onSuccess }: DeleteTareaModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteDoc(doc(db, "tareas", tarea.firestoreId));
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      alert("Error al eliminar la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Eliminar Tarea</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la tarea <span className="font-semibold">"{tarea.title}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Esto eliminará la tarea para todos los estudiantes asignados.
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar Tarea"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

