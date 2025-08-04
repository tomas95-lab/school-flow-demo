import type { LucideIcon } from "lucide-react";

// Tipos TypeScript
interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple" | "indigo" | "emerald" | "yellow" | "pink" | "gray";
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "blue",
  trend,
  className = ""
}: StatsCardProps) => {
  const colorVariants = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-200" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200" },
    red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-200" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-200" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
    yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-200" },
    pink: { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-200" },
    gray: { bg: "bg-gray-50", icon: "text-gray-600", border: "border-gray-200" }
  };

  const colors = colorVariants[color] || colorVariants.blue;

  const getTrendStyles = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'down':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'neutral':
      default:
        return '→';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col border border-gray-100 ${className}`}>
      {/* Header section con icon, label y trend - altura fija */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-sm border ${colors.border}`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <p className="text-sm font-semibold text-gray-700 leading-tight break-words flex-1">{label}</p>
        </div>
        {trend && (
          <div className={`text-xs px-2.5 py-1.5 rounded-full flex-shrink-0 font-medium shadow-sm ml-2 border ${getTrendStyles()}`}>
            {getTrendIcon()}
          </div>
        )}
      </div>

      {/* Content section que ocupa el espacio restante */}
      <div className="flex-1 flex flex-col">
        {/* Value section - centrado verticalmente */}
        <div className="flex-1 flex items-center min-h-[80px]">
          <p className="text-4xl font-bold text-gray-900 leading-none break-words tracking-tight w-full">
            {value}
          </p>
        </div>
        
        {/* Subtitle section - altura fija */}
        <div className="flex items-start">
          {subtitle && (
            <p className="text-sm text-gray-500 leading-tight break-words">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
