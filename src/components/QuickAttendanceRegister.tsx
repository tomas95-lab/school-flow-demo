import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Users, Calendar, BookOpen, Save, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";

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
  cursoId: string;
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

export default function QuickAttendanceRegister() {
  const { user } = useContext(AuthContext);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Obtener datos
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");
  const { data: students } = useFirestoreCollection<Student>("students");
  const { data: attendances } = useFirestoreCollection<Attendance>("attendances");

  // Filtrar materias del docente
  const teacherSubjects = subjects.filter(subject => 
    subject.teacherId === user?.teacherId
  );

  // Filtrar estudiantes del curso del docente
  const teacherStudents = students.filter(student => {
    const teacherSubject = teacherSubjects.find(subject => 
      subject.cursoId === student.cursoId
    );
    return teacherSubject !== undefined;
  });

  // Actualizar mapa de asistencias cuando cambian los filtros
  useEffect(() => {
    if (!selectedSubject || !selectedDate) return;

    const newAttendanceMap: Record<string, boolean> = {};
    
    teacherStudents.forEach(student => {
      const existingAttendance = attendances.find(att => 
        att.studentId === student.firestoreId &&
        att.courseId === student.cursoId &&
        att.subject === selectedSubject &&
        att.date === selectedDate
      );
      
      newAttendanceMap[student.firestoreId] = existingAttendance?.present ?? false;
    });
    
    setAttendanceMap(newAttendanceMap);
  }, [selectedSubject, selectedDate, teacherStudents, attendances]);

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
      newMap[student.firestoreId] = false;
    });
    setAttendanceMap(newMap);
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedDate) return;
    
    setIsLoading(true);
    setSaveSuccess(false);
    
    try {
      for (const student of teacherStudents) {
        const present = attendanceMap[student.firestoreId] ?? false;
        const docId = `${student.firestoreId}_${student.cursoId}_${selectedSubject}_${selectedDate}`;
        
        const existingAttendance = attendances.find(att => 
          att.studentId === student.firestoreId &&
          att.courseId === student.cursoId &&
          att.subject === selectedSubject &&
          att.date === selectedDate
        );

        if (existingAttendance) {
          await updateDoc(doc(db, "attendances", existingAttendance.firestoreId), {
            present,
            updatedAt: new Date()
          });
        } else {
          await setDoc(doc(db, "attendances", docId), {
            studentId: student.firestoreId,
            courseId: student.cursoId,
            subject: selectedSubject,
            date: selectedDate,
            present,
            createdAt: new Date()
          });
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const totalStudents = teacherStudents.length;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <BookOpen className="h-5 w-5" />
            Registro Rápido de Asistencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalStudents - presentCount}</div>
              <div className="text-sm text-gray-600">Ausentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{attendancePercentage}%</div>
              <div className="text-sm text-gray-600">Asistencia</div>
            </div>
          </div>

          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={markAllPresent}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Todos Presentes
            </Button>
            <Button
              onClick={markAllAbsent}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Marcar Todos Ausentes
            </Button>
            <Button
              onClick={resetAttendance}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetear
            </Button>
            <Button
              onClick={saveAttendance}
              disabled={isLoading || !selectedSubject}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Guardando..." : "Guardar Asistencias"}
            </Button>
          </div>

          {saveSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              ¡Asistencias guardadas exitosamente!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de estudiantes */}
      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Estudiantes - {selectedSubject} - {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherStudents.map(student => (
                <div
                  key={student.firestoreId}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    attendanceMap[student.firestoreId]
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                  onClick={() => toggleAttendance(student.firestoreId)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.nombre} {student.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {student.firestoreId.slice(-6)}
                      </div>
                    </div>
                    <Badge
                      variant={attendanceMap[student.firestoreId] ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {attendanceMap[student.firestoreId] ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Presente
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Ausente
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 