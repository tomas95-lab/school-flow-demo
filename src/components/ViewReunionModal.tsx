import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, Video, MapPin } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

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

interface ViewReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunion: Reunion;
  teacherName?: string;
  studentName?: string;
}

export function ViewReunionModal({ open, onOpenChange, reunion, teacherName, studentName }: ViewReunionModalProps) {
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      programada: 'Programada',
      realizada: 'Completada',
      cancelada: 'Cancelada'
    };
    return map[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === 'completed' || status === 'realizada') return 'secondary';
    if (status === 'cancelled' || status === 'cancelada') return 'destructive';
    return 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles de la Reunión</DialogTitle>
          <DialogDescription>
            Información completa de la reunión
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(reunion.status)}>
              {getStatusLabel(reunion.status)}
            </Badge>
            {reunion.modalidad && (
              <Badge variant="outline" className="flex items-center gap-1">
                {reunion.modalidad === 'virtual' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {reunion.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
              </Badge>
            )}
            {reunion.duracion && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {reunion.duracion} min
              </Badge>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Motivo</h4>
            <p className="text-gray-900">{reunion.motivo}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Fecha</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">{formatDate(reunion.date)}</p>
            </div>

            {teacherName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Docente</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{teacherName}</p>
              </div>
            )}

            {studentName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Estudiante</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{studentName}</p>
              </div>
            )}
          </div>

          {reunion.notas && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Notas</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                {reunion.notas}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

