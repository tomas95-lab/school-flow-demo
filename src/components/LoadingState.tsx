import { useEffect, useState } from "react";
import { SchoolSpinner } from "./SchoolSpinner";

interface LoadingStateProps {
  text?: string;
  timeout?: number;
  timeoutMessage?: string;
  showTimeoutMessage?: boolean;
}

export function LoadingState({ 
  text = "Cargando...",
  timeout = 10000, // 10 segundos
  timeoutMessage = "La carga está tomando más tiempo del esperado. Verifica tu conexión a internet.",
  showTimeoutMessage = true
}: LoadingStateProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!showTimeoutMessage) return;

    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, showTimeoutMessage]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <SchoolSpinner text={text} fullScreen={true} />
        <p className="text-gray-500 mt-4">Preparando información del sistema</p>
        {showTimeout && showTimeoutMessage && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
            <p className="text-yellow-800 text-sm">{timeoutMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
} 
