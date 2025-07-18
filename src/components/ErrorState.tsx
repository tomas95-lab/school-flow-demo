import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({ 
  title = "Error al cargar datos", 
  message = "Hubo un problema al cargar la información. Por favor, intenta de nuevo.",
  onRetry,
  showRetry = true
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {showRetry && onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
        )}
      </div>
    </div>
  );
} 
