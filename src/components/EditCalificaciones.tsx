import { User, Calendar, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function EditCalificaciones({
  formData,
  errors,
  handleGradeChange,
  handleDateChange,
  handleCommentChange,
  handleActivityChange,
  handleSubmit,
  handleCancel,
}: {
  formData: any,
  errors: { [key: string]: string | null },
  handleGradeChange: (value: string) => void,
  handleDateChange: (value: string) => void,
  handleCommentChange: (value: string) => void,
  handleActivityChange: (value: string) => void,
  handleSubmit: () => void,
  handleCancel: () => void,
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Estudiante */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-5 w-5 text-gray-600" />
            <Label className="text-sm font-medium text-gray-700">Estudiante</Label>
          </div>
          <Input 
            value={formData.student}
            disabled
            className="bg-white font-medium"
          />
        </div>

        {/* Actividad */}
        <div className="space-y-2">
          <Label htmlFor="activity" className="text-sm font-medium">Tipo de Evaluación</Label>
          <Input
            value={formData.activity}
            onChange={(e) => handleActivityChange(e.target.value)}
            placeholder="Actividad"
          ></Input>
        </div>

        {/* Calificación y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-medium">
              Calificación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className={errors.grade ? 'border-red-500' : ''}
              placeholder="0.0 - 10.0"
            />
            {errors.grade && (
              <p className="text-sm text-red-600">{errors.grade}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Label htmlFor="date" className="text-sm font-medium">Fecha de Evaluación</Label>
            </div>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date}</p>
            )}
          </div>
        </div>

        {/* Comentarios */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            Comentarios y Observaciones
          </Label>
          <Textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Agrega comentarios sobre el desempeño del estudiante..."
            className={`resize-none w-full ${errors.comment ? 'border-red-500' : ''}`}
            rows={4}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{errors.comment || 'Comentarios opcionales para el estudiante'}</span>
            <span>{formData.comment.length}/500</span>
          </div>
        </div>


        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            type="button" 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={Object.values(errors).some(error => error !== null)}
            onClick={handleSubmit}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
