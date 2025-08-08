import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { useTeacherCourses, useTeacherStudents, useTeacherSubjectsInCourse } from "@/hooks/useTeacherCourses";
import { useContext, useState, useEffect, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { CheckCircle, XCircle, BookOpen, Users, FileText, Award } from "lucide-react";
import { LoadingState } from "./LoadingState";

// Tipos TypeScript
interface GradeFormData {
  courseId: string;
  subjectId: string;
  studentId: string;
  activityName: string;
  gradeValue: number;
  date: string; // yyyy-mm-dd
  comment: string;
}

interface GradeValidation {
  isValid: boolean;
  message: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
}

// Tipos de evaluación (sin emojis)
// const GRADE_TYPES = [
//   { value: "examen", label: "Examen" },
//   { value: "trabajo_practico", label: "Trabajo Práctico" },
//   { value: "participacion", label: "Participación" },
//   { value: "tarea", label: "Tarea" },
//   { value: "proyecto", label: "Proyecto" },
//   { value: "otro", label: "Otro" }
// ] as const;

export default function QuickGradeRegister() {
  const { user } = useContext(AuthContext);
  
  // Estado del formulario
  const [formData, setFormData] = useState<GradeFormData>({
    courseId: "",
    subjectId: "",
    studentId: "",
    activityName: "",
    gradeValue: 0,
    date: new Date().toISOString().split('T')[0],
    comment: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks estandarizados
  const { teacherCourses, /* teacherSubjects,*/ isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);
  const subjectsInSelectedCourse = useTeacherSubjectsInCourse(user?.teacherId, formData.courseId);

  // Fallback directo por curso seleccionado (robustez ante datos legacy)
  const { data: studentsByCourse } = useFirestoreCollection<any>("students", {
    constraints: formData.courseId ? [where('cursoId', '==', formData.courseId)] : [],
    enableCache: true,
    dependencies: [formData.courseId]
  });

  const { data: studentsByCourseAlt } = useFirestoreCollection<any>("students", {
    constraints: formData.courseId ? [where('courseId', '==', formData.courseId)] : [],
    enableCache: true,
    dependencies: [formData.courseId]
  });

  // Auto-seleccionar curso y materia si el docente tiene una sola
  useEffect(() => {
    if (teacherCourses.length === 1 && !formData.courseId) {
      setFormData(prev => ({ ...prev, courseId: teacherCourses[0].firestoreId }));
    }
  }, [teacherCourses, formData.courseId]);

  // Cuando cambia el curso, limpiar materia/estudiante y auto-seleccionar materia si hay una sola
  useEffect(() => {
    setFormData(prev => ({ ...prev, subjectId: "", studentId: "" }));
    if (subjectsInSelectedCourse.length === 1) {
      setFormData(prev => ({ ...prev, subjectId: subjectsInSelectedCourse[0].firestoreId || "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.courseId]);

  // Filtrar estudiantes del curso seleccionado
  const courseStudents = useMemo(() => {
    const byCurso = (studentsByCourse || []) as Array<any>;
    const byCourse = (studentsByCourseAlt || []) as Array<any>;
    const mergedMap = new Map<string, any>();
    [...byCurso, ...byCourse].forEach(s => {
      if (s?.firestoreId) mergedMap.set(s.firestoreId, s);
    });
    const merged = Array.from(mergedMap.values());

    if (formData.courseId && merged.length > 0) {
      return merged;
    }

    // Filtro local sobre la lista de estudiantes del docente
    return teacherStudents.filter((s: any) => {
      const cid = (s.cursoId || s.courseId || "").toString().trim();
      return cid === formData.courseId;
    });
  }, [teacherStudents, studentsByCourse, studentsByCourseAlt, formData.courseId]);

  // Validar calificación
  const gradeValidation = useMemo((): GradeValidation => {
    const grade = formData.gradeValue;
    
    if (grade === 0) {
      return {
        isValid: false,
        message: "",
        color: "",
        icon: null,
        bgColor: ""
      };
    }
    
    if (grade < 1 || grade > 10) {
      return {
        isValid: false,
        message: "La calificación debe estar entre 1 y 10",
        color: "text-red-600",
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        bgColor: "bg-red-50"
      };
    }
    
    if (grade >= 9) {
      return {
        isValid: true,
        message: "Excelente",
        color: "text-emerald-600",
        icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
        bgColor: "bg-emerald-50"
      };
    }
    
    if (grade >= 8) {
      return {
        isValid: true,
        message: "Muy Bueno",
        color: "text-green-600",
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        bgColor: "bg-green-50"
      };
    }
    
    if (grade >= 7) {
      return {
        isValid: true,
        message: "Bueno",
        color: "text-yellow-600",
        icon: <CheckCircle className="h-4 w-4 text-yellow-600" />,
        bgColor: "bg-yellow-50"
      };
    }
    
    return {
      isValid: true,
      message: "Necesita Mejora",
      color: "text-red-600",
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      bgColor: "bg-red-50"
    };
  }, [formData.gradeValue]);

  // Validar formulario completo
  const isFormValid = useMemo(() => {
    return Boolean(
      formData.courseId &&
      formData.subjectId &&
      formData.studentId &&
      formData.activityName.trim() &&
      formData.date &&
      formData.gradeValue > 0 &&
      formData.gradeValue <= 10
    );
  }, [formData]);

  // Estados de carga
  if (coursesLoading || studentsLoading) {
    return (
      <LoadingState 
        text="Cargando formulario..."
        timeout={8000}
        timeoutMessage="La carga está tomando más tiempo del esperado. Verifica tu conexión."
      />
    );
  }

  // Estado vacío si no hay cursos
  if (!teacherCourses.length) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-blue-100 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes cursos asignados
          </h3>
          <p className="text-gray-600">
            Contacta al administrador para que te asigne cursos antes de registrar calificaciones.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error("Por favor completa todos los campos obligatorios correctamente");
      return;
    }

    setIsSubmitting(true);

    try {
      const gradeData = {
        studentId: formData.studentId,
        subjectId: formData.subjectId,
        courseId: formData.courseId,
        Actividad: formData.activityName,
        Comentario: formData.comment,
        valor: formData.gradeValue,
        fecha: formData.date,
        createdAt: serverTimestamp(),
        teacherId: user?.teacherId
      };

      await addDoc(collection(db, "calificaciones"), gradeData);
      
      toast.success("Calificación registrada exitosamente");
      
      // Limpiar formulario (mantener curso y materia)
      setFormData({
        courseId: formData.courseId,
        subjectId: formData.subjectId,
        studentId: "",
        activityName: "",
        gradeValue: 0,
        date: new Date().toISOString().split('T')[0],
        comment: ""
      });
      
    } catch (error) {
      console.error("Error al registrar calificación:", error);
      toast.error("Error al registrar la calificación. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof GradeFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Registro Rápido de Calificaciones</h2>
            <p className="text-gray-600">Registra calificaciones de forma rápida y eficiente</p>
          </div>
        </div>
      </div>

      {/* Formulario principal */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Award className="h-6 w-6 text-blue-600" />
            Nueva Calificación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primera fila: Curso y Materia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Curso */}
              <div className="space-y-2">
                <Label htmlFor="course" className="text-sm font-semibold text-gray-700">
                  Curso *
                </Label>
                <Select 
                  value={formData.courseId} 
                  onValueChange={(value) => updateFormData('courseId', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherCourses.map((course) => (
                      <SelectItem key={course.firestoreId} value={course.firestoreId}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          {course.nombre} - {course.division}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Materia */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                  Materia *
                </Label>
                <Select 
                  value={formData.subjectId}
                  onValueChange={(value) => updateFormData('subjectId', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsInSelectedCourse.map((subject) => (
                      <SelectItem key={subject.firestoreId} value={subject.firestoreId || ""}>
                        {subject.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda fila: Estudiante y Actividad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Estudiante */}
              <div className="space-y-2">
                <Label htmlFor="student" className="text-sm font-semibold text-gray-700">
                  Estudiante *
                </Label>
                <Select 
                  value={formData.studentId} 
                  onValueChange={(value) => updateFormData('studentId', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseStudents.map((student) => (
                      <SelectItem key={student.firestoreId || ""} value={student.firestoreId || ""}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          {student.nombre} {student.apellido}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Actividad */}
              <div className="space-y-2">
                <Label htmlFor="activity" className="text-sm font-semibold text-gray-700">
                  Actividad *
                </Label>
                <Input
                  id="activity"
                  value={formData.activityName}
                  onChange={(e) => updateFormData('activityName', e.target.value)}
                  placeholder="Ej: Parcial 1"
                  className="h-12"
                />
              </div>
            </div>

            {/* Calificación con feedback visual mejorado */}
            <div className="space-y-3">
              <Label htmlFor="grade" className="text-sm font-semibold text-gray-700">
                Calificación * (1-10)
              </Label>
              <div className="relative">
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.gradeValue || ""}
                  onChange={(e) => updateFormData('gradeValue', parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 8.5"
                  className={`h-12 text-lg font-semibold ${gradeValidation.color} ${gradeValidation.bgColor}`}
                />
                {formData.gradeValue > 0 && (
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg ${gradeValidation.bgColor}`}>
                    {gradeValidation.icon}
                  </div>
                )}
              </div>
              {formData.gradeValue > 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${gradeValidation.bgColor} border ${gradeValidation.color.replace('text-', 'border-')}`}>
                  {gradeValidation.icon}
                                     <span className={`text-sm font-medium ${gradeValidation.color}`}>
                     {gradeValidation.message || ""}
                   </span>
                </div>
              )}
            </div>

            {/* Fecha y Comentario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                  Fecha *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-semibold text-gray-700">
                  Comentario (opcional)
                </Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => updateFormData('comment', e.target.value)}
                  placeholder="Observaciones sobre la calificación..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Botón de envío mejorado */}
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid}
              className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Registrar Calificación
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
