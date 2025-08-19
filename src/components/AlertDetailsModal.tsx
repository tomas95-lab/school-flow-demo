/**
 * Modal de Detalles de Alerta - Vista completa de una alerta específica
 */

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle, 
  TrendingUp, 
  Archive, 
  MessageSquare, 
  User, 
  Calendar, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Separator } from './ui/separator';

interface AlertDetailsModalProps {
  alert: any;
  onClose: () => void;
  onAction: (alertId: string, action: 'resolve' | 'escalate' | 'archive') => void;
}

export function AlertDetailsModal({ alert, onClose, onAction }: AlertDetailsModalProps) {
  const [actionNotes, setActionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'resolve' | 'escalate' | 'archive') => {
    if (!actionNotes.trim() && action !== 'archive') {
      return;
    }

    setLoading(true);
    try {
      await onAction(alert.firestoreId, action);
      onClose();
    } catch (error) {
      console.error('Error en acción:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'attendance': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'behavior': return 'bg-red-100 text-red-800 border-red-200';
      case 'general': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Detalles de la Alerta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={getPriorityColor(alert.priority)}>
                {alert.priority}
              </Badge>
              <Badge className={getTypeColor(alert.type)}>
                {alert.type}
              </Badge>
              <Badge variant="outline">
                {alert.status}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {alert.title}
              </h3>
              <p className="text-gray-600">
                {alert.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Metadatos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Creado por:</span>
                <span className="text-sm font-medium">{alert.createdByRole}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Fecha:</span>
                <span className="text-sm font-medium">
                  {alert.createdAt?.toDate?.()?.toLocaleDateString() || 'No disponible'}
                </span>
              </div>

              {alert.resolvedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Resuelta:</span>
                  <span className="text-sm font-medium">
                    {alert.resolvedAt?.toDate?.()?.toLocaleDateString() || 'No disponible'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {alert.courseId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Curso:</span>
                  <span className="text-sm font-medium">{alert.courseName}</span>
                </div>
              )}

              {alert.escalationLevel > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Escalada:</span>
                  <span className="text-sm font-medium">Nivel {alert.escalationLevel}</span>
                </div>
              )}

              {alert.recipients && alert.recipients.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Destinatarios:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {alert.recipients.map((recipient: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notas de resolución si existe */}
          {alert.resolutionNotes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notas de Resolución</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {alert.resolutionNotes}
                </p>
              </div>
            </>
          )}

          {/* Área de acción si la alerta está activa */}
          {alert.status === 'active' && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Acciones</h4>
                <Textarea
                  placeholder="Agregar notas sobre la acción a realizar..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="mb-4"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            
            {alert.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction('archive')}
                  disabled={loading}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archivar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleAction('escalate')}
                  disabled={loading || !actionNotes.trim()}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Escalar
                </Button>
                
                <Button
                  onClick={() => handleAction('resolve')}
                  disabled={loading || !actionNotes.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolver
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AlertDetailsModal;
