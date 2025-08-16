import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Settings, 
  Users, 
  Bell,
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
// import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { UITranslations } from '@/config/translations';

interface ConfiguracionComunicacion {
  emailNotificaciones: boolean;
  smsNotificaciones: boolean;
  notificacionesAlertas: boolean;
  notificacionesBoletines: boolean;
  notificacionesAsistencia: boolean;
  
  // Umbrales para notificaciones automáticas
  notificarAlertasCriticas: boolean;
  notificarAlertasAltas: boolean;
  notificarAusenciasConsecutivas: number;
  notificarPromedioMenorA: number;
  
  // Configuración de mensajes
  mensajePersonalizadoEmail: string;
  mensajePersonalizadoSMS: string;
  
  // Horarios de envío
  horaInicioNotificaciones: string;
  horaFinNotificaciones: string;
  
  // Frecuencia
  frecuenciaNotificaciones: 'inmediata' | 'diaria' | 'semanal';
}

interface NotificacionFamilia {
  id: string;
  studentId: string;
  studentName: string;
  parentEmail?: string;
  parentPhone?: string;
  tipo: 'alerta' | 'boletin' | 'asistencia' | 'general';
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  canalEnvio: 'email' | 'sms' | 'ambos';
  fechaEnvio: Date;
  estado: 'pendiente' | 'enviado' | 'error' | 'leido';
  intentos: number;
  errorMessage?: string;
}

const CONFIGURACION_DEFAULT: ConfiguracionComunicacion = {
  emailNotificaciones: true,
  smsNotificaciones: false,
  notificacionesAlertas: true,
  notificacionesBoletines: true,
  notificacionesAsistencia: true,
  notificarAlertasCriticas: true,
  notificarAlertasAltas: true,
  notificarAusenciasConsecutivas: 3,
  notificarPromedioMenorA: 6.0,
  mensajePersonalizadoEmail: 'Estimada familia, le informamos sobre el progreso académico de su hijo/a.',
  mensajePersonalizadoSMS: 'Alerta académica: {studentName}. Contacte la institución.',
  horaInicioNotificaciones: '08:00',
  horaFinNotificaciones: '20:00',
  frecuenciaNotificaciones: 'inmediata'
};

export default function ComunicacionFamiliasPanel() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionComunicacion>(CONFIGURACION_DEFAULT);
  const [notificaciones, setNotificaciones] = useState<NotificacionFamilia[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'configuracion' | 'historial' | 'plantillas'>('configuracion');

  // Datos de estudiantes para notificaciones
  // const { data: students } = useFirestoreCollection('students');

  // Cargar configuración y notificaciones
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar configuración
        const configDoc = await getDoc(doc(db, 'configuracion', 'comunicacionFamilias'));
        if (configDoc.exists()) {
          setConfiguracion({ ...CONFIGURACION_DEFAULT, ...configDoc.data() });
        }

        // Cargar historial de notificaciones recientes
        const notificacionesQuery = query(
          collection(db, 'notificacionesFamilias'),
          orderBy('fechaEnvio', 'desc'),
          limit(50)
        );
        const notificacionesSnapshot = await getDocs(notificacionesQuery);
        const notificacionesData = notificacionesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fechaEnvio: doc.data().fechaEnvio?.toDate() || new Date()
        })) as NotificacionFamilia[];
        
        setNotificaciones(notificacionesData);
      } catch (error) {
        console.error('Error cargando datos de comunicación:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, []);

  const handleConfigChange = (campo: keyof ConfiguracionComunicacion, valor: any) => {
    setConfiguracion(prev => ({
      ...prev,
      [campo]: valor
    }));
    setHasChanges(true);
  };

  const guardarConfiguracion = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'configuracion', 'comunicacionFamilias'), configuracion, { merge: true });
      
      toast.success('Configuración guardada exitosamente', {
        description: 'Las notificaciones automáticas se aplicarán con la nueva configuración.'
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };


  const eliminarNotificacion = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notificacionesFamilias', notificationId));
      setNotificaciones(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      toast.error('Error al eliminar la notificación');
    }
  };

  const getEstadoColor = (estado: NotificacionFamilia['estado']) => {
    switch (estado) {
      case 'enviado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'leido': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <Users className="h-6 w-6 text-blue-600" />
            Comunicación con Familias
          </h1>
          <p className="text-gray-600 mt-1">
            Configure notificaciones automáticas y gestione la comunicación con padres y tutores
          </p>
        </div>
        
        {activeTab === 'configuracion' && (
          <Button
            onClick={guardarConfiguracion}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        )}
      </div>

      {hasChanges && activeTab === 'configuracion' && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Tienes cambios sin guardar en la configuración de comunicación.
          </AlertDescription>
        </Alert>
      )}

      {/* Navegación por tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'configuracion', label: 'Configuración', icon: Settings },
            { id: 'historial', label: 'Historial', icon: MessageSquare },
            { id: 'plantillas', label: 'Plantillas', icon: Edit }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido por tabs */}
      {activeTab === 'configuracion' && (
        <div className="space-y-6">
          {/* Configuración de Canales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-600" />
                Canales de Comunicación
              </CardTitle>
              <CardDescription>
                Configure los métodos de comunicación disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="font-medium">Notificaciones por Email</Label>
                      <p className="text-sm text-gray-600">Enviar alertas por correo electrónico</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracion.emailNotificaciones}
                    onCheckedChange={(value: boolean) => handleConfigChange('emailNotificaciones', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="font-medium">Notificaciones por SMS</Label>
                      <p className="text-sm text-gray-600">Enviar alertas por mensaje de texto</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracion.smsNotificaciones}
                    onCheckedChange={(value: boolean) => handleConfigChange('smsNotificaciones', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Tipos de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Tipos de Notificaciones
              </CardTitle>
              <CardDescription>
                Seleccione qué eventos deben generar notificaciones automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Alertas Académicas</Label>
                  <Switch
                    checked={configuracion.notificacionesAlertas}
                    onCheckedChange={(value: boolean) => handleConfigChange('notificacionesAlertas', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Boletines Generados</Label>
                  <Switch
                    checked={configuracion.notificacionesBoletines}
                    onCheckedChange={(value: boolean) => handleConfigChange('notificacionesBoletines', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Problemas de Asistencia</Label>
                  <Switch
                    checked={configuracion.notificacionesAsistencia}
                    onCheckedChange={(value: boolean) => handleConfigChange('notificacionesAsistencia', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Umbrales de Notificación</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ausencias">Ausencias Consecutivas</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="ausencias"
                        type="number"
                        min="1"
                        max="10"
                        value={configuracion.notificarAusenciasConsecutivas}
                        onChange={(e) => handleConfigChange('notificarAusenciasConsecutivas', parseInt(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">o más días</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="promedio">Promedio Mínimo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="promedio"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={configuracion.notificarPromedioMenorA}
                        onChange={(e) => handleConfigChange('notificarPromedioMenorA', parseFloat(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">puntos</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Configuración de Envío
              </CardTitle>
              <CardDescription>
                Defina cuándo y con qué frecuencia enviar las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="horaInicio">Hora de Inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={configuracion.horaInicioNotificaciones}
                    onChange={(e) => handleConfigChange('horaInicioNotificaciones', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="horaFin">Hora de Fin</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={configuracion.horaFinNotificaciones}
                    onChange={(e) => handleConfigChange('horaFinNotificaciones', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="frecuencia">Frecuencia</Label>
                  <select
                    id="frecuencia"
                    value={configuracion.frecuenciaNotificaciones}
                    onChange={(e) => handleConfigChange('frecuenciaNotificaciones', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inmediata">Inmediata</option>
                    <option value="diaria">Diaria</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Historial de Notificaciones</h3>
            <Badge variant="outline">
              {notificaciones.length} notificaciones
            </Badge>
          </div>

          <div className="space-y-3">
            {notificaciones.map((notificacion) => (
              <Card key={notificacion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{notificacion.titulo}</h4>
                        <Badge className={getEstadoColor(notificacion.estado)}>
                          {notificacion.estado}
                        </Badge>
                        <Badge variant="outline">
                          {UITranslations.getPriorityLabel(notificacion.prioridad)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Estudiante:</strong> {notificacion.studentName} | 
                        <strong> Canal:</strong> {notificacion.canalEnvio} | 
                        <strong> Fecha:</strong> {notificacion.fechaEnvio.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-800">{notificacion.mensaje}</p>
                      {notificacion.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Error:</strong> {notificacion.errorMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Implementar vista detallada */}}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarNotificacion(notificacion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plantillas' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Mensajes</CardTitle>
              <CardDescription>
                Personalice los mensajes que se envían a las familias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mensajeEmail">Plantilla de Email</Label>
                <Textarea
                  id="mensajeEmail"
                  value={configuracion.mensajePersonalizadoEmail}
                  onChange={(e) => handleConfigChange('mensajePersonalizadoEmail', e.target.value)}
                  rows={4}
                  placeholder="Estimada familia..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables disponibles: {'{studentName}'}, {'{alertType}'}, {'{date}'}
                </p>
              </div>

              <div>
                <Label htmlFor="mensajeSMS">Plantilla de SMS</Label>
                <Textarea
                  id="mensajeSMS"
                  value={configuracion.mensajePersonalizadoSMS}
                  onChange={(e) => handleConfigChange('mensajePersonalizadoSMS', e.target.value)}
                  rows={2}
                  placeholder="Alerta: {studentName}..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 160 caracteres. Variables: {'{studentName}'}, {'{alertType}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
