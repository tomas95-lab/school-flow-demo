import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useTeacherSubjectsInCourse } from "@/hooks/useTeacherCourses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { Users, BookOpen, Award, Check } from "lucide-react";

type Student = {
  firestoreId: string;
  nombre: string;
  apellido: string;
};

interface InlineGradeFormProps {
  courseId: string;
  students: Student[];
}

export default function InlineGradeForm({ courseId, students }: InlineGradeFormProps) {
  const { user } = useContext(AuthContext);

  const subjectsInCourse = useTeacherSubjectsInCourse(user?.teacherId, courseId);

  const [subjectId, setSubjectId] = useState<string>("");
  const [activity, setActivity] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Auto seleccionar materia si hay una sola
  useEffect(() => {
    if (subjectsInCourse.length === 1) {
      setSubjectId(subjectsInCourse[0].firestoreId || "");
    }
  }, [subjectsInCourse]);

  const filteredStudents = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      (s.nombre || "").toLowerCase().includes(q) ||
      (s.apellido || "").toLowerCase().includes(q) ||
      `${s.nombre} ${s.apellido}`.toLowerCase().includes(q)
    );
  }, [students, filter]);

  const isValid = useMemo(() => {
    return Boolean(
      courseId && subjectId && activity.trim() && date && gradeValue > 0 && gradeValue <= 10 && selectedStudentIds.length > 0
    );
  }, [courseId, subjectId, activity, date, gradeValue, selectedStudentIds.length]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedStudentIds(filteredStudents.map(s => s.firestoreId));
  const clearAll = () => setSelectedStudentIds([]);
  const invert = () => {
    const set = new Set(selectedStudentIds);
    setSelectedStudentIds(filteredStudents.map(s => s.firestoreId).filter(id => !set.has(id)));
  };

  const quickSet = (v: number) => setGradeValue(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const payloads = selectedStudentIds.map(studentId => ({
        studentId,
        subjectId,
        courseId,
        Actividad: activity,
        Comentario: comment,
        valor: gradeValue,
        fecha: date,
        createdAt: serverTimestamp(),
        teacherId: user?.teacherId,
      }));

      await Promise.all(payloads.map(data => addDoc(collection(db, "calificaciones"), data)));

      toast.success("Calificaciones registradas");
      // Mantener curso/materia; limpiar resto
      setActivity("");
      setGradeValue(0);
      setComment("");
      setSelectedStudentIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          Registrar calificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Materia / Actividad / Fecha / Nota */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Materia *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjectsInCourse.map(s => (
                    <SelectItem key={s.firestoreId} value={s.firestoreId || ""}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Actividad *</Label>
              <Input value={activity} onChange={e => setActivity(e.target.value)} placeholder="Ej: Parcial 1" className="h-10" />
            </div>
            <div className="space-y-1">
              <Label>Fecha *</Label>
              <Input type="date" value={date} max={new Date().toISOString().split("T")[0]} onChange={e => setDate(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label>Calificación (1–10) *</Label>
              <Input type="number" min={1} max={10} step="0.1" value={gradeValue || ""} onChange={e => setGradeValue(parseFloat(e.target.value) || 0)} className="h-10" />
              <div className="flex gap-2 pt-1">
                {[10, 9, 8, 7].map(v => (
                  <Button key={v} type="button" variant="outline" size="sm" onClick={() => quickSet(v)}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-1">
            <Label>Comentario</Label>
            <Textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Opcional" className="resize-none" />
          </div>

          {/* Estudiantes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Estudiantes del curso</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{selectedStudentIds.length} seleccionados</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>Todos</Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAll}>Ninguno</Button>
                <Button type="button" variant="outline" size="sm" onClick={invert}>Invertir</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-600" />
                  <Input placeholder="Buscar estudiante" value={filter} onChange={e => setFilter(e.target.value)} className="h-9" />
                </div>
                <div className="max-h-72 overflow-auto rounded-lg border bg-white">
                  <ul className="divide-y">
                    {filteredStudents.map(s => {
                      const selected = selectedStudentIds.includes(s.firestoreId);
                      return (
                        <li key={s.firestoreId}>
                          <button type="button" onClick={() => toggleStudent(s.firestoreId)} className={`w-full flex items-center justify-between px-3 py-2 text-left ${selected ? 'bg-blue-50' : ''}`}>
                            <span className="text-sm text-gray-900">{s.nombre} {s.apellido}</span>
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              <Check className={`h-3 w-3 ${selected ? 'text-white' : 'text-transparent'}`} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              {/* Resumen */}
              <div className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm text-gray-600 mb-2">Resumen</div>
                <div className="text-sm text-gray-800">{selectedStudentIds.length} estudiantes recibirán la nota {gradeValue || '—'} en {activity || '—'} ({date}).</div>
                <div className="text-xs text-gray-500 mt-1">Materia: {subjectsInCourse.find(s => s.firestoreId === subjectId)?.nombre || '—'}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isValid || isSubmitting} className="h-11 px-6">
              {isSubmitting ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


