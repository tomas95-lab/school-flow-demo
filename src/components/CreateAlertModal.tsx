import React, { useState, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { AuthContext } from '../context/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  FileText, 
  CheckCircle,
  XCircle
} from 'lucide-react';

interface CreateAlertModalProps {
  onAlertCreated?: () => void;
}

export function CreateAlertModal({ onAlertCreated }: CreateAlertModalProps) {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'academic',
    priority: 'medium',
    recipients: [] as string[],
    courseId: '',
    courseName: '',
    isActive: true,
    expiresAt: '',
    customMessage: '',
    targetUserId: 'all',
    selectedStudents: [] as string[],
    selectedCourse: ''
  });

  // Fetch data for reactive fields
  const { data: students } = useFirestoreCollection('students');
  const { data: courses } = useFirestoreCollection('courses');

  const alertTypes = [
    { value: 'academic', label: 'Académica', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
    { value: 'attendance', label: 'Asistencia', icon: Calendar, color: 'text-green-600 bg-green-50' },
    { value: 'behavior', label: 'Comportamiento', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { value: 'general', label: 'General', icon: Bell, color: 'text-blue-600 bg-blue-50' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Baja', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle }
  ];

  const recipientOptions = [
    { value: 'all_students', label: 'Todos los estudiantes', icon: Users },
    { value: 'all_teachers', label: 'Todos los docentes', icon: Users },
    { value: 'parents', label: 'Padres de familia', icon: Users },
    { value: 'specific_course', label: 'Curso específico', icon: BookOpen },
    { value: 'specific_students', label: 'Estudiantes específicos', icon: Users }
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (formData.recipients.length === 0) {
      newErrors.recipients = 'Debes seleccionar al menos un destinatario';
    }
    
    if (formData.recipients.includes('specific_students') && formData.selectedStudents.length === 0) {
      newErrors.selectedStudents = 'Debes seleccionar al menos un estudiante';
    }
    
    if (formData.recipients.includes('specific_course') && !formData.selectedCourse) {
      newErrors.selectedCourse = 'Debes seleccionar un curso';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRecipientToggle = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(recipient)
        ? prev.recipients.filter(r => r !== recipient)
        : [...prev.recipients, recipient]
    }));
    // Clear recipients error when user makes a selection
    if (errors.recipients) {
      setErrors(prev => ({ ...prev, recipients: '' }));
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
    // Clear selectedStudents error when user makes a selection
    if (errors.selectedStudents) {
      setErrors(prev => ({ ...prev, selectedStudents: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!user) return;

    setLoading(true);
    try {
      const alertData = {
        ...formData,
        selectedCourse: formData.selectedCourse === 'all' ? '' : formData.selectedCourse,
        createdBy: user.uid,
        createdByRole: user.role,
        createdAt: serverTimestamp(),
        status: 'active',
        readBy: [],
        courseId: formData.courseId || null,
        courseName: formData.courseName || null
      };

      await addDoc(collection(db, 'alerts'), alertData);
      setFormData({
        title: '',
        description: '',
        type: 'academic',
        priority: 'medium',
        recipients: [],
        courseId: '',
        courseName: '',
        isActive: true,
        expiresAt: '',
        customMessage: '',
        targetUserId: 'all',
        selectedStudents: [],
        selectedCourse: ''
      });
      setErrors({});
      setOpen(false);
      onAlertCreated?.();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if specific course is selected
  const showCourseSelect = formData.recipients.includes('specific_course');
  const showStudentSelect = formData.recipients.includes('specific_students');
  const showAllStudentsCourseSelect = formData.recipients.includes('all_students');


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Bell className="h-4 w-4 mr-2" />
          Crear Alerta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
            Crear Nueva Alerta
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Completa los campos para crear una nueva alerta en el sistema
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Título de la Alerta *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Bajo rendimiento académico"
                    className={`mt-1 ${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm font-medium">
                    Tipo de Alerta *
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Nivel de Prioridad *
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='w-full'>
                      {priorityLevels.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                           <div className="flex items-center gap-2">
                             <priority.icon className="h-4 w-4" />
                             <Badge className={priority.color}>
                               {priority.label}
                             </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expiresAt" className="text-sm font-medium">
                    Fecha de Expiración
                  </Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destinatarios */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-600" />
                Destinatarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  Seleccionar Destinatarios *
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipientOptions.map(recipient => (
                    <Badge
                      key={recipient.value}
                      variant={formData.recipients.includes(recipient.value) ? "default" : "outline"}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                        formData.recipients.includes(recipient.value) 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'hover:border-blue-300'
                      }`}
                      onClick={() => handleRecipientToggle(recipient.value)}
                    >
                      <recipient.icon className="h-3 w-3 mr-1" />
                      {recipient.label}
                    </Badge>
                  ))}
                </div>
                {errors.recipients && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.recipients}
                  </p>
                )}
              </div>

              {/* Curso específico */}
              {showCourseSelect && (
                <div>
                  <Label htmlFor="selectedCourse" className="text-sm font-medium">
                    Seleccionar Curso *
                  </Label>
                  <Select value={formData.selectedCourse} onValueChange={(value) => handleInputChange('selectedCourse', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course: any) => (
                        <SelectItem key={course.firestoreId} value={course.firestoreId}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {course.nombre} - {course.division}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.selectedCourse && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errors.selectedCourse}
                    </p>
                  )}
                </div>
              )}

              {/* Curso para "Todos los estudiantes" */}
              {showAllStudentsCourseSelect && (
                <div>
                  <Label htmlFor="selectedCourse" className="text-sm font-medium">
                    Curso (Opcional)
                  </Label>
                  <p className="text-gray-500 text-sm mb-2">
                    Si no seleccionas un curso, la alerta será para todos los estudiantes
                  </p>
                  <Select value={formData.selectedCourse} onValueChange={(value) => handleInputChange('selectedCourse', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un curso específico (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos los cursos
                        </div>
                      </SelectItem>
                      {courses?.map((course: any) => (
                        <SelectItem key={course.firestoreId} value={course.firestoreId}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {course.nombre} - {course.division}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Estudiantes específicos */}
              {showStudentSelect && (
                <div>
                  <Label className="text-sm font-medium">
                    Seleccionar Estudiantes *
                  </Label>
                  <p className="text-gray-500 text-sm mb-2">
                    Selecciona los estudiantes específicos que recibirán esta alerta
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto border p-3 rounded-lg bg-gray-50">
                    {students?.map((student: any) => (
                      <Badge
                        key={student.firestoreId}
                        variant={formData.selectedStudents.includes(student.firestoreId) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.selectedStudents.includes(student.firestoreId) 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'hover:bg-blue-50 hover:border-blue-300'
                        }`}
                        onClick={() => handleStudentToggle(student.firestoreId)}
                      >
                        {student.nombre} {student.apellido}
                      </Badge>
                    ))}
                  </div>
                  {errors.selectedStudents && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errors.selectedStudents}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descripción */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-purple-600" />
                Descripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción de la Alerta *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe detalladamente la situación que requiere atención..."
                  rows={3}
                  className={`mt-1 ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="customMessage" className="text-sm font-medium">
                  Mensaje Personalizado
                </Label>
                <Textarea
                  id="customMessage"
                  value={formData.customMessage}
                  onChange={(e) => handleInputChange('customMessage', e.target.value)}
                  placeholder="Mensaje adicional o instrucciones específicas (opcional)"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Crear Alerta
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
