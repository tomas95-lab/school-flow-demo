import { useState, useCallback } from 'react';
import { FirebaseError } from 'firebase/app';

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: string;
}

export type ErrorType = 'firebase' | 'network' | 'validation' | 'permission' | 'unknown';

export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([]);

  const handleError = useCallback((error: unknown, context?: string): AppError => {
    let appError: AppError;

    if (error instanceof FirebaseError) {
      appError = {
        code: error.code,
        message: getFirebaseErrorMessage(error.code),
        details: error.message,
        timestamp: new Date(),
        context
      };
    } else if (error instanceof Error) {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: error.stack,
        timestamp: new Date(),
        context
      };
    } else {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: 'Error desconocido',
        details: String(error),
        timestamp: new Date(),
        context
      };
    }

    // Log error
    console.error('🚨 Application Error:', appError);
    
    // Add to errors state
    setErrors(prev => [...prev, appError]);
    
    return appError;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getLatestError = useCallback(() => {
    return errors[errors.length - 1];
  }, [errors]);

  const hasErrors = useCallback(() => {
    return errors.length > 0;
  }, [errors]);

  return {
    errors,
    handleError,
    clearErrors,
    removeError,
    getLatestError,
    hasErrors
  };
}

// Firebase error message mapping
function getFirebaseErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    // Auth errors
    'auth/user-not-found': 'No existe una cuenta con este email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-email': 'Formato de email inválido',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/invalid-credential': 'Credenciales inválidas',
    
    // Firestore errors
    'permission-denied': 'No tienes permisos para realizar esta acción',
    'unavailable': 'Servicio temporalmente no disponible',
    'deadline-exceeded': 'La operación tardó demasiado',
    'resource-exhausted': 'Recursos agotados',
    'failed-precondition': 'Condición previa fallida',
    'aborted': 'Operación abortada',
    'out-of-range': 'Valor fuera de rango',
    'unimplemented': 'Operación no implementada',
    'internal': 'Error interno del servidor',
    'data-loss': 'Pérdida de datos',
    'unauthenticated': 'No estás autenticado',
    
    // Network errors
    'network-request-failed': 'Error de conexión. Verifica tu internet',
    'timeout': 'La operación tardó demasiado',
    
    // Custom errors
    'VALIDATION_ERROR': 'Error de validación',
    'PERMISSION_DENIED': 'Permisos insuficientes',
    'DATA_NOT_FOUND': 'Datos no encontrados',
    'DUPLICATE_ENTRY': 'Entrada duplicada',
    'INVALID_OPERATION': 'Operación inválida'
  };

  return errorMessages[code] || 'Error desconocido';
}

// Utility function to check if error is a permission error
export function isPermissionError(error: AppError): boolean {
  return error.code === 'permission-denied' || 
         error.code === 'PERMISSION_DENIED' ||
         error.code === 'unauthenticated';
}

// Utility function to check if error is a network error
export function isNetworkError(error: AppError): boolean {
  return error.code === 'network-request-failed' || 
         error.code === 'unavailable' ||
         error.code === 'timeout';
}

// Utility function to check if error is a validation error
export function isValidationError(error: AppError): boolean {
  return error.code === 'VALIDATION_ERROR' ||
         error.code === 'failed-precondition' ||
         error.code === 'out-of-range';
} 
