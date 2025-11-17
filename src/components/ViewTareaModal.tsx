import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, BookOpen, Award, Clock } from "lucide-react";
import type { Tarea } from "@/types";
import { formatDate } from "@/utils/dateUtils";

interface ViewTareaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: Tarea;
  courseName?: string;
  subjectName?: string;
}

export function ViewTareaModal({ open, onOpenChange, tarea, courseName, subjectName }: ViewTareaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{tarea.title}</DialogTitle>
          <DialogDescription>
            Detalles completos de la tarea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2">
            <Badge variant={tarea.status === 'active' ? 'default' : 'secondary'}>
              {tarea.status === 'active' ? 'Activa' : 'Cerrada'}
            </Badge>
            {tarea.points && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {tarea.points} puntos
              </Badge>
            )}
          </div>

          {tarea.description && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Descripción</h4>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{tarea.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Fecha de Entrega</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">{formatDate(tarea.dueDate)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Creada</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">{formatDate(tarea.createdAt)}</p>
            </div>

            {courseName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Curso</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{courseName}</p>
              </div>
            )}

            {subjectName && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Materia</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{subjectName}</p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span className="font-medium">Estudiantes</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">{tarea.studentIds?.length || 0} asignados</p>
            </div>
          </div>

          {tarea.attachments && tarea.attachments.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Archivos Adjuntos</h4>
              <div className="space-y-2">
                {tarea.attachments.map((attachment, index) => (
                  <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                    {attachment}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

