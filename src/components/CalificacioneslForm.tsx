import { Check, Users, Calendar, BookOpen, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Ajusta la ruta según tu estructura
import { Button } from "./ui/button";

// Tipos mejorados
interface FormData {
  actividad: string;
  valor: string;
  fecha: string;
  comentario: string;
}

interface CrearCalificacionProps {
  studentsInCourse: Array<any>;
  selectedStudentIds: string[];
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit?: (data: FormData, studentIds: string[]) => void;
  isLoading?: boolean;
  subjectId?:string
}

export default function CrearCalificacion({
  studentsInCourse,
  selectedStudentIds,
  setSelectedStudentIds,
  onSubmit,
  subjectId,
  isLoading = false,
}: CrearCalificacionProps) {
  const [formData, setFormData] = useState<FormData>({
    actividad: '',
    valor: '',
    fecha: '',
    comentario: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [absentStudentIds, setAbsentStudentIds] = useState<string[]>([]); // NUEVO

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
    // Si se deselecciona, también quitar de ausentes
    setAbsentStudentIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleAbsent = (id: string) => {
    setAbsentStudentIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    const allIds = studentsInCourse.map(s => s.firestoreId!);
    setSelectedStudentIds(allIds);
    // No marcar ausentes por defecto
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
    setAbsentStudentIds([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es requerida';
    }

    if (!formData.valor.trim()) {
      newErrors.valor = 'El valor es requerido';
    } else {
      const valor = parseFloat(formData.valor);
      if (isNaN(valor) || valor < 0 || valor > 10) {
        newErrors.valor = 'El valor debe estar entre 0 y 10';
      }
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (selectedStudentIds.length === 0) {
      newErrors.students = 'Debe seleccionar al menos un estudiante';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrors({});
    try {
      // Crea una calificación para cada estudiante seleccionado
      const promises = selectedStudentIds.map(studentId =>
        addDoc(collection(db, "calificaciones"), {
          studentId,
          Actividad: formData.actividad,
          valor: absentStudentIds.includes(studentId) ? null : parseFloat(formData.valor),
          ausente: absentStudentIds.includes(studentId) ? true : false,
          creadoEn: serverTimestamp(),
          Comentario: formData.comentario,
          fecha: formData.fecha,
          subjectId: subjectId
        })
      );
      await Promise.all(promises);

      // Limpia el formulario y selección
      setFormData({ actividad: '', valor: '', fecha: '', comentario: '' });
      setSelectedStudentIds([]);
      setAbsentStudentIds([]);
      if (onSubmit) onSubmit(formData, selectedStudentIds);
    } catch (err) {
      console.log(err)
      setErrors({ general: "Error al guardar la calificación. Intente nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = formData.actividad && formData.valor && formData.fecha && selectedStudentIds.length > 0;

  return (
    <div className="w-full py-6 px-6 bg-white rounded-xl border shadow-sm flex flex-col">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Nueva calificación</h2>
      </div>

      {/* Sección de estudiantes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-700">Estudiantes</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {selectedStudentIds.length} seleccionado{selectedStudentIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllStudents}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Todos
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={deselectAllStudents}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
            >
              Ninguno
            </button>
          </div>
        </div>

        {errors.students && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.students}
          </div>
        )}
        <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
          <Input
            type="search"
            placeholder="Buscar estudiantes..."
            className="mb-3"
            value={studentSearchTerm}
            onChange={(e) => setStudentSearchTerm(e.target.value)}
            aria-label="Buscar estudiantes"
          />
          <div className="max-h-50 overflow-y-auto space-y-2 ">
            {studentsInCourse
              .filter((student) => {
                const search = studentSearchTerm.trim().toLowerCase();
                if (!search) return true;
                const nombre = student.nombre?.toLowerCase() || "";
                const apellido = student.apellido?.toLowerCase() || "";
                return (
                  nombre.includes(search) ||
                  apellido.includes(search) ||
                  `${nombre} ${apellido}`.includes(search)
                );
              })
              .map((student) => {
                const selected = selectedStudentIds.includes(student.firestoreId!);
                const absent = absentStudentIds.includes(student.firestoreId!);
                return (
                  <div key={student.firestoreId} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStudent(student.firestoreId!)}
                      aria-pressed={selected}
                      aria-label={`${selected ? 'Deseleccionar' : 'Seleccionar'} ${student.nombre} ${student.apellido}`}
                      className={`
                        w-full flex items-center justify-between p-3 border-2 rounded-lg
                        transition-all duration-200 hover:shadow-sm cursor-pointer
                        ${selected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}
                      `}
                    >
                      <span className="font-medium text-gray-900">
                        {student.nombre} {student.apellido}
                      </span>
                      <div className={`w-6 h-6 rounded-full ${selected ? "bg-blue-500" : "bg-white border-2 border-gray-500"} flex items-center justify-center`}>
                        <Check className={`w-4 h-4 ${selected ? "text-white" : "hidden"}`} />
                      </div>
                    </button>
                    {selected && (
                      <button
                        type="button"
                        onClick={() => toggleAbsent(student.firestoreId!)}
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium border transition
                          ${absent ? "bg-yellow-400 text-white border-yellow-500" : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-yellow-100"}
                        `}
                        aria-pressed={absent}
                        aria-label={absent ? "Quitar ausencia" : "Marcar como ausente"}
                      >
                        {absent ? "Ausente" : "Marcar ausente"}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Actividad */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Actividad *
            </label>
            <Input
              className={`w-full ${errors.actividad ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Ej: Parcial 1"
              value={formData.actividad}
              onChange={(e) => handleInputChange('actividad', e.target.value)}
            />
            {errors.actividad && (
              <span className="mt-1 text-sm text-red-600">{errors.actividad}</span>
            )}
          </div>

          {/* Valor */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Valor (0-10) *
            </label>
            <Input
              className={`w-full ${errors.valor ? 'border-red-500 focus:ring-red-500' : ''}`}
              type="number"
              placeholder="0-10"
              min="0"
              max="10"
              step="0.1"
              value={formData.valor}
              onChange={(e) => handleInputChange('valor', e.target.value)}
            />
            {errors.valor && (
              <span className="mt-1 text-sm text-red-600">{errors.valor}</span>
            )}
          </div>

          {/* Fecha */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha *
            </label>
            <Input
              className={`w-full ${errors.fecha ? 'border-red-500 focus:ring-red-500' : ''}`}
              type="date"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
            />
            {errors.fecha && (
              <span className="mt-1 text-sm text-red-600">{errors.fecha}</span>
            )}
          </div>

          {/* Comentario */}
          <div className="flex flex-col md:col-span-2 lg:col-span-3">
            <label className="mb-2 font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentario
            </label>
            <Textarea
              className="w-full resize-none"
              rows={3}
              placeholder="Observaciones opcionales sobre la evaluación..."
              value={formData.comentario}
              onChange={(e) => handleInputChange('comentario', e.target.value)}
            />
          </div>
        </div>

        {/* Mensaje de error general */}
        {errors.general && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.general}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant={"outline"}
            onClick={() => {
              setFormData({ actividad: '', valor: '', fecha: '', comentario: '' });
              setSelectedStudentIds([]);
              setErrors({});
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || isLoading || saving}
          >
            {saving ? 'Guardando...' : (isLoading ? 'Guardando...' : 'Crear Calificación')}
          </Button>
        </div>
      </form>
    </div>
  );
}