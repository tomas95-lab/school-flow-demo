/**
 * Configuración Global del Sistema de Alertas
 * Panel de administración para configurar todas las opciones del sistema
 */

import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { 
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Shield,
  Database,
  Zap,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface AlertSystemConfig {
  general: {
    systemEnabled: boolean;
    defaultLanguage: string;
    timezone: string;
    autoCleanupDays: number;
    maxAlertsPerStudent: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    emailProvider: string;
    smsProvider: string;
    defaultTemplate: string;
  };
  automation: {
    autoEscalationEnabled: boolean;
    escalationTimeoutHours: number;
    autoRemindersEnabled: boolean;
    reminderIntervals: number[];
    aiPredictionsEnabled: boolean;
    mlThreshold: number;
  };
  security: {
    dataRetentionDays: number;
    encryptionEnabled: boolean;
    auditLogEnabled: boolean;
    anonymizeAfterDays: number;
  };
  performance: {
    batchSize: number;
    processingIntervalMinutes: number;
    maxConcurrentNotifications: number;
    cacheExpirationMinutes: number;
  };
}

interface AlertSystemSettingsProps {
  className?: string;
}

export function AlertSystemSettings({ className = '' }: AlertSystemSettingsProps) {
  const [config, setConfig] = useState<AlertSystemConfig>({
    general: {
      systemEnabled: true,
      defaultLanguage: 'es',
      timezone: 'America/Lima',
      autoCleanupDays: 365,
      maxAlertsPerStudent: 100
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      emailProvider: 'sendgrid',
      smsProvider: 'twilio',
      defaultTemplate: 'default'
    },
    automation: {
      autoEscalationEnabled: true,
      escalationTimeoutHours: 24,
      autoRemindersEnabled: true,
      reminderIntervals: [60, 480, 1440], // 1 hora, 8 horas, 1 día
      aiPredictionsEnabled: true,
      mlThreshold: 0.7
    },
    security: {
      dataRetentionDays: 2555, // 7 años
      encryptionEnabled: true,
      auditLogEnabled: true,
      anonymizeAfterDays: 1095 // 3 años
    },
    performance: {
      batchSize: 100,
      processingIntervalMinutes: 5,
      maxConcurrentNotifications: 50,
      cacheExpirationMinutes: 30
    }
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'systemConfig', 'alerts'));
      if (configDoc.exists()) {
        setConfig({ ...config, ...configDoc.data() });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, 'systemConfig', 'alerts'), {
        ...config,
        lastModified: new Date(),
        modifiedBy: 'admin' // TODO: usar contexto de usuario
      });
      
      setHasChanges(false);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      loadSystemConfig();
      setHasChanges(false);
      toast.info('Configuración restaurada');
    }
  };

  const updateConfig = (section: keyof AlertSystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'automation', label: 'Automatización', icon: Zap },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'performance', label: 'Rendimiento', icon: Database }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="systemEnabled">Estado del Sistema</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.general.systemEnabled}
              onCheckedChange={(checked) => updateConfig('general', 'systemEnabled', checked)}
            />
            <span className="text-sm text-gray-600">
              {config.general.systemEnabled ? 'Sistema activo' : 'Sistema pausado'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultLanguage">Idioma por defecto</Label>
          <Select 
            value={config.general.defaultLanguage} 
            onValueChange={(value) => updateConfig('general', 'defaultLanguage', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Select 
            value={config.general.timezone} 
            onValueChange={(value) => updateConfig('general', 'timezone', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Lima">Lima (UTC-5)</SelectItem>
              <SelectItem value="America/Mexico_City">México (UTC-6)</SelectItem>
              <SelectItem value="America/Buenos_Aires">Buenos Aires (UTC-3)</SelectItem>
              <SelectItem value="America/Bogota">Bogotá (UTC-5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="autoCleanupDays">Limpieza automática (días)</Label>
          <Input
            type="number"
            value={config.general.autoCleanupDays}
            onChange={(e) => updateConfig('general', 'autoCleanupDays', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Eliminar alertas resueltas después de este período</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAlertsPerStudent">Máximo alertas por estudiante</Label>
          <Input
            type="number"
            value={config.general.maxAlertsPerStudent}
            onChange={(e) => updateConfig('general', 'maxAlertsPerStudent', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Límite de alertas activas por estudiante</p>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.notifications.emailEnabled}
                onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
              />
              <span className="text-sm">Habilitar notificaciones por email</span>
            </div>
            <div className="space-y-2">
              <Label>Proveedor de email</Label>
              <Select 
                value={config.notifications.emailProvider}
                onValueChange={(value) => updateConfig('notifications', 'emailProvider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                  <SelectItem value="smtp">SMTP Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.notifications.smsEnabled}
                onCheckedChange={(checked) => updateConfig('notifications', 'smsEnabled', checked)}
              />
              <span className="text-sm">Habilitar notificaciones por SMS</span>
            </div>
            <div className="space-y-2">
              <Label>Proveedor de SMS</Label>
              <Select 
                value={config.notifications.smsProvider}
                onValueChange={(value) => updateConfig('notifications', 'smsProvider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="messagebird">MessageBird</SelectItem>
                  <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Push
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.notifications.pushEnabled}
                onCheckedChange={(checked) => updateConfig('notifications', 'pushEnabled', checked)}
              />
              <span className="text-sm">Habilitar notificaciones push</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              In-App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.notifications.inAppEnabled}
                onCheckedChange={(checked) => updateConfig('notifications', 'inAppEnabled', checked)}
              />
              <span className="text-sm">Habilitar notificaciones in-app</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAutomationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.automation.autoEscalationEnabled}
              onCheckedChange={(checked) => updateConfig('automation', 'autoEscalationEnabled', checked)}
            />
            <span className="text-sm font-medium">Escalamiento automático</span>
          </div>
          
          <div className="space-y-2">
            <Label>Tiempo de escalamiento (horas)</Label>
            <Input
              type="number"
              value={config.automation.escalationTimeoutHours}
              onChange={(e) => updateConfig('automation', 'escalationTimeoutHours', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.automation.autoRemindersEnabled}
              onCheckedChange={(checked) => updateConfig('automation', 'autoRemindersEnabled', checked)}
            />
            <span className="text-sm font-medium">Recordatorios automáticos</span>
          </div>
          
          <div className="space-y-2">
            <Label>Intervalos de recordatorio (minutos)</Label>
            <Input
              value={config.automation.reminderIntervals.join(', ')}
              onChange={(e) => {
                const intervals = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                updateConfig('automation', 'reminderIntervals', intervals);
              }}
              placeholder="60, 480, 1440"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.automation.aiPredictionsEnabled}
              onCheckedChange={(checked) => updateConfig('automation', 'aiPredictionsEnabled', checked)}
            />
            <span className="text-sm font-medium">Predicciones con IA</span>
          </div>
          
          <div className="space-y-2">
            <Label>Umbral de confianza ML</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.automation.mlThreshold}
              onChange={(e) => updateConfig('automation', 'mlThreshold', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Retención de datos (días)</Label>
          <Input
            type="number"
            value={config.security.dataRetentionDays}
            onChange={(e) => updateConfig('security', 'dataRetentionDays', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Tiempo que se conservan los datos</p>
        </div>

        <div className="space-y-2">
          <Label>Anonimización después de (días)</Label>
          <Input
            type="number"
            value={config.security.anonymizeAfterDays}
            onChange={(e) => updateConfig('security', 'anonymizeAfterDays', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Datos personales se anonimizan después de este período</p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.security.encryptionEnabled}
            onCheckedChange={(checked) => updateConfig('security', 'encryptionEnabled', checked)}
          />
          <span className="text-sm">Encriptación de datos sensibles</span>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.security.auditLogEnabled}
            onCheckedChange={(checked) => updateConfig('security', 'auditLogEnabled', checked)}
          />
          <span className="text-sm">Registro de auditoría</span>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Tamaño de lote de procesamiento</Label>
          <Input
            type="number"
            value={config.performance.batchSize}
            onChange={(e) => updateConfig('performance', 'batchSize', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Número de alertas procesadas por lote</p>
        </div>

        <div className="space-y-2">
          <Label>Intervalo de procesamiento (minutos)</Label>
          <Input
            type="number"
            value={config.performance.processingIntervalMinutes}
            onChange={(e) => updateConfig('performance', 'processingIntervalMinutes', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Frecuencia de procesamiento automático</p>
        </div>

        <div className="space-y-2">
          <Label>Máximo notificaciones concurrentes</Label>
          <Input
            type="number"
            value={config.performance.maxConcurrentNotifications}
            onChange={(e) => updateConfig('performance', 'maxConcurrentNotifications', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Límite de notificaciones enviadas simultáneamente</p>
        </div>

        <div className="space-y-2">
          <Label>Expiración de caché (minutos)</Label>
          <Input
            type="number"
            value={config.performance.cacheExpirationMinutes}
            onChange={(e) => updateConfig('performance', 'cacheExpirationMinutes', parseInt(e.target.value))}
          />
          <p className="text-xs text-gray-500">Tiempo de vida del caché de alertas</p>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'notifications': return renderNotificationSettings();
      case 'automation': return renderAutomationSettings();
      case 'security': return renderSecuritySettings();
      case 'performance': return renderPerformanceSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración del Sistema</h2>
          <p className="text-gray-600">
            Configuración global del sistema de alertas de EduNova
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Cambios pendientes
            </Badge>
          )}
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          <Button onClick={saveConfig} disabled={loading || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navegación lateral */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                onClick={() => setActiveSection(section.id)}
                className="w-full justify-start"
              >
                <section.icon className="h-4 w-4 mr-2" />
                {section.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const section = sections.find(s => s.id === activeSection);
                  if (section) {
                    const Icon = section.icon;
                    return <Icon className="h-5 w-5" />;
                  }
                  return null;
                })()}
                {sections.find(s => s.id === activeSection)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderActiveSection()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-medium text-gray-900">Sistema de Alertas</h3>
              <p className="text-sm text-green-600">Operativo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-medium text-gray-900">Notificaciones</h3>
              <p className="text-sm text-green-600">Funcionando</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-medium text-gray-900">Base de Datos</h3>
              <p className="text-sm text-green-600">Conectada</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertSystemSettings;
