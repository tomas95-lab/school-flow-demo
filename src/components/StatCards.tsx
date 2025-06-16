type StatsCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
};

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "blue",
  trend
}: StatsCardProps) => {
  const colorVariants = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600"
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600"
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600"
    },
    red: {
      bg: "bg-red-50",
      icon: "text-red-600"
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600"
    }
  };

  const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6  hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            {trend && (
              <div className={`text-xs px-2 py-1 rounded-full ${
                trend === 'up' ? 'bg-green-100 text-green-700' :
                trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};