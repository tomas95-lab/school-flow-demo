import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface Reunion {
  firestoreId: string;
  teacherId: string;
  familyId: string;
  studentId: string;
  date: string;
  status: string;
  motivo: string;
  notas?: string;
  duracion?: number;
  modalidad?: string;
}

interface EditReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunion: Reunion;
  onSuccess?: () => void;
}

export function EditReunionModal({ open, onOpenChange, reunion, onSuccess }: EditReunionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: reunion.date.split('T')[0],
    motivo: reunion.motivo,
    notas: reunion.notas || "",
    status: reunion.status,
    duracion: reunion.duracion || 30,
    modalidad: reunion.modalidad || "presencial",
  });

  useEffect(() => {
    setFormData({
      date: reunion.date.split('T')[0],
      motivo: reunion.motivo,
      notas: reunion.notas || "",
      status: reunion.status,
      duracion: reunion.duracion || 30,
      modalidad: reunion.modalidad || "presencial",
    });
  }, [reunion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reunionRef = doc(db, "reuniones_familias", reunion.firestoreId);
      await updateDoc(reunionRef, {
        date: new Date(formData.date).toISOString(),
        motivo: formData.motivo,
        notas: formData.notas,
        status: formData.status,
        duracion: formData.duracion,
        modalidad: formData.modalidad,
        updatedAt: new Date().toISOString(),
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar reunión:", error);
      alert("Error al actualizar la reunión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Reunión</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la reunión
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (min)</Label>
                <Input
                  id="duracion"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modalidad">Modalidad</Label>
                <Select value={formData.modalidad} onValueChange={(value) => setFormData({ ...formData, modalidad: value })}>
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
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="realizada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={4}
                placeholder="Notas o comentarios sobre la reunión..."
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

