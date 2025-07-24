import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Info,
  Brain,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { ObservacionGenerada, ObservacionLimpia } from '@/utils/observacionesAutomaticas';

interface ObservacionAutomaticaProps {
  observacion: ObservacionGenerada | ObservacionLimpia;
  showDetails?: boolean;
  className?: string;
}

export default function ObservacionAutomatica({ 
  observacion, 
  showDetails = false,
  className = "" 
}: ObservacionAutomaticaProps) {
  
  const getIcon = () => {
    switch (observacion.tipo) {
      case 'rendimiento':
        return <BarChart3 className="h-4 w-4" />;
      case 'tendencia':
        return observacion.datosSoporte.tendencia === 'mejora' ? 
          <TrendingUp className="h-4 w-4" /> : 
          <TrendingDown className="h-4 w-4" />;
      case 'asistencia':
        // Iconos más específicos para asistencia según el mensaje
        if (observacion.texto.includes('perfecta') || observacion.texto.includes('Felicitaciones')) {
          return <CheckCircle className="h-4 w-4" />;
        } else if (observacion.texto.includes('críticas') || observacion.texto.includes('urgente')) {
          return <XCircle className="h-4 w-4" />;
        } else if (observacion.texto.includes('mejora')) {
          return <TrendingUp className="h-4 w-4" />;
        } else {
          return <Calendar className="h-4 w-4" />;
        }
      case 'excelencia':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = () => {
    switch (observacion.prioridad) {
      case 'alta':
        return 'destructive' as const;
      case 'media':
        return 'secondary' as const;
      case 'baja':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getCardVariant = () => {
    switch (observacion.tipo) {
      case 'rendimiento':
        return 'border-red-200 bg-red-50';
      case 'tendencia':
        return observacion.datosSoporte.tendencia === 'mejora' ? 
          'border-green-200 bg-green-50' : 
          'border-orange-200 bg-orange-50';
      case 'asistencia':
        // Colores más específicos para asistencia según el mensaje
        if (observacion.texto.includes('perfecta') || observacion.texto.includes('Felicitaciones')) {
          return 'border-green-200 bg-green-50';
        } else if (observacion.texto.includes('críticas') || observacion.texto.includes('urgente')) {
          return 'border-red-200 bg-red-50';
        } else if (observacion.texto.includes('mejora')) {
          return 'border-blue-200 bg-blue-50';
        } else {
          return 'border-yellow-200 bg-yellow-50';
        }
      case 'excelencia':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={`${getCardVariant()} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-medium">
              Observación Automática
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              IA Generada
            </Badge>
            <Badge variant={getBadgeVariant()} className="text-xs">
              {observacion.prioridad.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3">
          {observacion.texto}
        </p>
        
        {showDetails && (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Promedio actual:</span>
              <span className="font-medium">{observacion.datosSoporte.promedioActual.toFixed(1)}</span>
            </div>
            
            {observacion.datosSoporte.promedioAnterior && (
              <div className="flex items-center justify-between">
                <span>Promedio anterior:</span>
                <span className="font-medium">{observacion.datosSoporte.promedioAnterior.toFixed(1)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span>Ausencias:</span>
              <span className="font-medium">{observacion.datosSoporte.ausencias}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Tendencia:</span>
              <span className="font-medium capitalize">
                {observacion.datosSoporte.tendencia.replace('_', ' ')}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-500">
                Regla aplicada: {observacion.reglaAplicada.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para mostrar múltiples observaciones
interface ObservacionesAutomaticasProps {
  observaciones: (ObservacionGenerada | ObservacionLimpia)[];
  showDetails?: boolean;
  className?: string;
}

export function ObservacionesAutomaticas({ 
  observaciones, 
  showDetails = false,
  className = "" 
}: ObservacionesAutomaticasProps) {
  
  if (!observaciones.length) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No hay observaciones automáticas disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {observaciones.map((observacion, index) => (
        <ObservacionAutomatica
          key={`${observacion.reglaAplicada}-${index}`}
          observacion={observacion}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
}

// Componente compacto para mostrar en tablas o listas
interface ObservacionCompactaProps {
  observacion: ObservacionGenerada | ObservacionLimpia;
  className?: string;
}

export function ObservacionCompacta({ observacion, className = "" }: ObservacionCompactaProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="text-xs">
        <Brain className="h-3 w-3 mr-1" />
        IA
      </Badge>
      <span className="text-sm text-gray-700 truncate" title={observacion.texto}>
        {observacion.texto}
      </span>
    </div>
  );
} 
