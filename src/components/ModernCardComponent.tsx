import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ModernCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export function ModernCardComponent({
  title,
  value,
  description,
  trend,
  icon,
  variant = 'default',
  size = 'md',
  interactive = false,
  onClick,
  status
}: ModernCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg',
    glass: 'bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl',
    minimal: 'bg-gray-50 border-0 shadow-none hover:bg-gray-100'
  };

  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    error: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Award className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card 
      className={`
        transition-all duration-300 ease-in-out
        ${variantClasses[variant]}
        ${interactive ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1' : ''}
        ${status ? `border-l-4 ${statusColors[status]}` : ''}
        group
      `}
      onClick={interactive ? onClick : undefined}
    >
      <CardHeader className={`${sizeClasses[size]} pb-2`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className={`
                p-2 rounded-xl transition-colors duration-200
                ${variant === 'gradient' ? 'bg-white/80' : 'bg-gray-100'}
                group-hover:bg-blue-100 group-hover:text-blue-600
              `}>
                {icon}
              </div>
            )}
            <div>
              <CardTitle className={`
                font-semibold transition-colors duration-200
                ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}
                group-hover:text-blue-600
              `}>
                {title}
              </CardTitle>
              {status && (
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon()}
                  <span className={`text-xs font-medium ${statusColors[status].split(' ')[0]}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {interactive && (
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
          )}
        </div>
      </CardHeader>

      <CardContent className={`${sizeClasses[size]} pt-0`}>
        <div className="space-y-3">
          {/* Valor principal */}
          <div className="flex items-baseline space-x-2">
            <span className={`
              font-bold transition-colors duration-200
              ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}
              ${variant === 'gradient' ? 'text-blue-700' : 'text-gray-900'}
              group-hover:text-blue-600
            `}>
              {value}
            </span>
            
            {trend && (
              <div className={`
                flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                ${trend.isPositive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
                }
              `}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>

          {/* Descripción */}
          {description && (
            <p className={`
              text-gray-600 transition-colors duration-200
              ${size === 'sm' ? 'text-xs' : 'text-sm'}
              group-hover:text-gray-700
            `}>
              {description}
            </p>
          )}

          {/* Trend label */}
          {trend && (
            <p className="text-xs text-gray-500">
              {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de demostración con múltiples variantes
export function ModernCardsShowcase() {
  const cards = [
    {
      title: 'Estudiantes Activos',
      value: 1247,
      description: 'Total de estudiantes registrados',
      icon: <Users className="h-5 w-5" />,
      trend: { value: 12, isPositive: true, label: 'vs. mes anterior' },
      variant: 'gradient' as const,
      status: 'success' as const
    },
    {
      title: 'Promedio General',
      value: '8.4',
      description: 'Calificación promedio institucional',
      icon: <BookOpen className="h-5 w-5" />,
      trend: { value: 3, isPositive: true, label: 'mejora este trimestre' },
      variant: 'glass' as const,
      status: 'info' as const
    },
    {
      title: 'Asistencia',
      value: '94%',
      description: 'Porcentaje de asistencia mensual',
      icon: <Calendar className="h-5 w-5" />,
      trend: { value: 2, isPositive: false, label: 'vs. mes anterior' },
      variant: 'default' as const,
      status: 'warning' as const
    },
    {
      title: 'Alertas Críticas',
      value: 23,
      description: 'Requieren atención inmediata',
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: 'minimal' as const,
      status: 'error' as const,
      interactive: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Componentes de Diseño Modernos</h2>
        <p className="text-gray-600">
          Nuevos componentes con diseño actualizado, animaciones suaves y mejor UX
        </p>
      </div>

      {/* Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <ModernCardComponent
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
            trend={card.trend}
            variant={card.variant}
            status={card.status}
            interactive={card.interactive}
            onClick={card.interactive ? () => console.log(`Clicked ${card.title}`) : undefined}
          />
        ))}
      </div>

      {/* Ejemplos de diferentes tamaños */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Variantes de Tamaño</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModernCardComponent
            title="Pequeña"
            value="42"
            description="Componente compacto"
            icon={<Award className="h-4 w-4" />}
            size="sm"
            variant="minimal"
          />
          <ModernCardComponent
            title="Mediana"
            value="142"
            description="Tamaño estándar recomendado"
            icon={<CheckCircle className="h-5 w-5" />}
            size="md"
            variant="default"
          />
          <ModernCardComponent
            title="Grande"
            value="1,247"
            description="Para métricas principales destacadas"
            icon={<TrendingUp className="h-6 w-6" />}
            size="lg"
            variant="gradient"
          />
        </div>
      </div>
    </div>
  );
}

export default ModernCardComponent;
