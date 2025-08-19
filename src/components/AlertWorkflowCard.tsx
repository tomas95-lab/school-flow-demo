/**
 * Componente de Card de Workflow de Alerta
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  Clock, 
  User
} from 'lucide-react';
import type { AlertWorkflow } from '@/services/alertService';

interface AlertWorkflowCardProps {
  workflow: AlertWorkflow;
  onStepComplete?: (workflowId: string, stepId: string) => void;
  className?: string;
}

export function AlertWorkflowCard({ workflow, onStepComplete, className = '' }: AlertWorkflowCardProps) {
  const progress = (workflow.currentStep / workflow.totalSteps) * 100;
  const currentStep = workflow.steps[workflow.currentStep];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Workflow #{workflow.id.slice(-6)}</CardTitle>
          <Badge className={getStatusColor(workflow.status)}>
            {workflow.status}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium">{workflow.currentStep + 1}/{workflow.totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Paso actual */}
        {currentStep && workflow.status !== 'completed' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {getStepIcon(currentStep.status)}
              <h4 className="font-medium text-blue-900">Paso Actual</h4>
            </div>
            <h5 className="font-medium text-gray-900 mb-1">{currentStep.name}</h5>
            <p className="text-sm text-gray-600 mb-3">{currentStep.description}</p>
            
            {currentStep.assignedTo && (
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Asignado a: {currentStep.assignedTo}</span>
              </div>
            )}

            {currentStep.dueDate && (
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Vence: {currentStep.dueDate.toLocaleDateString()}
                </span>
              </div>
            )}

            {onStepComplete && currentStep.status !== 'completed' && (
              <Button
                size="sm"
                onClick={() => onStepComplete(workflow.id, currentStep.id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Completar Paso
              </Button>
            )}
          </div>
        )}

        {/* Lista de pasos */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Pasos del Workflow</h4>
          <div className="space-y-2">
            {workflow.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  index === workflow.currentStep && workflow.status !== 'completed'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}
                  </span>
                  {getStepIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {step.name}
                    </span>
                    {step.status === 'completed' && step.completedAt && (
                      <span className="text-xs text-gray-500">
                        {step.completedAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {step.description}
                    </p>
                  )}
                </div>

                {step.assignedTo && (
                  <div className="text-xs text-gray-500">
                    {step.assignedTo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Creado:</span>
              <span className="ml-2 font-medium">
                {workflow.createdAt.toLocaleDateString()}
              </span>
            </div>
            {workflow.dueDate && (
              <div>
                <span className="text-gray-600">Vence:</span>
                <span className="ml-2 font-medium">
                  {workflow.dueDate.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AlertWorkflowCard;
