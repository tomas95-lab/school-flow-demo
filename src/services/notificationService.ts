/**
 * Servicio de Notificaciones Automáticas
 * Gestiona el envío automático de notificaciones a familias cuando se generan alertas
 */

import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  getDocs,
  query,
  where 
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type { AlertaAutomatica } from '@/utils/alertasAutomaticas';

interface ConfiguracionComunicacion {
  emailNotificaciones: boolean;
  smsNotificaciones: boolean;
  notificacionesAlertas: boolean;
  notificacionesBoletines: boolean;
  notificacionesAsistencia: boolean;
  notificarAlertasCriticas: boolean;
  notificarAlertasAltas: boolean;
  notificarAusenciasConsecutivas: number;
  notificarPromedioMenorA: number;
  mensajePersonalizadoEmail: string;
  mensajePersonalizadoSMS: string;
  horaInicioNotificaciones: string;
  horaFinNotificaciones: string;
  frecuenciaNotificaciones: 'inmediata' | 'diaria' | 'semanal';
}

interface NotificacionFamilia {
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
  alertaId?: string;
}

interface ContactoFamilia {
  studentId: string;
  studentName: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  preferredChannel?: 'email' | 'sms' | 'ambos';
  enabled: boolean;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Procesa una alerta automática y envía notificaciones si es necesario
   */
  async procesarAlertaAutomatica(alerta: AlertaAutomatica): Promise<void> {
    try {
      // Obtener configuración de comunicación
      const configuracion = await this.obtenerConfiguracion();
      
      // Verificar si se deben enviar notificaciones para este tipo de alerta
      if (!this.debeNotificar(alerta, configuracion)) {
        console.log(`Notificación omitida para alerta ${alerta.id} - no cumple criterios`);
        return;
      }

      // Obtener información de contacto de la familia
      const contacto = await this.obtenerContactoFamilia(alerta.studentId);
      if (!contacto || !contacto.enabled) {
        console.log(`No se encontró contacto válido para estudiante ${alerta.studentId}`);
        return;
      }

      // Verificar horarios de envío
      if (!this.esHorarioValido(configuracion)) {
        console.log('Notificación programada fuera del horario permitido');
        // En lugar de enviar inmediatamente, se podría programar para más tarde
        return;
      }

      // Crear y enviar notificación
      await this.crearYEnviarNotificacion(alerta, contacto, configuracion);

    } catch (error) {
      console.error('Error procesando alerta automática:', error);
    }
  }

  /**
   * Envía notificación manual (desde la interfaz admin)
   */
  async enviarNotificacionManual(
    studentId: string,
    titulo: string,
    mensaje: string,
    tipo: string = 'general',
    prioridad: string = 'media'
  ): Promise<boolean> {
    try {
      const configuracion = await this.obtenerConfiguracion();
      const contacto = await this.obtenerContactoFamilia(studentId);

      if (!contacto || !contacto.enabled) {
        throw new Error('No se encontró contacto válido para el estudiante');
      }

      const notificacion: Omit<NotificacionFamilia, 'id'> = {
        studentId,
        studentName: contacto.studentName,
        parentEmail: contacto.parentEmail,
        parentPhone: contacto.parentPhone,
        tipo: tipo as any,
        prioridad: prioridad as any,
        titulo,
        mensaje,
        canalEnvio: this.determinarCanalEnvio(contacto, configuracion),
        fechaEnvio: new Date(),
        estado: 'pendiente',
        intentos: 0
      };

      const docRef = await addDoc(collection(db, 'notificacionesFamilias'), notificacion);
      await this.enviarNotificacion(docRef.id, notificacion);

      return true;
    } catch (error) {
      console.error('Error enviando notificación manual:', error);
      throw error;
    }
  }

  /**
   * Procesa notificaciones pendientes (para ejecución programada)
   */
  async procesarNotificacionesPendientes(): Promise<void> {
    try {
      const pendientesQuery = query(
        collection(db, 'notificacionesFamilias'),
        where('estado', '==', 'pendiente'),
        where('intentos', '<', 3)
      );

      const snapshot = await getDocs(pendientesQuery);
      
      for (const docSnapshot of snapshot.docs) {
        const notificacion = { id: docSnapshot.id, ...docSnapshot.data() } as NotificacionFamilia & { id: string };
        
        try {
          await this.enviarNotificacion(notificacion.id, notificacion);
        } catch (error) {
          console.error(`Error enviando notificación ${notificacion.id}:`, error);
          
          // Incrementar intentos y marcar error si se excede el límite
          await updateDoc(doc(db, 'notificacionesFamilias', notificacion.id), {
            intentos: notificacion.intentos + 1,
            estado: notificacion.intentos >= 2 ? 'error' : 'pendiente',
            errorMessage: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
    } catch (error) {
      console.error('Error procesando notificaciones pendientes:', error);
    }
  }

  // Métodos privados

  private async obtenerConfiguracion(): Promise<ConfiguracionComunicacion> {
    const defaultConfig: ConfiguracionComunicacion = {
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

    try {
      const configDoc = await getDoc(doc(db, 'configuracion', 'comunicacionFamilias'));
      if (configDoc.exists()) {
        return { ...defaultConfig, ...configDoc.data() } as ConfiguracionComunicacion;
      }
    } catch (error) {
      console.warn('Error cargando configuración de comunicación:', error);
    }

    return defaultConfig;
  }

  private async obtenerContactoFamilia(studentId: string): Promise<ContactoFamilia | null> {
    try {
      // Buscar primero en la colección de contactos específica
      const contactDoc = await getDoc(doc(db, 'contactosFamilias', studentId));
      if (contactDoc.exists()) {
        return contactDoc.data() as ContactoFamilia;
      }

      // Si no existe, buscar en la colección de estudiantes
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        return {
          studentId,
          studentName: studentData.nombre || 'Estudiante',
          parentEmail: studentData.parentEmail || studentData.email,
          parentPhone: studentData.parentPhone || studentData.telefono,
          enabled: true
        };
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo contacto de familia:', error);
      return null;
    }
  }

  private debeNotificar(alerta: AlertaAutomatica, config: ConfiguracionComunicacion): boolean {
    // Verificar si las notificaciones de alertas están habilitadas
    if (!config.notificacionesAlertas) {
      return false;
    }

    // Verificar prioridad
    if (alerta.prioridad === 'critica' && config.notificarAlertasCriticas) {
      return true;
    }
    
    if (alerta.prioridad === 'alta' && config.notificarAlertasAltas) {
      return true;
    }

    // Verificar umbrales específicos
    if (alerta.tipo === 'asistencia_critica' && config.notificacionesAsistencia) {
      const ausencias = alerta.datosSoporte.ausencias || 0;
      return ausencias >= config.notificarAusenciasConsecutivas;
    }

    if (alerta.tipo === 'rendimiento_critico') {
      const promedio = alerta.datosSoporte.promedioActual || 0;
      return promedio < config.notificarPromedioMenorA;
    }

    return false;
  }

  private esHorarioValido(config: ConfiguracionComunicacion): boolean {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 100 + ahora.getMinutes();
    
    const horaInicio = this.parseHora(config.horaInicioNotificaciones);
    const horaFin = this.parseHora(config.horaFinNotificaciones);

    return horaActual >= horaInicio && horaActual <= horaFin;
  }

  private parseHora(horaString: string): number {
    const [horas, minutos] = horaString.split(':').map(Number);
    return horas * 100 + minutos;
  }

  private determinarCanalEnvio(contacto: ContactoFamilia, config: ConfiguracionComunicacion): 'email' | 'sms' | 'ambos' {
    // Priorizar preferencia del contacto
    if (contacto.preferredChannel) {
      return contacto.preferredChannel;
    }

    // Si ambos están habilitados y hay contactos, usar ambos
    if (config.emailNotificaciones && config.smsNotificaciones && 
        contacto.parentEmail && contacto.parentPhone) {
      return 'ambos';
    }

    // Sino, usar el que esté disponible
    if (config.emailNotificaciones && contacto.parentEmail) {
      return 'email';
    }

    if (config.smsNotificaciones && contacto.parentPhone) {
      return 'sms';
    }

    return 'email'; // fallback
  }

  private async crearYEnviarNotificacion(
    alerta: AlertaAutomatica,
    contacto: ContactoFamilia,
    config: ConfiguracionComunicacion
  ): Promise<void> {
    const notificacion: Omit<NotificacionFamilia, 'id'> = {
      studentId: alerta.studentId,
      studentName: alerta.studentName,
      parentEmail: contacto.parentEmail,
      parentPhone: contacto.parentPhone,
      tipo: 'alerta',
      prioridad: alerta.prioridad,
      titulo: alerta.titulo,
      mensaje: this.generarMensaje(alerta, config),
      canalEnvio: this.determinarCanalEnvio(contacto, config),
      fechaEnvio: new Date(),
      estado: 'pendiente',
      intentos: 0,
      alertaId: alerta.id
    };

    const docRef = await addDoc(collection(db, 'notificacionesFamilias'), notificacion);
    await this.enviarNotificacion(docRef.id, notificacion);
  }

  private generarMensaje(alerta: AlertaAutomatica, config: ConfiguracionComunicacion): string {
    const plantilla = config.mensajePersonalizadoEmail;
    
    return plantilla
      .replace('{studentName}', alerta.studentName)
      .replace('{alertType}', alerta.titulo)
      .replace('{date}', new Date().toLocaleDateString())
      + '\n\n' + alerta.descripcion;
  }

  private async enviarNotificacion(notificationId: string, notificacion: NotificacionFamilia): Promise<void> {
    try {
      // Aquí iría la integración con servicios reales de email/SMS
      // Por ahora, simularemos el envío
      
      if (notificacion.canalEnvio === 'email' || notificacion.canalEnvio === 'ambos') {
        await this.enviarEmail(notificacion);
      }

      if (notificacion.canalEnvio === 'sms' || notificacion.canalEnvio === 'ambos') {
        await this.enviarSMS(notificacion);
      }

      // Marcar como enviado
      await updateDoc(doc(db, 'notificacionesFamilias', notificationId), {
        estado: 'enviado',
        fechaEnvio: new Date()
      });

      console.log(`Notificación ${notificationId} enviada exitosamente`);

    } catch (error) {
      console.error(`Error enviando notificación ${notificationId}:`, error);
      throw error;
    }
  }

  private async enviarEmail(notificacion: NotificacionFamilia): Promise<void> {
    // Simulación de envío de email
    // En producción, integrar con SendGrid, Nodemailer, etc.
    
    console.log('📧 Simulando envío de email:');
    console.log(`To: ${notificacion.parentEmail}`);
    console.log(`Subject: ${notificacion.titulo}`);
    console.log(`Body: ${notificacion.mensaje}`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular 95% de éxito
    if (Math.random() < 0.05) {
      throw new Error('Error simulado al enviar email');
    }
  }

  private async enviarSMS(notificacion: NotificacionFamilia): Promise<void> {
    // Simulación de envío de SMS
    // En producción, integrar con Twilio, AWS SNS, etc.
    
    console.log('📱 Simulando envío de SMS:');
    console.log(`To: ${notificacion.parentPhone}`);
    console.log(`Message: ${notificacion.mensaje.substring(0, 160)}`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simular 98% de éxito  
    if (Math.random() < 0.02) {
      throw new Error('Error simulado al enviar SMS');
    }
  }
}

// Instancia singleton del servicio
export const notificationService = NotificationService.getInstance();

// Función de utilidad para integrar con alertas automáticas
export async function procesarAlertasParaNotificacion(alertas: AlertaAutomatica[]): Promise<void> {
  for (const alerta of alertas) {
    try {
      await notificationService.procesarAlertaAutomatica(alerta);
    } catch (error) {
      console.error(`Error procesando alerta ${alerta.id} para notificación:`, error);
    }
  }
}
