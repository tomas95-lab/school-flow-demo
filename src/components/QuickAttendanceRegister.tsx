import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Save, RotateCcw, Clock } from "lucide-react";
import { format } from "date-fns";
import { db } from "@/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { subjectBelongsToCourse } from "@/utils/subjectUtils";

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

type Attendance = {
  firestoreId: string;
  studentId: string;
  courseId: string;
  subject: string;
  date: string;
  present: boolean;
  createdAt?: any;
};

export default function QuickAttendanceRegister({courseId}: {courseId: string}) {
  const { user } = useContext(AuthContext);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [existingAttendanceWarning, setExistingAttendanceWarning] = useState(false);

  // Obtener datos
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");
  const { data: students } = useFirestoreCollection<Student>("students");
  const { data: attendances } = useFirestoreCollection<Attendance>("attendances");

  // Verificar permisos
  const canRegisterAttendance = user?.role === "docente" || user?.role === "admin";

  // Filtrar materias del docente que corresponden al curso específico
  const teacherSubjectsForCourse = useMemo(() => 
    subjects.filter(subject => 
      subject.teacherId === user?.teacherId && 
      subjectBelongsToCourse(subject, courseId)
    ),
    [subjects, user?.teacherId, courseId]
  );

  // Filtrar estudiantes del curso seleccionado
  const teacherStudents = useMemo(() => 
    students.filter(student => student.cursoId === courseId),
    [students, courseId]
  );

  // Verificar si ya existe asistencia para la fecha y materia seleccionada
  const existingAttendanceForDate = useMemo(() => {
    if (!selectedSubject || !selectedDate || !attendances) return [];
    
    return attendances.filter(att => 
      att.subject === selectedSubject &&
      att.courseId === courseId &&
      att.date === selectedDate
    );
  }, [selectedSubject, selectedDate, courseId, attendances]);

  // Auto-seleccionar materia si el docente tiene una sola en este curso
  useEffect(() => {
    if (teacherSubjectsForCourse.length === 1 && !selectedSubject) {
      setSelectedSubject(teacherSubjectsForCourse[0].nombre);
    } else if (teacherSubjectsForCourse.length > 1 && !selectedSubject) {
      // Pre-seleccionar la primera materia si tiene múltiples
      setSelectedSubject(teacherSubjectsForCourse[0].nombre);
    }
  }, [teacherSubjectsForCourse, selectedSubject]);

  // Inicializar mapa de asistencias
  useEffect(() => {
    if (teacherStudents.length > 0) {
      const initialMap: Record<string, boolean> = {};
      teacherStudents.forEach(student => {
        initialMap[student.firestoreId] = true; // Por defecto presentes
      });
      setAttendanceMap(initialMap);
    }
  }, [teacherStudents]);

  // Verificar si ya existe asistencia
  useEffect(() => {
    setExistingAttendanceWarning(existingAttendanceForDate.length > 0);
  }, [existingAttendanceForDate]);

  const toggleAttendance = (studentId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const markAllPresent = () => {
    const newMap: Record<string, boolean> = {};
    teacherStudents.forEach(student => {
      newMap[student.firestoreId] = true;
    });
    setAttendanceMap(newMap);
  };

  const markAllAbsent = () => {
    const newMap: Record<string, boolean> = {};
    teacherStudents.forEach(student => {
      newMap[student.firestoreId] = false;
    });
    setAttendanceMap(newMap);
  };

  const resetAttendance = () => {
    const newMap: Record<string, boolean> = {};
    teacherStudents.forEach(student => {
      newMap[student.firestoreId] = true; // Reset a presentes
    });
    setAttendanceMap(newMap);
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !courseId || teacherStudents.length === 0) return;
    if (!canRegisterAttendance) return;

    setIsLoading(true);

    try {
      const batch = [];
      
      for (const student of teacherStudents) {
        const attendanceId = `${student.firestoreId}_${courseId}_${selectedSubject}_${selectedDate}`;
        const attendanceData = {
          studentId: student.firestoreId,
          courseId: courseId,
          subject: selectedSubject,
          date: selectedDate,
          present: attendanceMap[student.firestoreId] || false,
          createdAt: new Date()
        };

        // Verificar si ya existe la asistencia
        const existingAttendance = existingAttendanceForDate.find(
          att => att.studentId === student.firestoreId
        );

        if (existingAttendance) {
          // Actualizar asistencia existente
          const attendanceRef = doc(db, "attendances", existingAttendance.firestoreId);
          batch.push(updateDoc(attendanceRef, {
            present: attendanceMap[student.firestoreId] || false,
            updatedAt: new Date(),
            updatedBy: user?.uid || user?.teacherId || user?.email
          }));
        } else {
          // Crear nueva asistencia
          const attendanceRef = doc(db, "attendances", attendanceId);
          batch.push(setDoc(attendanceRef, attendanceData));
        }
      }

      await Promise.all(batch);
      
      toast.success('Asistencias guardadas', {
        description: `${teacherStudents.length} asistencias ${existingAttendanceForDate.length > 0 ? 'actualizadas' : 'guardadas'} exitosamente`
      });
    } catch (error) {
      console.error("Error al guardar asistencias:", error);
      toast.error('Error al guardar asistencias', {
        description: 'Inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const totalStudents = teacherStudents.length;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Si no tiene permisos, mostrar mensaje
  if (!canRegisterAttendance) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 text-red-500 mx-auto mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No tienes permisos para registrar asistencias
        </h3>
        <p className="text-gray-600">
          Solo los docentes y administradores pueden registrar asistencias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="flex items-end gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Materia</Label>
          {teacherSubjectsForCourse.length > 1 ? (
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {teacherSubjectsForCourse.map((subject: Subject) => (
                  <SelectItem key={subject.firestoreId} value={subject.nombre}>
                    {subject.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : teacherSubjectsForCourse.length === 1 ? (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {teacherSubjectsForCourse[0].nombre}
            </div>
          ) : (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-700">
              No tienes materias asignadas
            </div>
          )}
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700">Fecha</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={markAllPresent} variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            Todos
          </Button>
          <Button onClick={markAllAbsent} variant="outline" size="sm">
            <XCircle className="h-4 w-4 mr-1" />
            Ninguno
          </Button>
          <Button onClick={resetAttendance} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advertencia de asistencia existente */}
      {existingAttendanceWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h4 className="font-medium text-amber-800">
                Ya existe registro de asistencia para esta fecha
              </h4>
              <p className="text-sm text-amber-700">
                Se actualizarán los registros existentes al guardar
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{presentCount}</div>
            <div className="text-sm text-blue-700">Presentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{totalStudents - presentCount}</div>
            <div className="text-sm text-blue-700">Ausentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{totalStudents}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-900">{attendancePercentage}%</div>
          <div className="text-sm text-blue-700">Asistencia</div>
        </div>
      </div>

      {/* Lista de estudiantes */}
      {selectedSubject && teacherStudents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Estudiantes ({teacherStudents.length})
            </h3>
            <Button
              onClick={saveAttendance}
              disabled={isLoading || !selectedSubject || teacherSubjectsForCourse.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Guardando..." : existingAttendanceWarning ? "Actualizar Asistencias" : "Guardar Asistencias"}
            </Button>
          </div>
          
          <div className="space-y-2">
            {teacherStudents.map(student => {
              const existingAttendance = existingAttendanceForDate.find(
                att => att.studentId === student.firestoreId
              );
              
              return (
                <div
                  key={student.firestoreId}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    attendanceMap[student.firestoreId]
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  } ${existingAttendance ? 'ring-2 ring-amber-200' : ''}`}
                  onClick={() => toggleAttendance(student.firestoreId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      attendanceMap[student.firestoreId] ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.nombre} {student.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {student.firestoreId.slice(-6)}
                        {existingAttendance && (
                          <span className="ml-2 text-amber-600">
                            • Ya registrado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={attendanceMap[student.firestoreId] ? "default" : "destructive"}
                  >
                    {attendanceMap[student.firestoreId] ? "Presente" : "Ausente"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 
