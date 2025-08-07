import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to external service (Firebase Analytics, Sentry, etc.)
    this.logError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Application Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // In production, log to external service
    if (import.meta.env.PROD) {
      try {
        // Lightweight Sentry init guard via window.Sentry if present
        const anyWindow = window as any;
        if (anyWindow.Sentry && anyWindow.Sentry.captureException) {
          anyWindow.Sentry.captureException(error, {
            contexts: {
              react: { componentStack: errorInfo.componentStack },
            },
            tags: { source: 'ErrorBoundary' },
          });
          return;
        }
        // Fallback: send to console (or to a Cloud Function endpoint if configured)
        // fetch('/api/log-error', { method: 'POST', body: JSON.stringify({...}) })
        console.error('Production Error:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      } catch {
        // no-op
      }
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
            window.location.href = '/app/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Algo salió mal
            </h2>
            
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Ver detalles del error (solo desarrollo)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
                  <div className="text-red-600 font-semibold mb-1">Error:</div>
                  <div className="text-gray-800 mb-2">{this.state.error.message}</div>
                  <div className="text-red-600 font-semibold mb-1">Stack:</div>
                  <div className="text-gray-800">{this.state.error.stack}</div>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar de nuevo
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 
