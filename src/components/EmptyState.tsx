import { FolderOpen, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = "No hay datos disponibles", 
  message = "No se encontraron registros para mostrar.",
  actionLabel = "Crear nuevo",
  onAction,
  showAction = false,
  icon
}: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          {icon || <FolderOpen className="h-8 w-8 text-gray-400" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {showAction && onAction && (
          <Button 
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
} 
