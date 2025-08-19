/**
 * Gestor de Plantillas de Alertas - Sistema de templates reutilizables
 * Permite crear, editar y usar plantillas predefinidas para alertas
 */

import { useState } from 'react';
import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { 
  FileText,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Save,
  Eye,
  Star,
  BookOpen,
  Calendar,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import ReutilizableDialog from './DialogReutlizable';
import { toast } from 'sonner';
import type { AlertTemplate } from '@/services/alertService';

interface AlertTemplatesManagerProps {
  className?: string;
  onTemplateSelect?: (template: AlertTemplate) => void;
  showSelectMode?: boolean;
}

export function AlertTemplatesManager({ 
  className = '', 
  onTemplateSelect,
  showSelectMode = false 
}: AlertTemplatesManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<AlertTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AlertTemplate | null>(null);

  // Datos de Firestore
  const { data: templates, loading: templatesLoading } = useFirestoreCollection('alertTemplates');

  // Form state
  const [formData, setFormData] = useState<Partial<AlertTemplate>>({
    name: '',
    description: '',
    type: 'academic',
    priority: 'medium',
    titleTemplate: '',
    descriptionTemplate: '',
    variables: [],
    enabled: true
  });

  // Variables comunes que se pueden usar en templates
  const commonVariables = [
    { name: 'studentName', label: 'Nombre del estudiante', example: 'Juan Pérez' },
    { name: 'courseName', label: 'Nombre del curso', example: '5to Grado A' },
    { name: 'subjectName', label: 'Materia', example: 'Matemáticas' },
    { name: 'teacherName', label: 'Nombre del docente', example: 'Prof. García' },
    { name: 'grade', label: 'Calificación', example: '3.5' },
    { name: 'attendanceRate', label: 'Porcentaje de asistencia', example: '85%' },
    { name: 'absences', label: 'Ausencias', example: '5' },
    { name: 'currentDate', label: 'Fecha actual', example: '15/03/2024' },
    { name: 'semester', label: 'Semestre', example: '2024-1' }
  ];

  const alertTypes = [
    { value: 'academic', label: 'Académica', icon: BookOpen, color: 'text-purple-600' },
    { value: 'attendance', label: 'Asistencia', icon: Calendar, color: 'text-blue-600' },
    { value: 'behavior', label: 'Comportamiento', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'general', label: 'General', icon: Bell, color: 'text-gray-600' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Baja', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' }
  ];

  // Templates predefinidos
  const predefinedTemplates: Partial<AlertTemplate>[] = [
    {
      name: 'Bajo Rendimiento Académico',
      description: 'Alerta para estudiantes con calificaciones por debajo del promedio',
      type: 'academic',
      priority: 'high',
      titleTemplate: 'Bajo rendimiento en {{subjectName}} - {{studentName}}',
      descriptionTemplate: 'El estudiante {{studentName}} del curso {{courseName}} tiene un rendimiento bajo en {{subjectName}} con una calificación de {{grade}}. Se recomienda seguimiento adicional.',
      variables: ['studentName', 'courseName', 'subjectName', 'grade']
    },
    {
      name: 'Ausencias Frecuentes',
      description: 'Alerta para estudiantes con alto ausentismo',
      type: 'attendance',
      priority: 'medium',
      titleTemplate: 'Ausencias frecuentes - {{studentName}}',
      descriptionTemplate: 'El estudiante {{studentName}} del curso {{courseName}} ha acumulado {{absences}} ausencias. Su porcentaje de asistencia actual es {{attendanceRate}}.',
      variables: ['studentName', 'courseName', 'absences', 'attendanceRate']
    },
    {
      name: 'Incidente de Comportamiento',
      description: 'Alerta para reportar incidentes de comportamiento',
      type: 'behavior',
      priority: 'critical',
      titleTemplate: 'Incidente de comportamiento - {{studentName}}',
      descriptionTemplate: 'Se ha reportado un incidente de comportamiento del estudiante {{studentName}} del curso {{courseName}}. Requiere atención inmediata del docente {{teacherName}}.',
      variables: ['studentName', 'courseName', 'teacherName']
    },
    {
      name: 'Recordatorio General',
      description: 'Template para recordatorios y comunicaciones generales',
      type: 'general',
      priority: 'low',
      titleTemplate: 'Recordatorio para {{courseName}}',
      descriptionTemplate: 'Recordatorio para los estudiantes del curso {{courseName}}: [Mensaje personalizado aquí]. Fecha: {{currentDate}}',
      variables: ['courseName', 'currentDate']
    }
  ];

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.titleTemplate || !formData.descriptionTemplate) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const templateData = {
        ...formData,
        createdAt: new Date(),
        lastModified: new Date()
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'alertTemplates', editingTemplate.id), templateData);
        toast.success('Plantilla actualizada exitosamente');
      } else {
        await addDoc(collection(db, 'alertTemplates'), templateData);
        toast.success('Plantilla creada exitosamente');
      }

      resetForm();
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      toast.error('Error al guardar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteDoc(doc(db, 'alertTemplates', templateId));
      toast.success('Plantilla eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando plantilla:', error);
      toast.error('Error al eliminar la plantilla');
    }
  };

  const handleDuplicateTemplate = (template: AlertTemplate) => {
    setFormData({
      ...template,
      name: `${template.name} (Copia)`,
      id: undefined
    });
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleUsePredefinedTemplate = (template: Partial<AlertTemplate>) => {
    setFormData({
      ...template,
      enabled: true
    });
    setEditingTemplate(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'academic',
      priority: 'medium',
      titleTemplate: '',
      descriptionTemplate: '',
      variables: [],
      enabled: true
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const editTemplate = (template: AlertTemplate) => {
    setFormData(template);
    setEditingTemplate(template);
    setShowForm(true);
  };

  const insertVariable = (variable: string, field: 'titleTemplate' | 'descriptionTemplate') => {
    const placeholder = `{{${variable}}}`;
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || '') + placeholder,
      variables: prev.variables?.includes(variable) ? prev.variables : [...(prev.variables || []), variable]
    }));
  };

  const renderTemplatePreview = (template: AlertTemplate) => {
    const sampleData = {
      studentName: 'Ana García',
      courseName: '5to Grado A',
      subjectName: 'Matemáticas',
      teacherName: 'Prof. López',
      grade: '3.2',
      attendanceRate: '78%',
      absences: '8',
      currentDate: new Date().toLocaleDateString(),
      semester: '2024-1'
    };

    const interpolateTemplate = (text: string) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return sampleData[variable as keyof typeof sampleData] || match;
      });
    };

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Vista previa del título:</Label>
          <div className="p-3 bg-gray-50 rounded border mt-1">
            <p className="font-medium">{interpolateTemplate(template.titleTemplate)}</p>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Vista previa de la descripción:</Label>
          <div className="p-3 bg-gray-50 rounded border mt-1">
            <p className="text-sm">{interpolateTemplate(template.descriptionTemplate)}</p>
          </div>
        </div>
      </div>
    );
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {!showSelectMode && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plantillas de Alertas</h2>
            <p className="text-gray-600">
              Crea y gestiona plantillas reutilizables para generar alertas de manera eficiente
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>
      )}

      {/* Plantillas predefinidas */}
      {!showSelectMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Plantillas Predefinidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedTemplates.map((template, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <Badge className={priorityLevels.find(p => p.value === template.priority)?.color}>
                      {priorityLevels.find(p => p.value === template.priority)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUsePredefinedTemplate(template)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Usar plantilla
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates?.map((template: any) => {
          const typeInfo = alertTypes.find(t => t.value === template.type);
          const priorityInfo = priorityLevels.find(p => p.value === template.priority);
          
          return (
            <Card key={template.id || template.firestoreId} className={`transition-all duration-200 ${template.enabled !== false ? 'border-green-200' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {typeInfo && <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />}
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                  </div>
                  <Badge className={priorityInfo?.color}>
                    {priorityInfo?.label}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Variables utilizadas */}
                  <div>
                    <Label className="text-sm font-medium">Variables:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables?.map((variable: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Preview del template */}
                  <div>
                    <Label className="text-sm font-medium">Título:</Label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1 truncate">
                      {template.titleTemplate}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {showSelectMode ? (
                      <Button
                        size="sm"
                        onClick={() => onTemplateSelect?.(template)}
                        className="flex-1"
                      >
                        Seleccionar
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id || template.firestoreId)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal para crear/editar plantillas */}
      <ReutilizableDialog
        open={showForm}
        onOpenChange={(open) => !open && resetForm()}
        title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Alerta'}
        description="Crea plantillas reutilizables con variables dinámicas para alertas automáticas"
        small={false}
        content={
          <div className="max-h-[75vh] overflow-y-auto">
            <div className="p-1">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre de la plantilla</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Alerta de bajo rendimiento"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe cuándo usar esta plantilla..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={formData.type} onValueChange={(value: 'academic' | 'attendance' | 'behavior' | 'general') => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {alertTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Prioridad</Label>
                      <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityLevels.map(priority => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="titleTemplate">Plantilla del título</Label>
                    <Textarea
                      id="titleTemplate"
                      value={formData.titleTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleTemplate: e.target.value }))}
                      placeholder="Ej: Bajo rendimiento en {{subjectName}} - {{studentName}}"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="descriptionTemplate">Plantilla de la descripción</Label>
                    <Textarea
                      id="descriptionTemplate"
                      value={formData.descriptionTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, descriptionTemplate: e.target.value }))}
                      placeholder="Ej: El estudiante {{studentName}} del curso {{courseName}}..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.enabled || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="enabled">Plantilla activa</Label>
                  </div>
                </div>

                {/* Variables y preview */}
                <div className="space-y-4">
                  <div>
                    <Label>Variables disponibles</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2 max-h-64 overflow-y-auto">
                      {commonVariables.map((variable) => (
                        <div key={variable.name} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{variable.label}</p>
                            <p className="text-xs text-gray-500">{`{{${variable.name}}}`}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => insertVariable(variable.name, 'titleTemplate')}
                            >
                              T
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => insertVariable(variable.name, 'descriptionTemplate')}
                            >
                              D
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {formData.titleTemplate && formData.descriptionTemplate && (
                    <div>
                      <Label>Vista previa</Label>
                      <div className="mt-2">
                        {renderTemplatePreview(formData as AlertTemplate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </div>
        }
      />

      {/* Modal de preview */}
      <ReutilizableDialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        title={previewTemplate ? `Vista Previa: ${previewTemplate.name}` : 'Vista Previa'}
        description="Visualiza cómo se verá la plantilla con datos de ejemplo"
        small={true}
        content={
          previewTemplate && renderTemplatePreview(previewTemplate)
        }
        footer={
          <Button onClick={() => setPreviewTemplate(null)}>
            Cerrar
          </Button>
        }
      />
    </div>
  );
}

export default AlertTemplatesManager;
