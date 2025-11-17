import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface Reunion {
  firestoreId: string;
  motivo: string;
}

interface DeleteReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunion: Reunion;
  onSuccess?: () => void;
}

export function DeleteReunionModal({ open, onOpenChange, reunion, onSuccess }: DeleteReunionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteDoc(doc(db, "reuniones_familias", reunion.firestoreId));
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al eliminar reunión:", error);
      alert("Error al eliminar la reunión");
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
              <DialogTitle>Eliminar Reunión</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la reunión <span className="font-semibold">"{reunion.motivo}"</span>?
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
              "Eliminar Reunión"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

