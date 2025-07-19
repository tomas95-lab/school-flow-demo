import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Calendar, BookOpen, GraduationCap, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { useColumnsCursos, useColumnsMaterias } from "@/app/cursos_materias/colums";
import { Button } from "@/components/ui/button";
import ReutilizableDialog from "@/components/DialogReutlizable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export default function GestionCursosMaterias() {
  const { user, loading: userLoading } = useContext(AuthContext)
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [selectedMateria, setSelectedMateria] = useState<any>(null);
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [showMateriaModal, setShowMateriaModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { loading: coursesLoading, data: courses, refetch: refetchCourses } =  useFirestoreCollection("courses");
  const { loading: subjectsLoading, data: subjects, refetch: refetchSubjects } =  useFirestoreCollection("subjects");
  const { loading: teachersLoading, data: teachers } = useFirestoreCollection("teachers");
  const { loading: studentsLoading, data: students } = useFirestoreCollection("students");

  // Form states for curso modal
  const [cursoForm, setCursoForm] = useState({
    nombre: '',
    division: '',
    teacherId: ''
  });

  // Form states for materia modal
  const [materiaForm, setMateriaForm] = useState({
    nombre: '',
    teacherId: '',
    cursoId: ''
  });

  // Reset forms when modal type changes
  useEffect(() => {
    if (modalType === 'create') {
      setCursoForm({ nombre: '', division: '', teacherId: '' });
      setMateriaForm({ nombre: '', teacherId: '', cursoId: '' });
    } else if (modalType === 'edit' && selectedCurso) {
      // Buscar el curso original en los datos de Firestore
      const originalCurso = courses.find(c => c.firestoreId === selectedCurso.id);
      console.log('Editando curso:', { selectedCurso, originalCurso });
      setCursoForm({
        nombre: originalCurso?.nombre || selectedCurso.name || '',
        division: originalCurso?.division || selectedCurso.division || '',
        teacherId: originalCurso?.teacherId || ''
      });
    } else if (modalType === 'edit' && selectedMateria) {
      // Buscar la materia original en los datos de Firestore
      const originalMateria = subjects.find(s => s.firestoreId === selectedMateria.id);
      console.log('Editando materia:', { selectedMateria, originalMateria });
      setMateriaForm({
        nombre: originalMateria?.nombre || selectedMateria.name || '',
        teacherId: originalMateria?.teacherId || '',
        cursoId: originalMateria?.cursoId || ''
      });
    }
  }, [modalType, selectedCurso, selectedMateria, courses, subjects]);

  // Función para obtener el mensaje según el rol
  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "Gestiona y supervisa los cursos y materias del sistema educativo.";
      case "docente":
        return "Registra y administra los cursos y materias asignados.";
      case "alumno":
        return "Consulta tu historial de cursos y materias asignados.";
      default:
        return "Panel de gestión de cursos y materias del sistema educativo.";
    }
  };

  // Handle form submissions
  const handleCursoSubmit = async () => {
    if (!cursoForm.nombre.trim() || !cursoForm.division.trim()) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos requeridos' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (modalType === 'create') {
        const cursoData = {
          nombre: cursoForm.nombre.trim(),
          division: cursoForm.division.trim(),
          teacherId: cursoForm.teacherId || '',
          año: new Date().getFullYear(),
          creadoEn: serverTimestamp()
        };

        await addDoc(collection(db, "courses"), cursoData);
        setMessage({ type: 'success', text: 'Curso creado exitosamente' });
        await refetchCourses();
      } else if (modalType === 'edit' && selectedCurso) {
        const cursoData = {
          nombre: cursoForm.nombre.trim(),
          division: cursoForm.division.trim(),
          teacherId: cursoForm.teacherId || '',
          actualizadoEn: serverTimestamp()
        };

        await updateDoc(doc(db, "courses", selectedCurso.id), cursoData);
        setMessage({ type: 'success', text: 'Curso actualizado exitosamente' });
        await refetchCourses();
      }
      
      setShowCursoModal(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al procesar la solicitud. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMateriaSubmit = async () => {
    if (!materiaForm.nombre.trim() || !materiaForm.cursoId) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos requeridos' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (modalType === 'create') {
        const materiaData = {
          nombre: materiaForm.nombre.trim(),
          teacherId: materiaForm.teacherId || '',
          cursoId: materiaForm.cursoId,
          profesor: teachers.find(t => t.firestoreId === materiaForm.teacherId)?.nombre || '',
          creadoEn: serverTimestamp()
        };

        await addDoc(collection(db, "subjects"), materiaData);
        setMessage({ type: 'success', text: 'Materia creada exitosamente' });
        await refetchSubjects();
      } else if (modalType === 'edit' && selectedMateria) {
        const materiaData = {
          nombre: materiaForm.nombre.trim(),
          teacherId: materiaForm.teacherId || '',
          cursoId: materiaForm.cursoId,
          profesor: teachers.find(t => t.firestoreId === materiaForm.teacherId)?.nombre || '',
          actualizadoEn: serverTimestamp()
        };

        await updateDoc(doc(db, "subjects", selectedMateria.id), materiaData);
        setMessage({ type: 'success', text: 'Materia actualizada exitosamente' });
        await refetchSubjects();
      }
      
      setShowMateriaModal(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al procesar la solicitud. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar spinner si el usuario está cargando o si los cursos están cargando
  if (userLoading || coursesLoading || subjectsLoading || teachersLoading || studentsLoading) {
    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <SchoolSpinner text="Cargando panel administrativo..." fullScreen={true} />
        <p className="text-gray-500 mt-4">Preparando información del sistema</p>
      </div>
    </div>
    );
  }

  // Obtener información del estudiante si es alumno
  const studentInfo = user?.role === "alumno" ? students.find(s => s.firestoreId === user.studentId) : null;

  // Funciones de gestión de cursos
  const handleCreateCurso = () => {
    setSelectedCurso(null);
    setModalType('create');
    setShowCursoModal(true);
  };

  const handleEditCurso = (curso: any) => {
    setSelectedCurso(curso);
    setModalType('edit');
    setShowCursoModal(true);
  };

  const handleViewCurso = (curso: any) => {
    setSelectedCurso(curso);
    setModalType('view');
    setShowCursoModal(true);
  };

  const handleDeleteCurso = async (curso: any) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el curso "${curso.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await deleteDoc(doc(db, "courses", curso.id));
      setMessage({ type: 'success', text: 'Curso eliminado exitosamente' });
      await refetchCourses();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al eliminar el curso. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // Funciones de gestión de materias
  const handleCreateMateria = () => {
    setSelectedMateria(null);
    setModalType('create');
    setShowMateriaModal(true);
  };

  const handleEditMateria = (materia: any) => {
    setSelectedMateria(materia);
    setModalType('edit');
    setShowMateriaModal(true);
  };

  const handleViewMateria = (materia: any) => {
    setSelectedMateria(materia);
    setModalType('view');
    setShowMateriaModal(true);
  };

  const handleDeleteMateria = async (materia: any) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la materia "${materia.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await deleteDoc(doc(db, "subjects", materia.id));
      setMessage({ type: 'success', text: 'Materia eliminada exitosamente' });
      await refetchSubjects();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la materia. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // Validar que el alumno tenga información
  if (user?.role === "alumno" && !studentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Información no encontrada</h2>
            <p className="text-gray-600">No se encontró información de estudiante para tu cuenta.</p>
            <p className="text-gray-500 text-sm mt-2">Contacta al administrador del sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  const myCourses = user?.role === "docente"
    ? courses.filter((c) => c.teacherId.includes(user.teacherId))
    : user?.role === "alumno"
    ? courses.filter((c) => c.firestoreId === studentInfo?.cursoId)
    : courses

  // Filtrar materias por rol
  const mySubjects = user?.role === "docente" 
    ? subjects.filter((s) => s.teacherId == user.teacherId) 
    : user?.role === "alumno"
    ? subjects.filter((s) => s.cursoId === studentInfo?.cursoId)
    : subjects

  // Para cada curso, obtener los teachers relacionados
  const coursesWithTeachers = myCourses.map((course: any) => {
    const relatedTeachers = teachers.filter((t: any) => {
      return t.cursoId === course.firestoreId;
    });
    return {
      ...course,
      teachers: relatedTeachers
    };
  });

  // Para cada materia, obtener los teachers relacionados
  const subjectsWithTeachers = mySubjects.map((subject: any) => {
    const relatedTeachers = teachers.filter((t: any) => {
      return t.firestoreId === subject.teacherId;
    });
    return {
      ...subject,
      teachers: relatedTeachers
    };
  });

  // Map Firestore data to Curso type
  const mappedCourses = myCourses.map((course: any) => {
    const courseWithTeachers = coursesWithTeachers.find((c: any) => c.firestoreId === course.firestoreId);
    return {
      id: course.firestoreId,
      name: course.nombre || "Sin nombre",
      teacherId: courseWithTeachers?.teachers?.map((t: any) => `${t.nombre} ${t.apellido}`) || [],
      division: course.division || "Sin división"
    };
  })

  // Map Firestore data to Materia type
  const mappedSubjects = mySubjects.map((subject: any) => {
    const subjectWithTeachers = subjectsWithTeachers.find((s: any) => s.firestoreId === subject.firestoreId);
    return {
      id: subject.firestoreId,
      name: subject.nombre || "Sin nombre",
      teacherId: subjectWithTeachers?.teachers?.map((t: any) => `${t.nombre} ${t.apellido}`) || [],
      cursoIds: subject.cursoId ? myCourses.filter((c) => c.firestoreId === subject.cursoId).map((c) => c.nombre + " - " + c.division) : []
    };
  })

  // Modal content for curso
  const cursoModalContent = (
    <div className="space-y-4">
      {modalType === 'view' ? (
        // View mode
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Nombre del Curso</Label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {selectedCurso?.name || 'Sin nombre'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">División</Label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {selectedCurso?.division || 'Sin división'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Docentes Asignados</Label>
            <div className="mt-1 space-y-2">
              {selectedCurso?.teacherId?.length > 0 ? (
                selectedCurso.teacherId.map((teacher: string, index: number) => (
                  <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600">
                        {teacher.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">{teacher}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">Sin docentes asignados</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Create/Edit mode
        <div className="space-y-4">
          <div>
            <Label htmlFor="curso-nombre">Nombre del Curso</Label>
            <Input
              id="curso-nombre"
              value={cursoForm.nombre}
              onChange={(e) => setCursoForm({ ...cursoForm, nombre: e.target.value })}
              placeholder="Ingrese el nombre del curso"
            />
          </div>
          <div>
            <Label htmlFor="curso-division">División</Label>
            <Input
              id="curso-division"
              value={cursoForm.division}
              onChange={(e) => setCursoForm({ ...cursoForm, division: e.target.value })}
              placeholder="Ej: A, B, C, 1°, 2°"
            />
          </div>
          <div>
            <Label htmlFor="curso-teacher">Docente Responsable</Label>
            <Select
              value={cursoForm.teacherId}
              onValueChange={(value) => setCursoForm({ ...cursoForm, teacherId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un docente" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher: any) => (
                  <SelectItem key={teacher.firestoreId} value={teacher.firestoreId}>
                    {teacher.nombre} {teacher.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );

  // Modal content for materia
  const materiaModalContent = (
    <div className="space-y-4">
      {modalType === 'view' ? (
        // View mode
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Nombre de la Materia</Label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {selectedMateria?.name || 'Sin nombre'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Docente Responsable</Label>
            <div className="mt-1 space-y-2">
              {selectedMateria?.teacherId?.length > 0 ? (
                selectedMateria.teacherId.map((teacher: string, index: number) => (
                  <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-green-600">
                        {teacher.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">{teacher}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">Sin docente asignado</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Cursos donde se imparte</Label>
            <div className="mt-1 space-y-2">
              {selectedMateria?.cursoIds?.length > 0 ? (
                selectedMateria.cursoIds.map((curso: string, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-900">{curso}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">Sin cursos asignados</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Create/Edit mode
        <div className="space-y-4">
          <div>
            <Label htmlFor="materia-nombre">Nombre de la Materia</Label>
            <Input
              id="materia-nombre"
              value={materiaForm.nombre}
              onChange={(e) => setMateriaForm({ ...materiaForm, nombre: e.target.value })}
              placeholder="Ingrese el nombre de la materia"
            />
          </div>
          <div>
            <Label htmlFor="materia-teacher">Docente Responsable</Label>
            <Select
              value={materiaForm.teacherId}
              onValueChange={(value) => setMateriaForm({ ...materiaForm, teacherId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un docente" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher: any) => (
                  <SelectItem key={teacher.firestoreId} value={teacher.firestoreId}>
                    {teacher.nombre} {teacher.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modalType === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">
                Valor actual: {materiaForm.teacherId || 'No seleccionado'}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="materia-curso">Curso donde se imparte</Label>
            <Select
              value={materiaForm.cursoId}
              onValueChange={(value) => setMateriaForm({ ...materiaForm, cursoId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un curso" />
              </SelectTrigger>
              <SelectContent>
                {myCourses.map((course: any) => (
                  <SelectItem key={course.firestoreId} value={course.firestoreId}>
                    {course.nombre} - {course.division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modalType === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">
                Valor actual: {materiaForm.cursoId || 'No seleccionado'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Modal footer for curso
  const cursoModalFooter = modalType === 'view' ? (
    <Button onClick={() => setShowCursoModal(false)}>Cerrar</Button>
  ) : (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setShowCursoModal(false)} disabled={loading}>
        Cancelar
      </Button>
      <Button onClick={handleCursoSubmit} disabled={loading}>
        {loading ? 'Procesando...' : (modalType === 'create' ? 'Crear Curso' : 'Actualizar Curso')}
      </Button>
    </div>
  );

  // Modal footer for materia
  const materiaModalFooter = modalType === 'view' ? (
    <Button onClick={() => setShowMateriaModal(false)}>Cerrar</Button>
  ) : (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setShowMateriaModal(false)} disabled={loading}>
        Cancelar
      </Button>
      <Button onClick={handleMateriaSubmit} disabled={loading}>
        {loading ? 'Procesando...' : (modalType === 'create' ? 'Crear Materia' : 'Actualizar Materia')}
      </Button>
    </div>
  );

  return (
      <div className="min-h-screen">
          <div className="min-h-screen bg-gray-50">
            <div className="p-8">
              {/* Header del Dashboard */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Panel de Gestión de Cursos y Materias
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {getRoleMessage(user?.role)}
                    </p>
                  </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-white px-6 py-3 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-600">Período Actual</p>
                            <p className="font-semibold text-gray-900">2025 - Semestre I</p>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              {/* Mensajes de feedback */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {message.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{message.text}</span>
                  </div>
                </div>
              )}

              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total de Cursos</p>
                      <p className="text-2xl font-bold text-gray-900">{myCourses.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total de Materias</p>
                      <p className="text-2xl font-bold text-gray-900">{mySubjects.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Período Activo</p>
                      <p className="text-lg font-semibold text-gray-900">2025 - Semestre I</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8 w-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.role === "alumno" ? "Mis Cursos Inscritos" : "Mis Cursos"}
                    </h3>
                    {(user?.role === "admin" || user?.role === "docente") && (
                      <Button onClick={handleCreateCurso} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Crear Curso
                      </Button>
                    )}
                  </div>
                  {mappedCourses.length > 0 ? (
                    <DataTable 
                      columns={useColumnsCursos(handleEditCurso, handleDeleteCurso, handleViewCurso)} 
                      data={mappedCourses} 
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay cursos disponibles para mostrar.</p>
                      {(user?.role === "admin" || user?.role === "docente") && (
                        <Button onClick={handleCreateCurso} className="mt-4" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear primer curso
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.role === "alumno" ? "Mis Materias Inscritas" : "Mis Materias"}
                    </h3>
                    {(user?.role === "admin" || user?.role === "docente") && (
                      <Button onClick={handleCreateMateria} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Crear Materia
                      </Button>
                    )}
                  </div>
                  {mappedSubjects.length > 0 ? (
                    <DataTable 
                      columns={useColumnsMaterias(handleEditMateria, handleDeleteMateria, handleViewMateria)} 
                      data={mappedSubjects} 
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay materias disponibles para mostrar.</p>
                      {(user?.role === "admin" || user?.role === "docente") && (
                        <Button onClick={handleCreateMateria} className="mt-4" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear primera materia
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            
            <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Centro de Ayuda</h3>
                  <p className="text-gray-600 mb-4">
                    ¿Necesitas ayuda con la administración del sistema? Consulta nuestros recursos.
                  </p>
                  <div className="flex gap-3">
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      Guía de usuario
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      Soporte técnico
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Última Actualización</h3>
                  <p className="text-gray-600">
                    Los datos fueron actualizados por última vez hace pocos minutos. 
                    El sistema se sincroniza automáticamente cada 5 minutos.
                  </p>
                </div>
              </div>
            </div>

            {/* Curso Modal */}
            <ReutilizableDialog
              open={showCursoModal}
              onOpenChange={setShowCursoModal}
              title={
                modalType === 'create' ? 'Crear Nuevo Curso' :
                modalType === 'edit' ? 'Editar Curso' : 'Detalles del Curso'
              }
              description={
                modalType === 'create' ? 'Complete la información para crear un nuevo curso' :
                modalType === 'edit' ? 'Modifique la información del curso' : 'Información detallada del curso'
              }
              content={cursoModalContent}
              footer={cursoModalFooter}
              small={false}
            />

            {/* Materia Modal */}
            <ReutilizableDialog
              open={showMateriaModal}
              onOpenChange={setShowMateriaModal}
              title={
                modalType === 'create' ? 'Crear Nueva Materia' :
                modalType === 'edit' ? 'Editar Materia' : 'Detalles de la Materia'
              }
              description={
                modalType === 'create' ? 'Complete la información para crear una nueva materia' :
                modalType === 'edit' ? 'Modifique la información de la materia' : 'Información detallada de la materia'
              }
              content={materiaModalContent}
              footer={materiaModalFooter}
              small={false}
            />

            {/* Custom Styles */}
            <style>{`
              @keyframes slideInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            `}</style>
          </div>
        </div>
      </div>

  );
}
