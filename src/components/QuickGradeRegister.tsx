import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useContext, useState, useMemo, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Save, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  AlertTriangle,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

type Student = {
  firestoreId: string;
  nombre: string;
  apellido: string;
  cursoId: string;
};

type Subject = {
  firestoreId: string;
  nombre: string;
  teacherId: string;
  cursoId: string | string[];
};

type Grade = {
  firestoreId: string;
  studentId: string;
  subjectId: string;
  subject: string;
  valor: number;
  tipo: string;
  fecha: string;
  comentario?: string;
  createdAt?: any;
};

export default function QuickGradeRegister() {
  const { user } = useContext(AuthContext);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [gradeType, setGradeType] = useState("parcial");
  const [grades, setGrades] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Obtener datos
  const { data: courses } = useFirestoreCollection("courses");
  const { data: students } = useFirestoreCollection<Student>("students");
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");
  const { data: existingGrades } = useFirestoreCollection<Grade>("calificaciones");

  // Filtrar materias del docente
  const teacherSubjects = useMemo(() => 
    subjects?.filter(s => s.teacherId === (user?.teacherId || '')) || [], 
    [subjects, user?.teacherId]
  );

  // Auto-seleccionar materia si el docente tiene una sola
  useEffect(() => {
    if (teacherSubjects.length === 1 && !selectedSubject) {
      setSelectedSubject(teacherSubjects[0].nombre);
    } else if (teacherSubjects.length > 1 && !selectedSubject) {
      // Pre-seleccionar la primera materia si tiene múltiples
      setSelectedSubject(teacherSubjects[0].nombre);
    }
  }, [teacherSubjects, selectedSubject]);

  // Obtener cursos del docente
  const teacherCourses = useMemo(() => {
    if (!courses || !teacherSubjects.length) return [];
    
    const courseIds = new Set<string>();
    teacherSubjects.forEach(s => {
      if (Array.isArray(s.cursoId)) {
        s.cursoId.forEach(id => courseIds.add(id));
      } else {
        courseIds.add(s.cursoId);
      }
    });
    
    return courses.filter(c => courseIds.has(c?.firestoreId || ''));
  }, [courses, teacherSubjects]);

  // Obtener estudiantes de los cursos del docente
  const courseStudents = useMemo(() => {
    if (!students || !teacherCourses.length) return [];
    
    const courseIds = teacherCourses.map(c => c.firestoreId);
    return students.filter(s => courseIds.includes(s.cursoId));
  }, [students, teacherCourses]);

  // Filtrar estudiantes por materia seleccionada
  const subjectStudents = useMemo(() => {
      if (!selectedSubject || !courseStudents.length) return [];
      const subject = teacherSubjects.find(s => s.nombre === selectedSubject);
      if (!subject) return [];
      
      return courseStudents.filter(s => {
        if (Array.isArray(subject.cursoId)) {
          return subject.cursoId.includes(s.cursoId);
        }
        return s.cursoId === subject.cursoId;
      });
    }, [selectedSubject, courseStudents, teacherSubjects]);
    
  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalStudents = subjectStudents.length;
    const gradesEntered = Object.keys(grades).length;
    const averageGrade = gradesEntered > 0 
      ? Object.values(grades).reduce((sum, grade) => sum + grade, 0) / gradesEntered 
      : 0;
    const passingGrades = Object.values(grades).filter(grade => grade >= 7).length;
    const failingGrades = gradesEntered - passingGrades;

    return {
      totalStudents,
      gradesEntered,
      averageGrade: averageGrade.toFixed(2),
      passingGrades,
      failingGrades,
      completionPercentage: totalStudents > 0 ? Math.round((gradesEntered / totalStudents) * 100) : 0
    };
  }, [subjectStudents, grades]);

  // Función para manejar cambio de calificación
  const handleGradeChange = (studentId: string, value: string) => {
    const grade = parseFloat(value);
    if (isNaN(grade) || grade < 0 || grade > 10) return;
    
    setGrades(prev => ({
      ...prev,
      [studentId]: grade
    }));
  };

  // Función para marcar todas las calificaciones
  const markAllGrades = (grade: number) => {
    const newGrades: {[key: string]: number} = {};
    subjectStudents.forEach(student => {
      newGrades[student.firestoreId] = grade;
    });
    setGrades(newGrades);
  };

  // Función para limpiar todas las calificaciones
  const clearAllGrades = () => {
    setGrades({});
  };

  // Función para guardar calificaciones

  const saveGrades = async () => {
    if (!selectedSubject || Object.keys(grades).length === 0) {
      setMessage({ type: 'error', text: 'Selecciona una materia y ingresa al menos una calificación' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const subject = teacherSubjects.find(s => s.nombre === selectedSubject);
      if (!subject) throw new Error('Materia no encontrada');

      const gradePromises = Object.entries(grades).map(([studentId, valor]) => {
        const gradeData = {
          studentId,
          subjectId: subject.firestoreId,
          subject: selectedSubject,
          valor,
          tipo: gradeType,
          fecha: selectedDate,
          comentario: `Registro rápido - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          createdAt: serverTimestamp(),
          createdBy: user?.uid,
          createdByRole: user?.role
        };

        return addDoc(collection(db, "calificaciones"), gradeData);
      });

      await Promise.all(gradePromises);
      
      setMessage({ type: 'success', text: `${Object.keys(grades).length} calificaciones guardadas exitosamente` });
      setGrades({});
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving grades:', error);
      setMessage({ type: 'error', text: 'Error al guardar las calificaciones. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si ya existen calificaciones para esta fecha y materia
  const existingGradesForDate = useMemo(() => {
    if (!selectedSubject || !selectedDate || !existingGrades) return [];
    
    const subject = teacherSubjects.find(s => s.nombre === selectedSubject);
    if (!subject) return [];
    
    return existingGrades.filter(g => 
      g.subjectId === subject.firestoreId && 
      g.fecha === selectedDate &&
      g.tipo === gradeType
    );
  }, [selectedSubject, selectedDate, gradeType, existingGrades, teacherSubjects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            Registro Rápido de Calificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Solo mostrar selector de materia si el docente tiene múltiples materias */}
            {teacherSubjects.length > 1 ? (
              <div>
                <Label htmlFor="subject">Materia</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherSubjects.map(subject => (
                      <SelectItem key={subject.firestoreId} value={subject.nombre}>
                        {subject.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="subject">Materia</Label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {teacherSubjects[0]?.nombre || "Sin materia asignada"}
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Fecha</Label>
              <Input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo de Evaluación</Label>
              <Select value={gradeType} onValueChange={setGradeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="trabajo">Trabajo Práctico</SelectItem>
                  <SelectItem value="examen">Examen</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerta si ya existen calificaciones */}
          {existingGradesForDate.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Ya existen calificaciones para esta fecha
                  </p>
                  <p className="text-sm text-yellow-700">
                    Se encontraron {existingGradesForDate.length} calificaciones para {selectedSubject} el {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es })}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Estudiantes</p>
                  <p className="text-xl font-bold text-blue-900">{stats.totalStudents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Registradas</p>
                  <p className="text-xl font-bold text-green-900">{stats.gradesEntered}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600">Promedio</p>
                  <p className="text-xl font-bold text-indigo-900">{stats.averageGrade}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Aprobados</p>
                  <p className="text-xl font-bold text-purple-900">{stats.passingGrades}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Desaprobados</p>
                  <p className="text-xl font-bold text-red-900">{stats.failingGrades}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles masivos */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllGrades(10)}
              disabled={subjectStudents.length === 0}
            >
              Marcar todos 10
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllGrades(7)}
              disabled={subjectStudents.length === 0}
            >
              Marcar todos 7
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllGrades(5)}
              disabled={subjectStudents.length === 0}
            >
              Marcar todos 5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllGrades}
              disabled={Object.keys(grades).length === 0}
            >
              Limpiar todo
            </Button>
          </div>

          {/* Lista de estudiantes */}
          {selectedSubject && subjectStudents.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Estudiantes - {selectedSubject} ({stats.completionPercentage}% completado)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectStudents.map(student => {
                  const existingGrade = existingGradesForDate.find(g => g.studentId === student.firestoreId);
                  const currentGrade = grades[student.firestoreId];
                  
                  return (
                    <div
                      key={student.firestoreId}
                      className={`p-4 rounded-lg border transition-colors ${
                        existingGrade 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : currentGrade 
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.nombre} {student.apellido}
                          </p>
                          {existingGrade && (
                            <Badge variant="outline" className="text-xs">
                              Ya registrada: {existingGrade.valor}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="0-10"
                          value={currentGrade || ''}
                          onChange={(e) => handleGradeChange(student.firestoreId, e.target.value)}
                          className="w-20"
                          disabled={!!existingGrade}
                        />
                        <span className="text-sm text-gray-500">/ 10</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedSubject ? (
            <div className="text-center py-8 text-gray-500">
              No hay estudiantes en esta materia.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Selecciona una materia para comenzar a registrar calificaciones.
            </div>
          )}

          {/* Mensaje de estado */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Botón de guardar */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={saveGrades}
              disabled={loading || Object.keys(grades).length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Calificaciones ({Object.keys(grades).length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 