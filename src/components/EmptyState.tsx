import type { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
        {actionText && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 
