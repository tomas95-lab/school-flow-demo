import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon
  iconClassName?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="max-w-md space-y-4">
        {Icon && (
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className={cn("w-8 h-8 text-gray-400", iconClassName)} />
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="pt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

export function EmptyStateInline({
  icon: Icon,
  title,
  description,
  className
}: Omit<EmptyStateProps, 'action'>) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 text-sm bg-gray-50 rounded-lg border border-gray-200",
      className
    )}>
      {Icon && (
        <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{title}</p>
        {description && (
          <p className="text-gray-600 text-xs mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}

