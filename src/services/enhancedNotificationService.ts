/**
 * Servicio Mejorado de Notificaciones Multi-Canal
 * Sistema completo de notificaciones con múltiples canales, templates y seguimiento
 */

import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// === INTERFACES ===

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp';
  enabled: boolean;
  config: {
    apiKey?: string;
    endpoint?: string;
    template?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  content: string;
  variables: string[];
  enabled: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  triggerEvent: 'alert_created' | 'alert_escalated' | 'alert_resolved' | 'reminder' | 'deadline';
  conditions: {
    alertType?: string[];
    priority?: string[];
    roles?: string[];
    timeDelay?: number; // minutos
  };
  channels: NotificationChannel[];
  template?: string;
  enabled: boolean;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  recipientId: string;
  recipientType: 'user' | 'parent' | 'teacher' | 'admin';
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  attempts: number;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface NotificationBatch {
  id: string;
  alertId: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// === SERVICIO PRINCIPAL ===

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  
  private constructor() {}

  public static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  // === GESTIÓN DE NOTIFICACIONES ===

  /**
   * Procesa una alerta y envía notificaciones según las reglas configuradas
   */
  async processAlertNotification(alertId: string, alertData: any): Promise<string> {
    try {
      // Obtener reglas activas que aplican a esta alerta
      const applicableRules = await this.getApplicableRules(alertData);
      
      if (applicableRules.length === 0) {
        console.log('No hay reglas aplicables para esta alerta');
        return '';
      }

      // Crear batch de notificaciones
      const batch = await this.createNotificationBatch(alertId, applicableRules);

      // Procesar cada regla
      for (const rule of applicableRules) {
        await this.processNotificationRule(alertId, alertData, rule, batch.id);
      }

      // Actualizar estado del batch
      await this.updateBatchStatus(batch.id);

      return batch.id;
    } catch (error) {
      console.error('Error procesando notificaciones:', error);
      throw error;
    }
  }

  /**
   * Envía una notificación personalizada
   */
  async sendCustomNotification(
    recipients: string[], 
    content: string, 
    channels: string[],
    options: {
      subject?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      template?: string;
      scheduledFor?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const notificationData = {
        type: 'custom',
        content,
        recipients,
        channels,
        subject: options.subject || 'Notificación EduNova',
        priority: options.priority || 'normal',
        template: options.template,
        scheduledFor: options.scheduledFor,
        metadata: options.metadata || {},
        status: 'pending',
        createdAt: new Date(),
        createdBy: 'system' // TODO: usar contexto de usuario
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      
      // Si no está programada, enviar inmediatamente
      if (!options.scheduledFor) {
        await this.deliverNotification(docRef.id, notificationData);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error enviando notificación personalizada:', error);
      throw error;
    }
  }

  /**
   * Programa recordatorios automáticos
   */
  async scheduleReminders(
    alertId: string,
    intervals: number[], // minutos después de la creación
    template?: string
  ): Promise<string[]> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) throw new Error('Alerta no encontrada');

      const reminderIds: string[] = [];
      
      for (const interval of intervals) {
        const scheduledFor = new Date(alert.createdAt.getTime() + interval * 60 * 1000);
        
        const reminderId = await this.sendCustomNotification(
          [alert.createdBy], // Enviar al creador de la alerta
          `Recordatorio: La alerta "${alert.title}" sigue pendiente de resolución.`,
          ['in_app', 'email'],
          {
            subject: 'Recordatorio de Alerta Pendiente',
            priority: 'normal',
            template,
            scheduledFor,
            metadata: { type: 'reminder', alertId, interval }
          }
        );
        
        reminderIds.push(reminderId);
      }

      return reminderIds;
    } catch (error) {
      console.error('Error programando recordatorios:', error);
      throw error;
    }
  }

  // === GESTIÓN DE TEMPLATES ===

  /**
   * Crea o actualiza un template de notificación
   */
  async saveNotificationTemplate(template: Partial<NotificationTemplate>): Promise<string> {
    try {
      if (template.id) {
        await updateDoc(doc(db, 'notificationTemplates', template.id), {
          ...template,
          lastModified: new Date()
        });
        return template.id;
      } else {
        const docRef = await addDoc(collection(db, 'notificationTemplates'), {
          ...template,
          createdAt: new Date(),
          lastModified: new Date()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error guardando template:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los templates disponibles
   */
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    try {
      const templatesQuery = query(
        collection(db, 'notificationTemplates'),
        where('enabled', '==', true),
        orderBy('name')
      );
      
      const snapshot = await getDocs(templatesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationTemplate));
    } catch (error) {
      console.error('Error obteniendo templates:', error);
      return [];
    }
  }

  // === ANALYTICS Y REPORTES ===

  /**
   * Obtiene estadísticas de entrega de notificaciones
   */
  async getDeliveryStats(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    readRate: number;
    channelStats: Record<string, number>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day': startDate.setDate(endDate.getDate() - 1); break;
        case 'week': startDate.setDate(endDate.getDate() - 7); break;
        case 'month': startDate.setMonth(endDate.getMonth() - 1); break;
      }

      const deliveriesQuery = query(
        collection(db, 'notificationDeliveries'),
        where('sentAt', '>=', startDate),
        where('sentAt', '<=', endDate)
      );

      const snapshot = await getDocs(deliveriesQuery);
      const deliveries = snapshot.docs.map(doc => doc.data() as NotificationDelivery);

      const stats = {
        total: deliveries.length,
        sent: deliveries.filter(d => d.status !== 'pending').length,
        delivered: deliveries.filter(d => d.status === 'delivered' || d.status === 'read').length,
        failed: deliveries.filter(d => d.status === 'failed').length,
        readRate: 0,
        channelStats: {} as Record<string, number>,
        hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
      };

      // Calcular tasa de lectura
      const readCount = deliveries.filter(d => d.status === 'read').length;
      stats.readRate = stats.delivered > 0 ? (readCount / stats.delivered) * 100 : 0;

      // Estadísticas por canal
      deliveries.forEach(delivery => {
        stats.channelStats[delivery.channel] = (stats.channelStats[delivery.channel] || 0) + 1;
        
        // Distribución horaria
        if (delivery.sentAt) {
          const hour = delivery.sentAt.getHours();
          stats.hourlyDistribution[hour].count++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de entrega:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de notificaciones de un usuario
   */
  async getUserNotificationHistory(
    userId: string, 
    limitCount: number = 50
  ): Promise<NotificationDelivery[]> {
    try {
      const historyQuery = query(
        collection(db, 'notificationDeliveries'),
        where('recipientId', '==', userId),
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationDelivery));
    } catch (error) {
      console.error('Error obteniendo historial de notificaciones:', error);
      return [];
    }
  }

  // === MÉTODOS PRIVADOS ===

  private async getApplicableRules(alertData: any): Promise<NotificationRule[]> {
    try {
      const rulesQuery = query(
        collection(db, 'notificationRules'),
        where('enabled', '==', true)
      );
      
      const snapshot = await getDocs(rulesQuery);
      const allRules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationRule));

      // Filtrar reglas que aplican a esta alerta
      return allRules.filter(rule => {
        const conditions = rule.conditions;
        
        // Verificar tipo de alerta
        if (conditions.alertType && !conditions.alertType.includes(alertData.type)) {
          return false;
        }
        
        // Verificar prioridad
        if (conditions.priority && !conditions.priority.includes(alertData.priority)) {
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error obteniendo reglas aplicables:', error);
      return [];
    }
  }

  private async createNotificationBatch(alertId: string, rules: NotificationRule[]): Promise<NotificationBatch> {
    try {
      const estimatedRecipients = rules.reduce((sum, rule) => sum + (rule.conditions.roles?.length || 1), 0);
      
      const batchData: Partial<NotificationBatch> = {
        alertId,
        totalRecipients: estimatedRecipients,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        status: 'processing',
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'notificationBatches'), batchData);
      return { id: docRef.id, ...batchData } as NotificationBatch;
    } catch (error) {
      console.error('Error creando batch de notificaciones:', error);
      throw error;
    }
  }

  private async processNotificationRule(
    _alertId: string, 
    alertData: any, 
    rule: NotificationRule, 
    batchId: string
  ): Promise<void> {
    try {
      // Obtener destinatarios según los roles especificados
      const recipients = await this.getRecipientsByRoles(rule.conditions.roles || [], alertData);
      
      // Obtener template si está especificado
      let content = `Nueva alerta: ${alertData.title}`;
      if (rule.template) {
        const template = await this.getTemplate(rule.template);
        content = this.interpolateTemplate(template?.content || content, alertData);
      }

      // Enviar a cada canal especificado
      for (const channel of rule.channels) {
        if (!channel.enabled) continue;

        for (const recipient of recipients) {
          await this.createNotificationDelivery({
            notificationId: batchId,
            recipientId: recipient.id,
            recipientType: recipient.type,
            channel: channel.type,
            content,
            alertData,
            metadata: { ruleId: rule.id, batchId }
          });
        }
      }
    } catch (error) {
      console.error('Error procesando regla de notificación:', error);
    }
  }

  private async getRecipientsByRoles(_roles: string[], _alertData: any): Promise<Array<{id: string, type: string}>> {
    // Implementar lógica para obtener destinatarios por roles
    // Por ahora, devolver array vacío como placeholder
    return [];
  }

  private async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    try {
      const templateDoc = await getDoc(doc(db, 'notificationTemplates', templateId));
      return templateDoc.exists() ? { id: templateDoc.id, ...templateDoc.data() } as NotificationTemplate : null;
    } catch (error) {
      console.error('Error obteniendo template:', error);
      return null;
    }
  }

  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] || match;
    });
  }

  private async createNotificationDelivery(params: {
    notificationId: string;
    recipientId: string;
    recipientType: string;
    channel: string;
    content: string;
    alertData: any;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      const deliveryData: Partial<NotificationDelivery> = {
        notificationId: params.notificationId,
        recipientId: params.recipientId,
        recipientType: params.recipientType as any,
        channel: params.channel as any,
        status: 'pending',
        attempts: 0,
        metadata: {
          ...params.metadata,
          content: params.content,
          alertId: params.alertData.id
        }
      };

      await addDoc(collection(db, 'notificationDeliveries'), deliveryData);
      
      // Enviar inmediatamente (en una implementación real, esto sería asíncrono)
      await this.deliverToChannel(params.channel, params.recipientId, params.content);
    } catch (error) {
      console.error('Error creando entrega de notificación:', error);
    }
  }

  private async deliverToChannel(channel: string, recipientId: string, content: string): Promise<void> {
    // Implementar entrega real según el canal
    console.log(`Delivering to ${channel} for ${recipientId}: ${content}`);
    
    // Simular entrega
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async deliverNotification(notificationId: string, _notificationData: any): Promise<void> {
    // Implementar lógica de entrega inmediata
    console.log('Delivering notification:', notificationId);
  }

  private async updateBatchStatus(batchId: string): Promise<void> {
    try {
      // Obtener estadísticas actualizadas del batch
      const deliveriesQuery = query(
        collection(db, 'notificationDeliveries'),
        where('notificationId', '==', batchId)
      );
      
      const snapshot = await getDocs(deliveriesQuery);
      const deliveries = snapshot.docs.map(doc => doc.data());
      
      const sentCount = deliveries.filter(d => d.status !== 'pending').length;
      const deliveredCount = deliveries.filter(d => d.status === 'delivered' || d.status === 'read').length;
      const failedCount = deliveries.filter(d => d.status === 'failed').length;
      
      await updateDoc(doc(db, 'notificationBatches', batchId), {
        sentCount,
        deliveredCount,
        failedCount,
        status: sentCount === deliveries.length ? 'completed' : 'processing',
        completedAt: sentCount === deliveries.length ? new Date() : null
      });
    } catch (error) {
      console.error('Error actualizando estado del batch:', error);
    }
  }

  private async getAlert(alertId: string): Promise<any> {
    try {
      const alertDoc = await getDoc(doc(db, 'alerts', alertId));
      return alertDoc.exists() ? { id: alertDoc.id, ...alertDoc.data() } : null;
    } catch (error) {
      console.error('Error obteniendo alerta:', error);
      return null;
    }
  }
}

// Instancia singleton
export const enhancedNotificationService = EnhancedNotificationService.getInstance();

// Templates predefinidos
export const DEFAULT_NOTIFICATION_TEMPLATES: Partial<NotificationTemplate>[] = [
  {
    name: 'Alerta Crítica - Email',
    type: 'email',
    subject: 'Alerta Crítica: {{alertTitle}}',
    content: `
      <h2>Alerta Crítica Generada</h2>
      <p><strong>Estudiante:</strong> {{studentName}}</p>
      <p><strong>Curso:</strong> {{courseName}}</p>
      <p><strong>Descripción:</strong> {{alertDescription}}</p>
      <p><strong>Fecha:</strong> {{createdAt}}</p>
      <p>Esta alerta requiere atención inmediata.</p>
    `,
    variables: ['alertTitle', 'studentName', 'courseName', 'alertDescription', 'createdAt'],
    enabled: true
  },
  {
    name: 'Recordatorio - SMS',
    type: 'sms',
    content: 'Recordatorio EduNova: La alerta "{{alertTitle}}" para {{studentName}} sigue pendiente. Revisa el sistema para más detalles.',
    variables: ['alertTitle', 'studentName'],
    enabled: true
  },
  {
    name: 'Notificación Push - Resolución',
    type: 'push',
    content: '✅ Alerta resuelta: {{alertTitle}} para {{studentName}} ha sido marcada como resuelta.',
    variables: ['alertTitle', 'studentName'],
    enabled: true
  }
];
