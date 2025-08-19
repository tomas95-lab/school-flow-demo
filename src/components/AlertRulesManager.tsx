/**
 * Gestor de Reglas de Alertas - Configuración avanzada de reglas automáticas
 * Permite crear, editar y gestionar reglas que generan alertas automáticamente
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
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import ReutilizableDialog from './DialogReutlizable';
import { toast } from 'sonner';
import type { AlertRule, AlertCondition, AlertAction } from '@/services/alertService';

interface AlertRulesManagerProps {
  className?: string;
}

export function AlertRulesManager({ className = '' }: AlertRulesManagerProps) {
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos de Firestore
  const { data: rules, loading: rulesLoading } = useFirestoreCollection('alertRules');

  // Form state
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    name: '',
    description: '',
    type: 'academic',
    priority: 'medium',
    conditions: [],
    actions: [],
    enabled: true
  });

  const [currentCondition, setCurrentCondition] = useState<AlertCondition>({
    field: '',
    operator: 'lt',
    value: 0
  });

  const [currentAction, setCurrentAction] = useState<AlertAction>({
    type: 'create_alert',
    target: []
  });

  // Opciones de configuración
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

  const conditionFields = [
    { value: 'average_grade', label: 'Promedio de calificaciones', type: 'number' },
    { value: 'attendance_rate', label: 'Porcentaje de asistencia', type: 'number' },
    { value: 'consecutive_absences', label: 'Ausencias consecutivas', type: 'number' },
    { value: 'failed_subjects', label: 'Materias reprobadas', type: 'number' },
    { value: 'grade_trend', label: 'Tendencia de calificaciones', type: 'string' },
    { value: 'behavior_incidents', label: 'Incidentes de comportamiento', type: 'number' }
  ];

  const operators = [
    { value: 'gt', label: 'Mayor que (>)' },
    { value: 'lt', label: 'Menor que (<)' },
    { value: 'eq', label: 'Igual a (=)' },
    { value: 'gte', label: 'Mayor o igual (>=)' },
    { value: 'lte', label: 'Menor o igual (<=)' },
    { value: 'contains', label: 'Contiene' }
  ];

  const actionTypes = [
    { value: 'create_alert', label: 'Crear alerta' },
    { value: 'send_notification', label: 'Enviar notificación' },
    { value: 'escalate', label: 'Escalar automáticamente' },
    { value: 'assign_task', label: 'Asignar tarea' }
  ];

  const targets = [
    { value: 'all_teachers', label: 'Todos los docentes' },
    { value: 'course_teacher', label: 'Docente del curso' },
    { value: 'admin', label: 'Administradores' },
    { value: 'parents', label: 'Padres/tutores' },
    { value: 'student', label: 'Estudiante' }
  ];

  const handleSaveRule = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.description || formData.conditions!.length === 0) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const ruleData = {
        ...formData,
        createdBy: 'admin', // TODO: usar contexto de usuario
        createdAt: new Date(),
        lastModified: new Date()
      };

      if (editingRule) {
        await updateDoc(doc(db, 'alertRules', editingRule.id), ruleData);
        toast.success('Regla actualizada exitosamente');
      } else {
        await addDoc(collection(db, 'alertRules'), ruleData);
        toast.success('Regla creada exitosamente');
      }

      resetForm();
    } catch (error) {
      console.error('Error guardando regla:', error);
      toast.error('Error al guardar la regla');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteDoc(doc(db, 'alertRules', ruleId));
      toast.success('Regla eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando regla:', error);
      toast.error('Error al eliminar la regla');
    }
  };

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      await updateDoc(doc(db, 'alertRules', rule.id), {
        enabled: !rule.enabled,
        lastModified: new Date()
      });
      toast.success(`Regla ${rule.enabled ? 'desactivada' : 'activada'}`);
    } catch (error) {
      console.error('Error actualizando regla:', error);
      toast.error('Error al actualizar la regla');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'academic',
      priority: 'medium',
      conditions: [],
      actions: [],
      enabled: true
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const editRule = (rule: AlertRule) => {
    setFormData(rule);
    setEditingRule(rule);
    setShowForm(true);
  };

  const addCondition = () => {
    if (!currentCondition.field || currentCondition.value === undefined) {
      toast.error('Completa todos los campos de la condición');
      return;
    }

    setFormData(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), currentCondition]
    }));

    setCurrentCondition({
      field: '',
      operator: 'lt',
      value: 0
    });
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index) || []
    }));
  };

  const addAction = () => {
    if (!currentAction.type || currentAction.target.length === 0) {
      toast.error('Completa todos los campos de la acción');
      return;
    }

    setFormData(prev => ({
      ...prev,
      actions: [...(prev.actions || []), currentAction]
    }));

    setCurrentAction({
      type: 'create_alert',
      target: []
    });
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index) || []
    }));
  };

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando reglas de alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reglas de Alertas</h2>
          <p className="text-gray-600">
            Configura reglas automáticas para generar alertas basadas en condiciones específicas
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* Lista de reglas existentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rules?.map((rule: any) => {
          const typeInfo = alertTypes.find(t => t.value === rule.type);
          const priorityInfo = priorityLevels.find(p => p.value === rule.priority);
          
          return (
            <Card key={rule.id} className={`transition-all duration-200 ${rule.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {typeInfo && <typeInfo.icon className={`h-5 w-5 ${typeInfo.color}`} />}
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityInfo?.color}>
                      {priorityInfo?.label}
                    </Badge>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule)}
                    />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">{rule.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Condiciones */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Condiciones ({rule.conditions.length})</h4>
                    <div className="space-y-2">
                      {rule.conditions.slice(0, 2).map((condition: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                          {conditionFields.find(f => f.value === condition.field)?.label || condition.field} {' '}
                          {operators.find(o => o.value === condition.operator)?.label} {' '}
                          {condition.value}
                        </div>
                      ))}
                      {rule.conditions.length > 2 && (
                        <p className="text-xs text-gray-500">+{rule.conditions.length - 2} más...</p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Acciones ({rule.actions.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.actions.map((action: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {actionTypes.find(a => a.value === action.type)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Acciones de la regla */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editRule(rule)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal/Form para crear/editar reglas */}
      <ReutilizableDialog
        open={showForm}
        onOpenChange={(open) => !open && resetForm()}
        title={editingRule ? 'Editar Regla' : 'Nueva Regla de Alerta'}
        description="Configura las condiciones y acciones para generar alertas automáticamente"
        small={false}
        content={
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">


              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre de la regla</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Alerta por bajo rendimiento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo de alerta</Label>
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
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
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={formData.enabled || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="enabled">Regla activa</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe cuándo y por qué se debe activar esta regla..."
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Condiciones */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Condiciones</h4>
                  
                  {/* Lista de condiciones existentes */}
                  {formData.conditions && formData.conditions.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.conditions.map((condition: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm">
                            {conditionFields.find(f => f.value === condition.field)?.label} {' '}
                            {operators.find(o => o.value === condition.operator)?.label} {' '}
                            <strong>{condition.value}</strong>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar nueva condición */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <Select value={currentCondition.field} onValueChange={(value) => setCurrentCondition(prev => ({ ...prev, field: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={currentCondition.operator} onValueChange={(value: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains') => setCurrentCondition(prev => ({ ...prev, operator: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type={conditionFields.find(f => f.value === currentCondition.field)?.type === 'number' ? 'number' : 'text'}
                      value={currentCondition.value}
                      onChange={(e) => setCurrentCondition(prev => ({ ...prev, value: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      placeholder="Valor"
                    />

                    <Button onClick={addCondition}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Acciones */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Acciones</h4>
                  
                  {/* Lista de acciones existentes */}
                  {formData.actions && formData.actions.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.actions.map((action: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm">
                            {actionTypes.find(a => a.value === action.type)?.label} →{' '}
                            {action.target.map((t: string) => targets.find(target => target.value === t)?.label).join(', ')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar nueva acción */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <Select value={currentAction.type} onValueChange={(value: 'create_alert' | 'send_notification' | 'escalate' | 'assign_task') => setCurrentAction(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de acción" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={currentAction.target[0] || ''} onValueChange={(value) => setCurrentAction(prev => ({ ...prev, target: [value] }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Destinatario" />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map(target => (
                          <SelectItem key={target.value} value={target.value}>
                            {target.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={addAction}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
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
            <Button onClick={handleSaveRule} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {editingRule ? 'Actualizar' : 'Crear'} Regla
            </Button>
          </div>
        }
      />
    </div>
  );
}

export default AlertRulesManager;
