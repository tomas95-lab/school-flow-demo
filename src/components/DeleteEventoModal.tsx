import { useState } from "react";
import { db } from "@/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteEventoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  eventoId: string | null;
  eventoTitle?: string;
}

export default function DeleteEventoModal({ open, onOpenChange, onSuccess, eventoId, eventoTitle }: DeleteEventoModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!eventoId) {
      toast.error("No se encontró el ID del evento");
      return;
    }

    setLoading(true);

    try {
      const eventoRef = doc(db, "eventos_escolares", eventoId);
      await deleteDoc(eventoRef);

      toast.success("Evento eliminado exitosamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting evento:", error);
      toast.error("Error al eliminar el evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Eliminar Evento</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción no se puede deshacer. El evento será eliminado permanentemente del calendario.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700">
            ¿Estás seguro que deseas eliminar el evento <span className="font-semibold">"{eventoTitle}"</span>?
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
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
