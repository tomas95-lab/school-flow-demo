import React from 'react';
import { AlertTriangle, X, RefreshCw, Wifi, Shield, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { isPermissionError, isNetworkError, isValidationError } from '@/hooks/useErrorHandler';
import type { AppError } from '@/hooks/useErrorHandler';

interface ErrorNotificationProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ErrorNotification({ 
  error, 
  onDismiss, 
  onRetry, 
  showDetails = false 
}: ErrorNotificationProps) {
  const getErrorIcon = () => {
    if (isPermissionError(error)) {
      return <Shield className="h-5 w-5 text-red-600" />;
    }
    if (isNetworkError(error)) {
      return <Wifi className="h-5 w-5 text-orange-600" />;
    }
    if (isValidationError(error)) {
      return <FileText className="h-5 w-5 text-yellow-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getErrorColor = () => {
    if (isPermissionError(error)) {
      return 'border-red-200 bg-red-50 text-red-800';
    }
    if (isNetworkError(error)) {
      return 'border-orange-200 bg-orange-50 text-orange-800';
    }
    if (isValidationError(error)) {
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    }
    return 'border-red-200 bg-red-50 text-red-800';
  };

  const getErrorTitle = () => {
    if (isPermissionError(error)) {
      return 'Error de Permisos';
    }
    if (isNetworkError(error)) {
      return 'Error de Conexión';
    }
    if (isValidationError(error)) {
      return 'Error de Validación';
    }
    return 'Error';
  };

  return (
    <div className={`border rounded-lg p-4 ${getErrorColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold">
              {getErrorTitle()}
            </h4>
            
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRetry}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
              
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-sm mb-2">
            {error.message}
          </p>
          
          {error.context && (
            <p className="text-xs opacity-75 mb-2">
              Contexto: {error.context}
            </p>
          )}
          
          {showDetails && error.details && (
            <details className="text-xs">
              <summary className="cursor-pointer hover:opacity-75 mb-1">
                Ver detalles técnicos
              </summary>
              <div className="bg-white bg-opacity-50 rounded p-2 font-mono break-all">
                {error.details}
              </div>
            </details>
          )}
          
          <p className="text-xs opacity-60">
            {error.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar múltiples errores
interface ErrorListProps {
  errors: AppError[];
  onDismiss?: (index: number) => void;
  onRetry?: (index: number) => void;
  maxErrors?: number;
}

export function ErrorList({ 
  errors, 
  onDismiss, 
  onRetry, 
  maxErrors = 3 
}: ErrorListProps) {
  const displayErrors = errors.slice(-maxErrors);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {displayErrors.map((error, index) => (
        <ErrorNotification
          key={`${error.timestamp.getTime()}-${index}`}
          error={error}
          onDismiss={onDismiss ? () => onDismiss(index) : undefined}
          onRetry={onRetry ? () => onRetry(index) : undefined}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      ))}
      
      {errors.length > maxErrors && (
        <div className="text-xs text-gray-500 text-center">
          +{errors.length - maxErrors} errores más
        </div>
      )}
    </div>
  );
} 