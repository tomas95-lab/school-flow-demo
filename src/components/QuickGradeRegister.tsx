import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function QuickGradeRegister() {
  const { user } = useContext(AuthContext);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [gradeType, setGradeType] = useState("examen");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usar hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);

  // Auto-seleccionar curso y materia si el docente tiene una sola
  useEffect(() => {
    if (teacherCourses.length === 1 && !selectedCourse) {
      setSelectedCourse(teacherCourses[0].firestoreId);
    }
    if (teacherSubjects.length === 1 && !selectedSubject) {
      setSelectedSubject(teacherSubjects[0].nombre);
    }
  }, [teacherCourses, teacherSubjects, selectedCourse, selectedSubject]);

  // Filtrar estudiantes del curso seleccionado
  const courseStudents = teacherStudents.filter(s => s.cursoId === selectedCourse);

  if (coursesLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedSubject || !selectedStudent || !gradeValue) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 1 || grade > 10) {
      toast.error("La calificación debe estar entre 1 y 10");
      return;
    }

    setIsSubmitting(true);

    try {
      const gradeData = {
        studentId: selectedStudent,
        subjectId: teacherSubjects.find(s => s.nombre === selectedSubject)?.firestoreId,
        subject: selectedSubject,
        courseId: selectedCourse,
        valor: grade,
        tipo: gradeType,
        fecha: new Date().toISOString().split('T')[0],
        comentario: comment || "",
        createdAt: serverTimestamp(),
        teacherId: user?.teacherId
      };

      await addDoc(collection(db, "calificaciones"), gradeData);
      
      toast.success("Calificación registrada exitosamente");
      
      // Limpiar formulario
      setSelectedStudent("");
      setGradeValue("");
      setGradeType("examen");
      setComment("");
      
    } catch (error) {
      console.error("Error al registrar calificación:", error);
      toast.error("Error al registrar la calificación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return "text-green-600";
    if (grade >= 7) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeIcon = (grade: number) => {
    if (grade >= 7) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registro Rápido de Calificaciones</h2>
        <p className="text-gray-600">Registra calificaciones de forma rápida y eficiente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Calificación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Curso */}
            <div>
              <Label htmlFor="course">Curso *</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {teacherCourses.map((course) => (
                    <SelectItem key={course.firestoreId} value={course.firestoreId}>
                      {course.nombre} - {course.division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Materia */}
            <div>
              <Label htmlFor="subject">Materia *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {teacherSubjects.map((subject) => (
                    <SelectItem key={subject.firestoreId} value={subject.nombre}>
                      {subject.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estudiante */}
            <div>
              <Label htmlFor="student">Estudiante *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {courseStudents.map((student) => (
                    <SelectItem key={student.firestoreId} value={student.firestoreId}>
                      {student.nombre} {student.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de evaluación */}
            <div>
              <Label htmlFor="type">Tipo de Evaluación *</Label>
              <Select value={gradeType} onValueChange={setGradeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="examen">Examen</SelectItem>
                  <SelectItem value="trabajo_practico">Trabajo Práctico</SelectItem>
                  <SelectItem value="participacion">Participación</SelectItem>
                  <SelectItem value="tarea">Tarea</SelectItem>
                  <SelectItem value="proyecto">Proyecto</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calificación */}
            <div>
              <Label htmlFor="grade">Calificación * (1-10)</Label>
              <Input
                id="grade"
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                placeholder="Ej: 8.5"
                className={gradeValue ? getGradeColor(parseFloat(gradeValue)) : ""}
              />
              {gradeValue && (
                <div className="flex items-center gap-2 mt-2">
                  {getGradeIcon(parseFloat(gradeValue))}
                  <span className="text-sm">
                    {parseFloat(gradeValue) >= 7 ? "Aprobado" : "Desaprobado"}
                  </span>
                </div>
              )}
            </div>

            {/* Comentario */}
            <div>
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Observaciones sobre la calificación..."
                rows={3}
              />
            </div>

            {/* Botón de envío */}
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedCourse || !selectedSubject || !selectedStudent || !gradeValue}
              className="w-full"
            >
              {isSubmitting ? "Registrando..." : "Registrar Calificación"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Las calificaciones se registran automáticamente con la fecha actual</p>
            <p>• El sistema valida que la calificación esté entre 1 y 10</p>
            <p>• Puedes agregar comentarios para mayor contexto</p>
            <p>• Solo se muestran los estudiantes de los cursos donde enseñas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
