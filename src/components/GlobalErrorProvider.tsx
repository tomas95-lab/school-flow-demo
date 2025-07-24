import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorList } from './ErrorNotification';

interface GlobalErrorContextType {
  handleError: (error: unknown, context?: string) => void;
  clearErrors: () => void;
  removeError: (index: number) => void;
  hasErrors: () => boolean;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export function useGlobalError() {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider');
  }
  return context;
}

interface GlobalErrorProviderProps {
  children: ReactNode;
}

export function GlobalErrorProvider({ children }: GlobalErrorProviderProps) {
  const { errors, handleError, clearErrors, removeError, hasErrors } = useErrorHandler();

  return (
    <GlobalErrorContext.Provider value={{ handleError, clearErrors, removeError, hasErrors }}>
      {/* Global Error Display */}
      {errors.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full">
          <ErrorList 
            errors={errors} 
            onDismiss={removeError}
            maxErrors={3}
          />
        </div>
      )}
      
      {children}
    </GlobalErrorContext.Provider>
  );
} 
