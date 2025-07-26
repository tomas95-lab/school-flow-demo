import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses, useTeacherStudents } from "@/hooks/useTeacherCourses";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { addDoc, collection, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { toast } from "sonner";
import { Plus, Edit, Trash2, BookOpen, Users, Settings } from "lucide-react";

export default function GestionCursosMaterias() {
  const { user } = useContext(AuthContext);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newCourse, setNewCourse] = useState({ nombre: "", division: "" });
  const [newSubject, setNewSubject] = useState({ 
    nombre: "", 
    teacherId: "", 
    cursoId: "" 
  });
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);

  // Usar hooks estandarizados
  const { teacherCourses, teacherSubjects, isLoading: coursesLoading } = useTeacherCourses(user?.teacherId);
  const { teacherStudents, isLoading: studentsLoading } = useTeacherStudents(user?.teacherId);

  const { data: allCourses } = useFirestoreCollection("courses");
  const { data: allSubjects } = useFirestoreCollection("subjects");
  const { data: allTeachers } = useFirestoreCollection("teachers");

  if (coursesLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando gestión de cursos...</p>
        </div>
      </div>
    );
  }

  const handleAddCourse = async () => {
    if (!newCourse.nombre || !newCourse.division) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      });
      
      toast.success("Curso agregado exitosamente");
      setNewCourse({ nombre: "", division: "" });
      setIsAddingCourse(false);
    } catch (error) {
      console.error("Error al agregar curso:", error);
      toast.error("Error al agregar el curso");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.nombre || !newSubject.teacherId || !newSubject.cursoId) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "subjects"), {
        ...newSubject,
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      });
      
      toast.success("Materia agregada exitosamente");
      setNewSubject({ nombre: "", teacherId: "", cursoId: "" });
      setIsAddingSubject(false);
    } catch (error) {
      console.error("Error al agregar materia:", error);
      toast.error("Error al agregar la materia");
    }
  };

  const handleUpdateCourse = async (courseId: string, updates: any) => {
    try {
      await updateDoc(doc(db, "courses", courseId), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      
      toast.success("Curso actualizado exitosamente");
      setEditingCourse(null);
    } catch (error) {
      console.error("Error al actualizar curso:", error);
      toast.error("Error al actualizar el curso");
    }
  };

  const handleUpdateSubject = async (subjectId: string, updates: any) => {
    try {
      await updateDoc(doc(db, "subjects", subjectId), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      
      toast.success("Materia actualizada exitosamente");
      setEditingSubject(null);
    } catch (error) {
      console.error("Error al actualizar materia:", error);
      toast.error("Error al actualizar la materia");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este curso?")) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast.success("Curso eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar curso:", error);
      toast.error("Error al eliminar el curso");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta materia?")) return;

    try {
      await deleteDoc(doc(db, "subjects", subjectId));
      toast.success("Materia eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar materia:", error);
      toast.error("Error al eliminar la materia");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Cursos y Materias</h2>
        <p className="text-gray-600">Administra los cursos y materias del sistema</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{allCourses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Materias</p>
                <p className="text-2xl font-bold text-gray-900">{allSubjects?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mis Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{teacherCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestión de Cursos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Cursos</CardTitle>
            <Button onClick={() => setIsAddingCourse(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Curso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingCourse && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Nuevo Curso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseName">Nombre del Curso</Label>
                  <Input
                    id="courseName"
                    value={newCourse.nombre}
                    onChange={(e) => setNewCourse({ ...newCourse, nombre: e.target.value })}
                    placeholder="Ej: 1er Año"
                  />
                </div>
                <div>
                  <Label htmlFor="courseDivision">División</Label>
                  <Input
                    id="courseDivision"
                    value={newCourse.division}
                    onChange={(e) => setNewCourse({ ...newCourse, division: e.target.value })}
                    placeholder="Ej: A, B, C"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddCourse}>Guardar</Button>
                <Button variant="outline" onClick={() => setIsAddingCourse(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {allCourses?.map((course) => (
              <div key={course.firestoreId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">{course.nombre}</h4>
                    <p className="text-sm text-gray-600">División: {course.division}</p>
                  </div>
                  <Badge variant="outline">
                    {teacherCourses.some(c => c.firestoreId === course.firestoreId) ? "Mis Cursos" : "Otros"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCourse(course.firestoreId || "")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.firestoreId || "")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Materias */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Materias</CardTitle>
            <Button onClick={() => setIsAddingSubject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Materia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingSubject && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Nueva Materia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subjectName">Nombre de la Materia</Label>
                  <Input
                    id="subjectName"
                    value={newSubject.nombre}
                    onChange={(e) => setNewSubject({ ...newSubject, nombre: e.target.value })}
                    placeholder="Ej: Matemáticas"
                  />
                </div>
                <div>
                  <Label htmlFor="subjectTeacher">Docente</Label>
                  <Select value={newSubject.teacherId} onValueChange={(value) => setNewSubject({ ...newSubject, teacherId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar docente" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTeachers?.map((teacher) => (
                        <SelectItem key={teacher.firestoreId} value={teacher.firestoreId || ""}>
                          {teacher.nombre} {teacher.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subjectCourse">Curso</Label>
                  <Select value={newSubject.cursoId} onValueChange={(value) => setNewSubject({ ...newSubject, cursoId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCourses?.map((course) => (
                        <SelectItem key={course.firestoreId} value={course.firestoreId || ""}>
                          {course.nombre} - {course.division}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddSubject}>Guardar</Button>
                <Button variant="outline" onClick={() => setIsAddingSubject(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {allSubjects?.map((subject) => (
              <div key={subject.firestoreId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">{subject.nombre}</h4>
                    <p className="text-sm text-gray-600">
                      Docente: {allTeachers?.find(t => t.firestoreId === subject.teacherId)?.nombre} {allTeachers?.find(t => t.firestoreId === subject.teacherId)?.apellido}
                    </p>
                    <p className="text-sm text-gray-600">
                      Curso: {allCourses?.find(c => c.firestoreId === subject.cursoId)?.nombre} - {allCourses?.find(c => c.firestoreId === subject.cursoId)?.division}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {teacherSubjects.some(s => s.firestoreId === subject.firestoreId) ? "Mis Materias" : "Otras"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSubject(subject.firestoreId || "")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.firestoreId || "")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
