import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings, 
  Brain, 
  BookOpen, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

interface UmbralesIA {
  // Umbrales de rendimiento académico
  rendimientoCritico: number;          // Promedio < X es crítico
  rendimientoBajo: number;             // Promedio entre X y Y es bajo
  rendimientoExcelente: number;        // Promedio > X es excelente

  // Umbrales de asistencia
  asistenciaCritica: number;           // Asistencia < X% es crítica
  asistenciaBaja: number;              // Asistencia entre X% y Y% es baja
  maxAusenciasCriticas: number;        // Más de X ausencias es crítico
  maxAusenciasBajas: number;           // Más de X ausencias es preocupante

  // Umbrales de tendencias
  tendenciaNegativaMinima: number;     // Descenso > X puntos en promedio
  mejoraSignificativa: number;         // Mejora > X puntos en promedio
  
  // Umbrales de materias en riesgo
  materiasEnRiesgoMinimas: number;     // Cantidad mínima de materias en riesgo

  // Configuraciones adicionales
  diasAnalisisRendimiento: number;     // Días a considerar para análisis
  frecuenciaRevisionAlertas: number;   // Horas entre revisiones automáticas
}

const UMBRALES_DEFAULT: UmbralesIA = {
  rendimientoCritico: 5.0,
  rendimientoBajo: 6.0,
  rendimientoExcelente: 8.5,
  asistenciaCritica: 70,
  asistenciaBaja: 80,
  maxAusenciasCriticas: 5,
  maxAusenciasBajas: 3,
  tendenciaNegativaMinima: 1.0,
  mejoraSignificativa: 1.0,
  materiasEnRiesgoMinimas: 2,
  diasAnalisisRendimiento: 30,
  frecuenciaRevisionAlertas: 24
};

export default function ConfiguracionIAPanel() {
  const [umbrales, setUmbrales] = useState<UmbralesIA>(UMBRALES_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'configuracion', 'umbralesIA'));
        if (configDoc.exists()) {
          const data = configDoc.data() as UmbralesIA;
          setUmbrales({ ...UMBRALES_DEFAULT, ...data });
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoadingData(false);
      }
    };

    cargarConfiguracion();
  }, []);

  const handleChange = (campo: keyof UmbralesIA, valor: string) => {
    const valorNumerico = parseFloat(valor) || 0;
    setUmbrales(prev => ({
      ...prev,
      [campo]: valorNumerico
    }));
    setHasChanges(true);
  };

  const guardarConfiguracion = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'configuracion', 'umbralesIA'), umbrales, { merge: true });
      
      toast.success('Configuración guardada exitosamente', {
        description: 'Los nuevos umbrales se aplicarán en la próxima generación de alertas.'
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const restaurarDefaults = () => {
    setUmbrales(UMBRALES_DEFAULT);
    setHasChanges(true);
    toast.info('Valores por defecto restaurados', {
      description: 'Recuerda guardar los cambios para aplicarlos.'
    });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Configuración de IA
          </h1>
          <p className="text-gray-600 mt-1">
            Personaliza los umbrales para la generación automática de alertas inteligentes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={restaurarDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Defaults
          </Button>
          
          <Button
            onClick={guardarConfiguracion}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Tienes cambios sin guardar. Los nuevos umbrales se aplicarán después de guardar.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuración de Rendimiento Académico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Umbrales de Rendimiento Académico
          </CardTitle>
          <CardDescription>
            Define los límites para clasificar el rendimiento de los estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rendimientoCritico" className="text-sm font-medium">
                Rendimiento Crítico
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="rendimientoCritico"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={umbrales.rendimientoCritico}
                  onChange={(e) => handleChange('rendimientoCritico', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">o menos</span>
                <Badge variant="destructive" className="text-xs">Crítico</Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="rendimientoBajo" className="text-sm font-medium">
                Rendimiento Bajo
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Entre</span>
                <Input
                  id="rendimientoBajo"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={umbrales.rendimientoBajo}
                  onChange={(e) => handleChange('rendimientoBajo', e.target.value)}
                  className="w-20"
                />
                <Badge className="text-xs bg-orange-100 text-orange-800">Alto</Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="rendimientoExcelente" className="text-sm font-medium">
                Rendimiento Excelente
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="rendimientoExcelente"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={umbrales.rendimientoExcelente}
                  onChange={(e) => handleChange('rendimientoExcelente', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">o más</span>
                <Badge className="text-xs bg-green-100 text-green-800">Excelente</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Asistencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Umbrales de Asistencia
          </CardTitle>
          <CardDescription>
            Configura los límites para detectar problemas de asistencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Porcentaje de Asistencia</h4>
              
              <div>
                <Label htmlFor="asistenciaCritica" className="text-sm font-medium">
                  Asistencia Crítica
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="asistenciaCritica"
                    type="number"
                    min="0"
                    max="100"
                    value={umbrales.asistenciaCritica}
                    onChange={(e) => handleChange('asistenciaCritica', e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">% o menos</span>
                  <Badge variant="destructive" className="text-xs">Crítico</Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="asistenciaBaja" className="text-sm font-medium">
                  Asistencia Baja
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">Entre</span>
                  <Input
                    id="asistenciaBaja"
                    type="number"
                    min="0"
                    max="100"
                    value={umbrales.asistenciaBaja}
                    onChange={(e) => handleChange('asistenciaBaja', e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <Badge className="text-xs bg-orange-100 text-orange-800">Alto</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Cantidad de Ausencias</h4>
              
              <div>
                <Label htmlFor="maxAusenciasCriticas" className="text-sm font-medium">
                  Ausencias Críticas
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="maxAusenciasCriticas"
                    type="number"
                    min="1"
                    value={umbrales.maxAusenciasCriticas}
                    onChange={(e) => handleChange('maxAusenciasCriticas', e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">o más ausencias</span>
                </div>
              </div>

              <div>
                <Label htmlFor="maxAusenciasBajas" className="text-sm font-medium">
                  Ausencias Preocupantes
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="maxAusenciasBajas"
                    type="number"
                    min="1"
                    value={umbrales.maxAusenciasBajas}
                    onChange={(e) => handleChange('maxAusenciasBajas', e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">o más ausencias</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Umbrales de Tendencias
          </CardTitle>
          <CardDescription>
            Define los cambios significativos en el rendimiento estudiantil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="tendenciaNegativaMinima" className="text-sm font-medium">
                Tendencia Negativa Mínima
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <Input
                  id="tendenciaNegativaMinima"
                  type="number"
                  step="0.1"
                  min="0"
                  value={umbrales.tendenciaNegativaMinima}
                  onChange={(e) => handleChange('tendenciaNegativaMinima', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">puntos de descenso</span>
              </div>
            </div>

            <div>
              <Label htmlFor="mejoraSignificativa" className="text-sm font-medium">
                Mejora Significativa
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <Input
                  id="mejoraSignificativa"
                  type="number"
                  step="0.1"
                  min="0"
                  value={umbrales.mejoraSignificativa}
                  onChange={(e) => handleChange('mejoraSignificativa', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">puntos de mejora</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración Avanzada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Configuración Avanzada
          </CardTitle>
          <CardDescription>
            Parámetros adicionales para el funcionamiento de la IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="materiasEnRiesgoMinimas" className="text-sm font-medium">
                Materias en Riesgo
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="materiasEnRiesgoMinimas"
                  type="number"
                  min="1"
                  value={umbrales.materiasEnRiesgoMinimas}
                  onChange={(e) => handleChange('materiasEnRiesgoMinimas', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">o más materias</span>
              </div>
            </div>

            <div>
              <Label htmlFor="diasAnalisisRendimiento" className="text-sm font-medium">
                Período de Análisis
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="diasAnalisisRendimiento"
                  type="number"
                  min="1"
                  value={umbrales.diasAnalisisRendimiento}
                  onChange={(e) => handleChange('diasAnalisisRendimiento', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">días</span>
              </div>
            </div>

            <div>
              <Label htmlFor="frecuenciaRevisionAlertas" className="text-sm font-medium">
                Frecuencia de Revisión
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="frecuenciaRevisionAlertas"
                  type="number"
                  min="1"
                  value={umbrales.frecuenciaRevisionAlertas}
                  onChange={(e) => handleChange('frecuenciaRevisionAlertas', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">horas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Footer con información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Información Importante</h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• Los cambios se aplicarán en la próxima generación automática de alertas</li>
              <li>• Se recomienda probar los umbrales en un período de prueba antes de aplicarlos definitivamente</li>
              <li>• Los valores muy restrictivos pueden generar demasiadas alertas, mientras que los muy permisivos pueden omitir casos importantes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportar también los umbrales para uso en otros componentes
export { UMBRALES_DEFAULT };
export type { UmbralesIA };
