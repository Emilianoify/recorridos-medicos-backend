import { ContactMethod } from '../enums/ContactMethod';
import { IVisit } from '../interfaces/visit.interface';
import { IProfessional } from '../interfaces/professional.interface';

export interface INotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: ContactMethod;
  template: string;
  variables: string[];
  isActive: boolean;
  language: 'es' | 'en';
}

export enum NotificationType {
  VISIT_CONFIRMATION = 'visit_confirmation',
  VISIT_REMINDER = 'visit_reminder',
  VISIT_CANCELLED = 'visit_cancelled',
  VISIT_RESCHEDULED = 'visit_rescheduled',
  JOURNEY_STARTED = 'journey_started',
  PROFESSIONAL_DELAYED = 'professional_delayed',
  VISIT_COMPLETED = 'visit_completed',
  MONTHLY_SUMMARY = 'monthly_summary',
  EMERGENCY_ALERT = 'emergency_alert',
}

export interface INotificationPayload {
  recipientId: string;
  recipientType: 'PATIENT' | 'PROFESSIONAL' | 'COORDINATOR' | 'FAMILY';
  contactMethod: ContactMethod;
  templateType: NotificationType;
  templateVariables: { [key: string]: any };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledFor?: Date;
  metadata?: any;
}

export interface INotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt?: Date;
  deliveryStatus?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  cost?: number;
  provider?: string;
}

export interface INotificationHistory {
  id: string;
  payload: INotificationPayload;
  result: INotificationResult;
  attempts: number;
  lastAttempt: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
}

export interface IBulkNotificationRequest {
  notifications: INotificationPayload[];
  batchName?: string;
  maxConcurrency?: number;
  delayBetweenSends?: number; // ms
}

export interface IBulkNotificationResult {
  batchId: string;
  totalNotifications: number;
  successful: number;
  failed: number;
  results: INotificationResult[];
  startedAt: Date;
  completedAt?: Date;
  errors: string[];
}

export class NotificationService {
  private static templates: Map<string, INotificationTemplate> = new Map();
  private static notificationHistory: Map<string, INotificationHistory> =
    new Map();

  // Configuraciones de proveedores (en producci�n deber�an venir de variables de entorno)
  private static readonly PROVIDER_CONFIG = {
    whatsapp: {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.business',
      token: process.env.WHATSAPP_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_ID,
    },
    sms: {
      provider: process.env.SMS_PROVIDER || 'twilio',
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
      fromNumber: process.env.SMS_FROM_NUMBER,
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      apiKey: process.env.EMAIL_API_KEY,
      fromEmail: process.env.EMAIL_FROM,
      fromName: process.env.EMAIL_FROM_NAME || 'Recorridos M�dicos',
    },
    phone: {
      provider: process.env.VOICE_PROVIDER || 'twilio',
      apiKey: process.env.VOICE_API_KEY,
      apiSecret: process.env.VOICE_API_SECRET,
      fromNumber: process.env.VOICE_FROM_NUMBER,
    },
  };

  /**
   * Inicializar templates predeterminados
   */
  static initializeDefaultTemplates() {
    const defaultTemplates: INotificationTemplate[] = [
      // ===== CONFIRMACI�N DE VISITA =====
      {
        id: 'visit_confirmation_whatsapp_es',
        name: 'Confirmaci�n de Visita - WhatsApp',
        type: NotificationType.VISIT_CONFIRMATION,
        channel: ContactMethod.WHATSAPP,
        template:
          `Hola {{patientName}},\n\n` +
          `Le recordamos que tiene una visita m�dica programada:\n` +
          `=� Fecha: {{visitDate}}\n` +
          `� Hora: {{visitTime}}\n` +
          `=i
� Profesional: {{professionalName}}\n\n` +
          `Por favor confirme su disponibilidad respondiendo:\n` +
          ` S� para confirmar\n` +
          `L NO para cancelar\n\n` +
          `Gracias por confiar en nuestros servicios.`,
        variables: [
          'patientName',
          'visitDate',
          'visitTime',
          'professionalName',
        ],
        isActive: true,
        language: 'es',
      },
      {
        id: 'visit_confirmation_sms_es',
        name: 'Confirmaci�n de Visita - SMS',
        type: NotificationType.VISIT_CONFIRMATION,
        channel: ContactMethod.SMS,
        template: `Visita m�dica: {{visitDate}} {{visitTime}}. Profesional: {{professionalName}}. Confirme: SI/NO`,
        variables: ['visitDate', 'visitTime', 'professionalName'],
        isActive: true,
        language: 'es',
      },
      {
        id: 'visit_confirmation_phone_es',
        name: 'Confirmaci�n de Visita - Tel�fono',
        type: NotificationType.VISIT_CONFIRMATION,
        channel: ContactMethod.PHONE,
        template: `Buenos d�as {{patientName}}, le llamamos para confirmar su visita m�dica del {{visitDate}} a las {{visitTime}} con {{professionalName}}. Por favor presione 1 para confirmar o 2 para cancelar.`,
        variables: [
          'patientName',
          'visitDate',
          'visitTime',
          'professionalName',
        ],
        isActive: true,
        language: 'es',
      },

      // ===== RECORDATORIO DE VISITA =====
      {
        id: 'visit_reminder_whatsapp_es',
        name: 'Recordatorio de Visita - WhatsApp',
        type: NotificationType.VISIT_REMINDER,
        channel: ContactMethod.WHATSAPP,
        template:
          `= Recordatorio\n\n` +
          `Hola {{patientName}}, le recordamos que ma�ana tiene su visita m�dica:\n\n` +
          `=� {{visitDate}} a las {{visitTime}}\n` +
          `=i
� {{professionalName}}\n` +
          `=� En su domicilio\n\n` +
          `Por favor aseg�rese de estar disponible.\n` +
          `Si necesita reprogramar, contacte con nosotros.`,
        variables: [
          'patientName',
          'visitDate',
          'visitTime',
          'professionalName',
        ],
        isActive: true,
        language: 'es',
      },

      // ===== VISITA CANCELADA =====
      {
        id: 'visit_cancelled_whatsapp_es',
        name: 'Visita Cancelada - WhatsApp',
        type: NotificationType.VISIT_CANCELLED,
        channel: ContactMethod.WHATSAPP,
        template:
          `L Visita Cancelada\n\n` +
          `Estimado {{patientName}},\n\n` +
          `Lamentamos informarle que su visita del {{visitDate}} a las {{visitTime}} ha sido cancelada.\n\n` +
          `Motivo: {{cancellationReason}}\n\n` +
          `Nos pondremos en contacto con usted para reprogramar.\n` +
          `Disculpe las molestias.`,
        variables: [
          'patientName',
          'visitDate',
          'visitTime',
          'cancellationReason',
        ],
        isActive: true,
        language: 'es',
      },

      // ===== VISITA REPROGRAMADA =====
      {
        id: 'visit_rescheduled_whatsapp_es',
        name: 'Visita Reprogramada - WhatsApp',
        type: NotificationType.VISIT_RESCHEDULED,
        channel: ContactMethod.WHATSAPP,
        template:
          `=� Visita Reprogramada\n\n` +
          `Hola {{patientName}},\n\n` +
          `Su visita ha sido reprogramada:\n\n` +
          `L Fecha anterior: {{oldDate}} {{oldTime}}\n` +
          ` Nueva fecha: {{newDate}} {{newTime}}\n` +
          `=i
� Profesional: {{professionalName}}\n\n` +
          `Por favor confirme la nueva fecha.`,
        variables: [
          'patientName',
          'oldDate',
          'oldTime',
          'newDate',
          'newTime',
          'professionalName',
        ],
        isActive: true,
        language: 'es',
      },

      // ===== RECORRIDO INICIADO =====
      {
        id: 'journey_started_whatsapp_es',
        name: 'Recorrido Iniciado - WhatsApp',
        type: NotificationType.JOURNEY_STARTED,
        channel: ContactMethod.WHATSAPP,
        template:
          `=� Su profesional est� en camino\n\n` +
          `Hola {{patientName}},\n\n` +
          `{{professionalName}} ha iniciado su recorrido y se dirige hacia su domicilio.\n\n` +
          `� Horario estimado de llegada: {{estimatedArrival}}\n\n` +
          `Prep�rese para recibir la visita. Gracias.`,
        variables: ['patientName', 'professionalName', 'estimatedArrival'],
        isActive: true,
        language: 'es',
      },

      // ===== PROFESIONAL RETRASADO =====
      {
        id: 'professional_delayed_whatsapp_es',
        name: 'Profesional Retrasado - WhatsApp',
        type: NotificationType.PROFESSIONAL_DELAYED,
        channel: ContactMethod.WHATSAPP,
        template:
          `� Retraso en la visita\n\n` +
          `Estimado {{patientName}},\n\n` +
          `Le informamos que {{professionalName}} se encuentra retrasado debido a {{delayReason}}.\n\n` +
          `� Nueva hora estimada: {{newEstimatedTime}}\n\n` +
          `Disculpe las molestias y agradecemos su paciencia.`,
        variables: [
          'patientName',
          'professionalName',
          'delayReason',
          'newEstimatedTime',
        ],
        isActive: true,
        language: 'es',
      },

      // ===== VISITA COMPLETADA =====
      {
        id: 'visit_completed_whatsapp_es',
        name: 'Visita Completada - WhatsApp',
        type: NotificationType.VISIT_COMPLETED,
        channel: ContactMethod.WHATSAPP,
        template:
          ` Visita Completada\n\n` +
          `Hola {{patientName}},\n\n` +
          `Su visita m�dica con {{professionalName}} ha sido completada exitosamente.\n\n` +
          `=� Observaciones: {{professionalNotes}}\n\n` +
          `=� Pr�xima visita: {{nextVisitDate}}\n\n` +
          `Gracias por confiar en nuestros servicios.`,
        variables: [
          'patientName',
          'professionalName',
          'professionalNotes',
          'nextVisitDate',
        ],
        isActive: true,
        language: 'es',
      },
    ];

    // Cargar templates en memoria
    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Enviar una notificaci�n individual
   */
  static async sendNotification(
    payload: INotificationPayload
  ): Promise<INotificationResult> {
    try {
      // Buscar template
      const templateKey = `${payload.templateType}_${payload.contactMethod}_es`;
      const template = this.templates.get(templateKey);

      if (!template) {
        return {
          success: false,
          error: `Template no encontrado: ${templateKey}`,
          sentAt: new Date(),
        };
      }

      // Procesar template con variables
      const processedMessage = this.processTemplate(
        template.template,
        payload.templateVariables
      );

      // Enviar seg�n el canal
      let result: INotificationResult;

      switch (payload.contactMethod) {
        case ContactMethod.WHATSAPP:
          result = await this.sendWhatsApp(payload, processedMessage);
          break;
        case ContactMethod.SMS:
          result = await this.sendSMS(payload, processedMessage);
          break;
        case ContactMethod.EMAIL:
          result = await this.sendEmail(payload, processedMessage);
          break;
        case ContactMethod.PHONE:
          result = await this.makePhoneCall(payload, processedMessage);
          break;
        default:
          result = {
            success: false,
            error: `M�todo de contacto no soportado: ${payload.contactMethod}`,
            sentAt: new Date(),
          };
      }

      // Guardar en historial
      const historyEntry: INotificationHistory = {
        id: `${Date.now()}_${payload.recipientId}`,
        payload,
        result,
        attempts: 1,
        lastAttempt: new Date(),
        status: result.success ? 'SENT' : 'FAILED',
      };

      this.notificationHistory.set(historyEntry.id, historyEntry);

      return result;
    } catch (error: any) {
      console.error('Error enviando notificaci�n:', error);
      return {
        success: false,
        error: error.message,
        sentAt: new Date(),
      };
    }
  }

  /**
   * Enviar notificaciones masivas
   */
  static async sendBulkNotifications(
    request: IBulkNotificationRequest
  ): Promise<IBulkNotificationResult> {
    const batchId = `batch_${Date.now()}`;
    const startedAt = new Date();
    const results: INotificationResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    const {
      notifications,
      maxConcurrency = 5,
      delayBetweenSends = 1000,
    } = request;

    console.log(
      `Iniciando env�o masivo: ${notifications.length} notificaciones (Batch: ${batchId})`
    );

    // Procesar en lotes para controlar concurrencia
    for (let i = 0; i < notifications.length; i += maxConcurrency) {
      const batch = notifications.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(async notification => {
        try {
          const result = await this.sendNotification(notification);
          if (result.success) {
            successful++;
          } else {
            failed++;
            if (result.error) {
              errors.push(`${notification.recipientId}: ${result.error}`);
            }
          }
          return result;
        } catch (error: any) {
          failed++;
          errors.push(`${notification.recipientId}: ${error.message}`);
          return {
            success: false,
            error: error.message,
            sentAt: new Date(),
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Esperar antes del siguiente lote (excepto en el �ltimo)
      if (i + maxConcurrency < notifications.length) {
        await this.delay(delayBetweenSends);
      }
    }

    const completedAt = new Date();

    console.log(
      `Env�o masivo completado (Batch: ${batchId}): ${successful} exitosos, ${failed} fallidos`
    );

    return {
      batchId,
      totalNotifications: notifications.length,
      successful,
      failed,
      results,
      startedAt,
      completedAt,
      errors,
    };
  }

  /**
   * Enviar confirmaciones de visitas a pacientes
   */
  static async sendVisitConfirmations(
    visits: IVisit[]
  ): Promise<IBulkNotificationResult> {
    const notifications: INotificationPayload[] = visits.map(visit => ({
      recipientId: visit.patientId,
      recipientType: 'PATIENT',
      contactMethod:
        (visit.patient?.preferredContactMethod as ContactMethod) ||
        ContactMethod.WHATSAPP,
      templateType: NotificationType.VISIT_CONFIRMATION,
      templateVariables: {
        patientName: visit.patient?.fullName || 'Estimado paciente',
        visitDate: this.formatDate(visit.scheduledDateTime),
        visitTime: this.formatTime(visit.scheduledDateTime),
        professionalName:
          visit.journey?.professional?.firstname || 'Profesional asignado',
      },
      priority: 'MEDIUM',
      metadata: {
        visitId: visit.id,
        journeyId: visit.journeyId,
      },
    }));

    return this.sendBulkNotifications({
      notifications,
      batchName: 'Confirmaciones de visita',
      maxConcurrency: 3,
      delayBetweenSends: 2000,
    });
  }

  /**
   * Enviar recordatorios de visitas
   */
  static async sendVisitReminders(
    visits: IVisit[]
  ): Promise<IBulkNotificationResult> {
    const notifications: INotificationPayload[] = visits.map(visit => ({
      recipientId: visit.patientId,
      recipientType: 'PATIENT',
      contactMethod:
        (visit.patient?.preferredContactMethod as ContactMethod) ||
        ContactMethod.WHATSAPP,
      templateType: NotificationType.VISIT_REMINDER,
      templateVariables: {
        patientName: visit.patient?.fullName || 'Estimado paciente',
        visitDate: this.formatDate(visit.scheduledDateTime),
        visitTime: this.formatTime(visit.scheduledDateTime),
        professionalName:
          visit.journey?.professional?.firstname || 'Su profesional',
      },
      priority: 'MEDIUM',
      metadata: {
        visitId: visit.id,
        reminderType: 'next_day',
      },
    }));

    return this.sendBulkNotifications({
      notifications,
      batchName: 'Recordatorios de visita',
    });
  }

  /**
   * Notificar inicio de recorrido
   */
  static async notifyJourneyStarted(
    journeyId: string,
    visits: IVisit[],
    professional: IProfessional
  ): Promise<IBulkNotificationResult> {
    const notifications: INotificationPayload[] = visits.map(visit => ({
      recipientId: visit.patientId,
      recipientType: 'PATIENT',
      contactMethod:
        (visit.patient?.preferredContactMethod as ContactMethod) ||
        ContactMethod.WHATSAPP,
      templateType: NotificationType.JOURNEY_STARTED,
      templateVariables: {
        patientName: visit.patient?.fullName || 'Estimado paciente',
        professionalName: professional.firstname,
        estimatedArrival: this.calculateEstimatedArrival(
          visit.scheduledDateTime
        ),
      },
      priority: 'HIGH',
      metadata: {
        journeyId,
        visitId: visit.id,
      },
    }));

    return this.sendBulkNotifications({
      notifications,
      batchName: 'Notificación inicio recorrido',
      maxConcurrency: 8,
      delayBetweenSends: 500,
    });
  }

  // ===== M�TODOS PRIVADOS DE ENV�O =====

  /**
   * Enviar WhatsApp (simulado - en producci�n usar API real)
   */
  private static async sendWhatsApp(
    payload: INotificationPayload,
    message: string
  ): Promise<INotificationResult> {
    // Simulaci�n de env�o de WhatsApp
    console.log(`=� WhatsApp enviado a ${payload.recipientId}:`, message);

    // En producci�n, aqu� ir�a la integraci�n real con WhatsApp Business API
    const response = await fetch(
      `${this.PROVIDER_CONFIG.whatsapp.apiUrl}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.PROVIDER_CONFIG.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: payload.recipientId,
          text: { body: message },
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Error enviando WhatsApp: ${response.statusText}`);
    }
    return {
      success: true,
      messageId: `wa_${Date.now()}`,
      sentAt: new Date(),
      deliveryStatus: 'SENT',
      provider: 'WhatsApp Business API',
      cost: 0.05, // USD
    };
  }

  /**
   * Enviar SMS (simulado)
   */
  private static async sendSMS(
    payload: INotificationPayload,
    message: string
  ): Promise<INotificationResult> {
    console.log(`=� SMS enviado a ${payload.recipientId}:`, message);

    return {
      success: true,
      messageId: `sms_${Date.now()}`,
      sentAt: new Date(),
      deliveryStatus: 'SENT',
      provider: 'Twilio',
      cost: 0.03, // USD
    };
  }

  /**
   * Enviar Email (simulado)
   */
  private static async sendEmail(
    payload: INotificationPayload,
    message: string
  ): Promise<INotificationResult> {
    console.log(`=� Email enviado a ${payload.recipientId}:`, message);

    return {
      success: true,
      messageId: `email_${Date.now()}`,
      sentAt: new Date(),
      deliveryStatus: 'SENT',
      provider: 'SendGrid',
      cost: 0.01, // USD
    };
  }

  /**
   * Realizar llamada telef�nica (simulado)
   */
  private static async makePhoneCall(
    payload: INotificationPayload,
    message: string
  ): Promise<INotificationResult> {
    console.log(`=� Llamada realizada a ${payload.recipientId}:`, message);

    return {
      success: true,
      messageId: `call_${Date.now()}`,
      sentAt: new Date(),
      deliveryStatus: 'SENT',
      provider: 'Twilio Voice',
      cost: 0.1, // USD
    };
  }

  // ===== M�TODOS AUXILIARES =====

  /**
   * Procesar template con variables
   */
  private static processTemplate(
    template: string,
    variables: { [key: string]: any }
  ): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(
        new RegExp(placeholder, 'g'),
        String(value)
      );
    });

    return processed;
  }

  /**
   * Formatear fecha
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Formatear hora
   */
  private static formatTime(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  /**
   * Calcular hora estimada de llegada
   */
  private static calculateEstimatedArrival(scheduledTime: Date): string {
    // Estimar llegada 15-30 minutos antes de la hora programada
    const arrival = new Date(scheduledTime);
    arrival.setMinutes(arrival.getMinutes() - 20);
    return this.formatTime(arrival);
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener historial de notificaciones
   */
  static getNotificationHistory(
    recipientId?: string,
    templateType?: NotificationType,
    limit: number = 100
  ): INotificationHistory[] {
    let history = Array.from(this.notificationHistory.values());

    if (recipientId) {
      history = history.filter(h => h.payload.recipientId === recipientId);
    }

    if (templateType) {
      history = history.filter(h => h.payload.templateType === templateType);
    }

    return history
      .sort((a, b) => b.lastAttempt.getTime() - a.lastAttempt.getTime())
      .slice(0, limit);
  }

  /**
   * Obtener estad�sticas de notificaciones
   */
  static getNotificationStats(): {
    totalSent: number;
    totalFailed: number;
    byChannel: { [channel: string]: number };
    byType: { [type: string]: number };
    successRate: number;
    avgCost: number;
  } {
    const history = Array.from(this.notificationHistory.values());
    const totalSent = history.filter(h => h.status === 'SENT').length;
    const totalFailed = history.filter(h => h.status === 'FAILED').length;

    const byChannel: { [channel: string]: number } = {};
    const byType: { [type: string]: number } = {};
    let totalCost = 0;
    let costCount = 0;

    history.forEach(h => {
      // Por canal
      const channel = h.payload.contactMethod;
      byChannel[channel] = (byChannel[channel] || 0) + 1;

      // Por tipo
      const type = h.payload.templateType;
      byType[type] = (byType[type] || 0) + 1;

      // Costo
      if (h.result.cost) {
        totalCost += h.result.cost;
        costCount++;
      }
    });

    const successRate =
      history.length > 0 ? (totalSent / history.length) * 100 : 0;
    const avgCost = costCount > 0 ? totalCost / costCount : 0;

    return {
      totalSent,
      totalFailed,
      byChannel,
      byType,
      successRate,
      avgCost,
    };
  }

  /**
   * Reintentar notificaci�n fallida
   */
  static async retryFailedNotification(
    historyId: string
  ): Promise<INotificationResult> {
    const historyEntry = this.notificationHistory.get(historyId);

    if (!historyEntry) {
      return {
        success: false,
        error: 'Notificaci�n no encontrada en el historial',
        sentAt: new Date(),
      };
    }

    if (historyEntry.status === 'SENT') {
      return {
        success: false,
        error: 'La notificaci�n ya fue enviada exitosamente',
        sentAt: new Date(),
      };
    }

    // Intentar reenv�o
    const result = await this.sendNotification(historyEntry.payload);

    // Actualizar historial
    historyEntry.attempts++;
    historyEntry.lastAttempt = new Date();
    historyEntry.result = result;
    historyEntry.status = result.success ? 'SENT' : 'FAILED';

    this.notificationHistory.set(historyId, historyEntry);

    return result;
  }
}

// Inicializar templates al cargar el servicio
NotificationService.initializeDefaultTemplates();
