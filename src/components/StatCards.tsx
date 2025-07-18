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
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "text-green-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" }
  };

  const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col border border-gray-100">
      {/* Header section con icon, label y trend - altura fija */}
      <div className="flex items-start justify-around">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <p className="text-sm font-semibold text-gray-700 leading-tight break-words flex-1">{label}</p>
        </div>
        {trend && (
          <div className={`text-xs px-2.5 py-1.5 rounded-full flex-shrink-0 font-medium shadow-sm ml-2 ${
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
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
