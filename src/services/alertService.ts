/**
 * Servicio Centralizado de Alertas - Sistema Mejorado
 * Gestiona todo el ciclo de vida de las alertas de manera unificada
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { notificationService } from './notificationService';

// === TIPOS Y INTERFACES ===

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'academic' | 'attendance' | 'behavior' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface AlertCondition {
  field: string; // 'average_grade', 'attendance_rate', 'consecutive_absences', etc.
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: number | string;
  timeFrame?: 'week' | 'month' | 'semester' | 'year';
}

export interface AlertAction {
  type: 'create_alert' | 'send_notification' | 'escalate' | 'assign_task';
  target: string[]; // user IDs or roles
  delay?: number; // minutes
  template?: string;
  escalateTo?: string;
}

export interface AlertWorkflow {
  id: string;
  alertId: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  steps: WorkflowStep[];
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'review' | 'action' | 'notification' | 'escalation';
  status: 'pending' | 'completed' | 'skipped';
  assignedTo?: string;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  dueDate?: Date;
}

export interface AlertMetrics {
  totalAlerts: number;
  alertsByType: Record<string, number>;
  alertsByPriority: Record<string, number>;
  alertsByStatus: Record<string, number>;
  resolutionTime: {
    average: number;
    median: number;
    byPriority: Record<string, number>;
  };
  escalationRate: number;
  notificationDeliveryRate: number;
  studentImpact: Record<string, number>;
  trendData: AlertTrend[];
}

export interface AlertTrend {
  date: string;
  count: number;
  type?: string;
  priority?: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  type: 'academic' | 'attendance' | 'behavior' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  titleTemplate: string;
  descriptionTemplate: string;
  variables: string[]; // Variables que se pueden usar en el template
  workflow?: string; // ID del workflow asociado
  enabled: boolean;
}

// === SERVICIO PRINCIPAL ===

export class AlertService {
  private static instance: AlertService;

  private constructor() {}

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  // === GESTIÓN DE ALERTAS ===

  /**
   * Crea una nueva alerta con workflow automático
   */
  async createAlert(alertData: any, useTemplate?: string): Promise<string> {
    try {
      let finalAlertData = alertData;

      // Si se especifica un template, aplicarlo
      if (useTemplate) {
        const template = await this.getAlertTemplate(useTemplate);
        if (template) {
          finalAlertData = await this.applyTemplate(alertData, template);
        }
      }

      // Crear la alerta
      const alertRef = await addDoc(collection(db, 'alerts'), {
        ...finalAlertData,
        createdAt: serverTimestamp(),
        status: 'active',
        readBy: [],
        resolvedAt: null,
        resolutionNotes: '',
        escalationLevel: 0,
        workflowId: null
      });

      const alertId = alertRef.id;

      // Iniciar workflow automático si es necesario
      await this.initializeWorkflow(alertId, finalAlertData);

      // Enviar notificaciones automáticas
      await this.triggerNotifications(alertId, finalAlertData);

      // Registrar en métricas
      await this.updateMetrics('alert_created', finalAlertData);

      return alertId;
    } catch (error) {
      console.error('Error creando alerta:', error);
      throw error;
    }
  }

  /**
   * Procesa reglas automáticas y genera alertas
   */
  async processAutomaticRules(studentData: any[]): Promise<string[]> {
    try {
      const rules = await this.getActiveRules();
      const generatedAlerts: string[] = [];

      for (const student of studentData) {
        for (const rule of rules) {
          if (await this.evaluateRule(rule, student)) {
            const alertData = await this.generateAlertFromRule(rule, student);
            const alertId = await this.createAlert(alertData);
            generatedAlerts.push(alertId);
          }
        }
      }

      return generatedAlerts;
    } catch (error) {
      console.error('Error procesando reglas automáticas:', error);
      throw error;
    }
  }

  /**
   * Resuelve una alerta y completa su workflow
   */
  async resolveAlert(alertId: string, resolutionNotes: string, resolvedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy,
        resolutionNotes
      });

      // Completar workflow asociado
      const alert = await this.getAlert(alertId);
      if (alert?.workflowId) {
        await this.completeWorkflow(alert.workflowId, resolvedBy);
      }

      // Actualizar métricas
      await this.updateMetrics('alert_resolved', { alertId, resolvedBy });

      // Notificar resolución
      await this.sendResolutionNotification(alertId, resolvedBy);
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
      throw error;
    }
  }

  /**
   * Escala una alerta al siguiente nivel
   */
  async escalateAlert(alertId: string, escalatedBy: string, reason: string): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) throw new Error('Alerta no encontrada');

      const newEscalationLevel = (alert.escalationLevel || 0) + 1;
      
      await updateDoc(doc(db, 'alerts', alertId), {
        escalationLevel: newEscalationLevel,
        escalatedAt: serverTimestamp(),
        escalatedBy,
        escalationReason: reason
      });

      // Crear workflow de escalamiento
      await this.createEscalationWorkflow(alertId, newEscalationLevel);

      // Notificar escalamiento
      await this.sendEscalationNotification(alertId, newEscalationLevel);

      // Actualizar métricas
      await this.updateMetrics('alert_escalated', { alertId, level: newEscalationLevel });
    } catch (error) {
      console.error('Error escalando alerta:', error);
      throw error;
    }
  }

  // === GESTIÓN DE WORKFLOWS ===

  /**
   * Inicializa un workflow para una alerta
   */
  private async initializeWorkflow(alertId: string, alertData: any): Promise<void> {
    // Determinar workflow basado en tipo y prioridad
    const workflowTemplate = await this.getWorkflowTemplate(alertData.type, alertData.priority);
    
    if (workflowTemplate) {
      const workflow: AlertWorkflow = {
        id: '', // Se asignará al guardar
        alertId,
        currentStep: 0,
        totalSteps: workflowTemplate.steps.length,
        status: 'pending',
        steps: workflowTemplate.steps.map((step: any, index: number) => ({
          ...step,
          id: `${alertId}_step_${index}`,
          status: 'pending'
        })),
        createdAt: new Date()
      };

      const workflowRef = await addDoc(collection(db, 'alertWorkflows'), workflow);
      
      // Actualizar alerta con ID del workflow
      await updateDoc(doc(db, 'alerts', alertId), {
        workflowId: workflowRef.id
      });
    }
  }

  /**
   * Avanza al siguiente paso del workflow
   */
  async advanceWorkflow(workflowId: string, completedBy: string, notes?: string): Promise<void> {
    try {
      const workflowDoc = await getDoc(doc(db, 'alertWorkflows', workflowId));
      if (!workflowDoc.exists()) throw new Error('Workflow no encontrado');

      const workflow = workflowDoc.data() as AlertWorkflow;
      const currentStep = workflow.steps[workflow.currentStep];

      // Marcar paso actual como completado
      currentStep.status = 'completed';
      currentStep.completedBy = completedBy;
      currentStep.completedAt = new Date();
      if (notes) currentStep.notes = notes;

      // Avanzar al siguiente paso
      const nextStepIndex = workflow.currentStep + 1;
      const isCompleted = nextStepIndex >= workflow.totalSteps;

      await updateDoc(doc(db, 'alertWorkflows', workflowId), {
        currentStep: isCompleted ? workflow.currentStep : nextStepIndex,
        status: isCompleted ? 'completed' : 'in_progress',
        steps: workflow.steps
      });

      // Si hay siguiente paso, asignarlo
      if (!isCompleted) {
        await this.assignWorkflowStep(workflowId, nextStepIndex);
      }
    } catch (error) {
      console.error('Error avanzando workflow:', error);
      throw error;
    }
  }

  // === MÉTRICAS Y ANALYTICS ===

  /**
   * Obtiene métricas completas del sistema de alertas
   */
  async getAlertMetrics(timeRange: 'week' | 'month' | 'semester' | 'year' = 'month'): Promise<AlertMetrics> {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(endDate, timeRange);

      // Obtener todas las alertas del rango
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      const alertsSnapshot = await getDocs(alertsQuery);
      const alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calcular métricas
      const metrics: AlertMetrics = {
        totalAlerts: alerts.length,
        alertsByType: this.calculateDistribution(alerts, 'type'),
        alertsByPriority: this.calculateDistribution(alerts, 'priority'),
        alertsByStatus: this.calculateDistribution(alerts, 'status'),
        resolutionTime: await this.calculateResolutionTime(alerts),
        escalationRate: this.calculateEscalationRate(alerts),
        notificationDeliveryRate: await this.calculateDeliveryRate(alerts),
        studentImpact: this.calculateStudentImpact(alerts),
        trendData: this.calculateTrendData(alerts, timeRange)
      };

      return metrics;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      throw error;
    }
  }

  /**
   * Genera reportes avanzados
   */
  async generateAdvancedReport(type: 'student' | 'course' | 'teacher' | 'system', targetId?: string): Promise<any> {
    try {
      switch (type) {
        case 'student':
          return await this.generateStudentReport(targetId!);
        case 'course':
          return await this.generateCourseReport(targetId!);
        case 'teacher':
          return await this.generateTeacherReport(targetId!);
        case 'system':
          return await this.generateSystemReport();
        default:
          throw new Error('Tipo de reporte no válido');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  // === CONFIGURACIÓN Y TEMPLATES ===

  /**
   * Obtiene todas las reglas activas
   */
  private async getActiveRules(): Promise<AlertRule[]> {
    const rulesQuery = query(
      collection(db, 'alertRules'),
      where('enabled', '==', true)
    );
    
    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertRule));
  }

  /**
   * Aplica un template a los datos de alerta
   */
  private async applyTemplate(alertData: any, template: AlertTemplate): Promise<any> {
    return {
      ...alertData,
      type: template.type,
      priority: template.priority,
      title: this.interpolateTemplate(template.titleTemplate, alertData),
      description: this.interpolateTemplate(template.descriptionTemplate, alertData)
    };
  }

  /**
   * Interpola variables en un template
   */
  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] || match;
    });
  }

  // === MÉTODOS AUXILIARES ===

  private async getAlert(alertId: string): Promise<any> {
    const alertDoc = await getDoc(doc(db, 'alerts', alertId));
    return alertDoc.exists() ? { id: alertDoc.id, ...alertDoc.data() } : null;
  }

  private async getAlertTemplate(templateId: string): Promise<AlertTemplate | null> {
    const templateDoc = await getDoc(doc(db, 'alertTemplates', templateId));
    return templateDoc.exists() ? { id: templateDoc.id, ...templateDoc.data() } as AlertTemplate : null;
  }

  private async evaluateRule(rule: AlertRule, studentData: any): Promise<boolean> {
    return rule.conditions.every(condition => {
      const value = this.extractValue(studentData, condition.field);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  private extractValue(data: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'eq': return actual === expected;
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'contains': return String(actual).includes(String(expected));
      default: return false;
    }
  }

  private calculateDistribution(alerts: any[], field: string): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      const value = alert[field] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private async calculateResolutionTime(alerts: any[]): Promise<any> {
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolvedAt && a.createdAt);
    
    if (resolvedAlerts.length === 0) {
      return { average: 0, median: 0, byPriority: {} };
    }

    const times = resolvedAlerts.map(alert => {
      const created = alert.createdAt.toDate();
      const resolved = alert.resolvedAt.toDate();
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // horas
    });

    times.sort((a, b) => a - b);

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      median: times[Math.floor(times.length / 2)],
      byPriority: this.calculateResolutionByPriority(resolvedAlerts)
    };
  }

  private calculateResolutionByPriority(alerts: any[]): Record<string, number> {
    const byPriority: Record<string, number[]> = {};
    
    alerts.forEach(alert => {
      const priority = alert.priority || 'unknown';
      const time = (alert.resolvedAt.toDate().getTime() - alert.createdAt.toDate().getTime()) / (1000 * 60 * 60);
      
      if (!byPriority[priority]) byPriority[priority] = [];
      byPriority[priority].push(time);
    });

    return Object.entries(byPriority).reduce((acc, [priority, times]) => {
      acc[priority] = times.reduce((sum, time) => sum + time, 0) / times.length;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateEscalationRate(alerts: any[]): number {
    const escalatedAlerts = alerts.filter(a => (a.escalationLevel || 0) > 0);
    return alerts.length > 0 ? (escalatedAlerts.length / alerts.length) * 100 : 0;
  }

  private async calculateDeliveryRate(_alerts: any[]): Promise<number> {
    // Implementar cálculo de tasa de entrega de notificaciones
    return 95; // Placeholder
  }

  private calculateStudentImpact(alerts: any[]): Record<string, number> {
    return this.calculateDistribution(alerts, 'targetUserId');
  }

  private calculateTrendData(_alerts: any[], _timeRange: string): AlertTrend[] {
    // Implementar cálculo de tendencias
    return []; // Placeholder
  }

  private getStartDate(endDate: Date, timeRange: string): Date {
    const date = new Date(endDate);
    switch (timeRange) {
      case 'week': date.setDate(date.getDate() - 7); break;
      case 'month': date.setMonth(date.getMonth() - 1); break;
      case 'semester': date.setMonth(date.getMonth() - 6); break;
      case 'year': date.setFullYear(date.getFullYear() - 1); break;
    }
    return date;
  }

  // Métodos adicionales para workflows, notificaciones, etc.
  private async getWorkflowTemplate(_type: string, _priority: string): Promise<any> {
    // Implementar obtención de templates de workflow
    return null; // Placeholder
  }

  private async triggerNotifications(_alertId: string, alertData: any): Promise<void> {
    // Integrar con notificationService
    await notificationService.procesarAlertaAutomatica(alertData);
  }

  private async updateMetrics(_event: string, _data: any): Promise<void> {
    // Implementar actualización de métricas en tiempo real
  }

  private async sendResolutionNotification(_alertId: string, _resolvedBy: string): Promise<void> {
    // Implementar notificación de resolución
  }

  private async sendEscalationNotification(_alertId: string, _level: number): Promise<void> {
    // Implementar notificación de escalamiento
  }

  private async createEscalationWorkflow(_alertId: string, _level: number): Promise<void> {
    // Implementar workflow de escalamiento
  }

  private async completeWorkflow(_workflowId: string, _completedBy: string): Promise<void> {
    // Implementar finalización de workflow
  }

  private async assignWorkflowStep(_workflowId: string, _stepIndex: number): Promise<void> {
    // Implementar asignación de pasos de workflow
  }

  private async generateStudentReport(_studentId: string): Promise<any> {
    // Implementar reporte de estudiante
    return {};
  }

  private async generateCourseReport(_courseId: string): Promise<any> {
    // Implementar reporte de curso
    return {};
  }

  private async generateTeacherReport(_teacherId: string): Promise<any> {
    // Implementar reporte de profesor
    return {};
  }

  private async generateSystemReport(): Promise<any> {
    // Implementar reporte del sistema
    return {};
  }

  private async generateAlertFromRule(_rule: AlertRule, _studentData: any): Promise<any> {
    // Implementar generación de alerta desde regla
    return {};
  }
}

// Instancia singleton
export const alertService = AlertService.getInstance();
