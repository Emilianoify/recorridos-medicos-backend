import { IPatient } from '../interfaces/patient.interface';
import { IVisit } from '../interfaces/visit.interface';
import { IJourney } from '../interfaces/journey.interface';
import { VisitModel, JourneyModel, ProfessionalModel } from '../models';
import { PatientState } from '../enums/PatientState';
import { VisitStatus } from '../enums/Visits';
import { JourneyStatus } from '../enums/JourneyStatus';
import { UserState } from '../enums/UserState';
import { Op } from 'sequelize';
import { IProfessional } from '../interfaces/professional.interface';
import { ProfessionalState } from '../enums/ProfessionalState';

export interface IValidationResult {
  isValid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
  suggestions: string[];
  validationLevel: 'BASIC' | 'COMPREHENSIVE' | 'STRICT';
}

export interface IValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedEntities?: string[];
}

export interface IValidationWarning {
  field: string;
  code: string;
  message: string;
  impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT';
  recommendation?: string;
}

export interface IBusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'PATIENT' | 'VISIT' | 'JOURNEY' | 'PROFESSIONAL' | 'SYSTEM';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  isActive: boolean;
  validator: (entity: any, context?: any) => Promise<boolean>;
  errorMessage: string;
  warningMessage?: string;
}

export interface IValidationContext {
  userId?: string;
  userRole?: string;
  operationType:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'SCHEDULE'
    | 'CONFIRM'
    | 'COMPLETE';
  relatedEntities?: { [key: string]: any };
  timestamp: Date;
  skipRules?: string[]; // IDs de reglas a saltar
  validationLevel?: 'BASIC' | 'COMPREHENSIVE' | 'STRICT';
}

export interface IBulkValidationResult {
  overallResult: IValidationResult;
  entityResults: { [entityId: string]: IValidationResult };
  summary: {
    totalEntities: number;
    validEntities: number;
    invalidEntities: number;
    criticalErrors: number;
    warnings: number;
  };
}

export class ValidationService {
  private static businessRules: Map<string, IBusinessRule> = new Map();

  /**
   * Inicializar reglas de negocio
   */
  static initializeBusinessRules() {
    const rules: IBusinessRule[] = [
      // ===== REGLAS DE PACIENTE =====
      {
        id: 'patient_active_state',
        name: 'Paciente debe estar activo',
        description:
          'Un paciente debe estar en estado activo para recibir visitas',
        category: 'PATIENT',
        severity: 'ERROR',
        isActive: true,
        validator: async (patient: IPatient) =>
          patient.state === PatientState.ACTIVE,
        errorMessage: 'El paciente no est� en estado activo',
        warningMessage:
          'Verificar estado del paciente antes de programar visitas',
      },
      {
        id: 'patient_authorized_visits',
        name: 'Visitas autorizadas suficientes',
        description: 'El paciente debe tener visitas autorizadas disponibles',
        category: 'PATIENT',
        severity: 'ERROR',
        isActive: true,
        validator: async (patient: IPatient) => {
          if (!patient.authorizedVisitsPerMonth) return true; // Sin l�mite
          return (
            patient.completedVisitsThisMonth < patient.authorizedVisitsPerMonth
          );
        },
        errorMessage: 'El paciente ha agotado sus visitas autorizadas del mes',
      },
      {
        id: 'patient_contact_info',
        name: 'Informaci�n de contacto completa',
        description: 'El paciente debe tener al menos un m�todo de contacto',
        category: 'PATIENT',
        severity: 'WARNING',
        isActive: true,
        validator: async (patient: IPatient) => {
          return !!(patient.phone || patient.emergencyPhone);
        },
        errorMessage: 'El paciente no tiene informaci�n de contacto',
        warningMessage: 'Se recomienda tener al menos un tel�fono de contacto',
      },
      {
        id: 'patient_frequency_configured',
        name: 'Frecuencia de visitas configurada',
        description:
          'El paciente debe tener una frecuencia de visitas asignada',
        category: 'PATIENT',
        severity: 'ERROR',
        isActive: true,
        validator: async (patient: IPatient) => !!patient.frequencyId,
        errorMessage: 'El paciente no tiene frecuencia de visitas asignada',
      },

      // ===== REGLAS DE VISITA =====
      {
        id: 'visit_future_date',
        name: 'Fecha de visita futura',
        description: 'Las visitas solo pueden programarse para fechas futuras',
        category: 'VISIT',
        severity: 'ERROR',
        isActive: true,
        validator: async (visit: IVisit, _context?: IValidationContext) => {
          const now = new Date();
          return visit.scheduledDateTime > now;
        },
        errorMessage: 'No se pueden programar visitas en fechas pasadas',
      },
      {
        id: 'visit_working_hours',
        name: 'Horario laboral',
        description: 'Las visitas deben programarse en horario laboral',
        category: 'VISIT',
        severity: 'WARNING',
        isActive: true,
        validator: async (visit: IVisit) => {
          const hour = visit.scheduledDateTime.getHours();
          return hour >= 8 && hour <= 18;
        },
        errorMessage: 'Visita programada fuera del horario laboral est�ndar',
        warningMessage: 'Considerar reprogramar dentro del horario 8:00-18:00',
      },
      {
        id: 'visit_weekend_restriction',
        name: 'Restricci�n de fines de semana',
        description:
          'Las visitas en fines de semana requieren autorizaci�n especial',
        category: 'VISIT',
        severity: 'WARNING',
        isActive: true,
        validator: async (visit: IVisit) => {
          const dayOfWeek = visit.scheduledDateTime.getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6; // No domingo ni s�bado
        },
        errorMessage: 'Visita programada en fin de semana',
        warningMessage:
          'Las visitas de fin de semana requieren autorizaci�n especial',
      },
      {
        id: 'visit_max_per_day',
        name: 'M�ximo de visitas por d�a por paciente',
        description:
          'Un paciente no puede tener m�s de 3 visitas programadas el mismo d�a',
        category: 'VISIT',
        severity: 'WARNING',
        isActive: true,
        validator: async (visit: IVisit) => {
          const startOfDay = new Date(visit.scheduledDateTime);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(visit.scheduledDateTime);
          endOfDay.setHours(23, 59, 59, 999);

          const visitsCount = await VisitModel.count({
            where: {
              patientId: visit.patientId,
              scheduledDateTime: {
                [Op.between]: [startOfDay, endOfDay],
              },
              status: {
                [Op.in]: [VisitStatus.SCHEDULED],
              },
              isActive: true,
            },
          });

          return visitsCount < 3;
        },
        errorMessage:
          'El paciente ya tiene 3 visitas programadas para este d�a',
      },

      // ===== REGLAS DE RECORRIDO =====
      {
        id: 'journey_professional_active',
        name: 'Profesional activo',
        description: 'El profesional asignado debe estar en estado activo',
        category: 'JOURNEY',
        severity: 'ERROR',
        isActive: true,
        validator: async (journey: IJourney, context?: IValidationContext) => {
          if (context?.relatedEntities?.professional) {
            return (
              context.relatedEntities.professional.state === UserState.ACTIVE
            );
          }

          const professionalInstance = await ProfessionalModel.findByPk(
            journey.professionalId
          );
          const professional: IProfessional | null = professionalInstance 
            ? (professionalInstance.toJSON() as IProfessional)
            : null;
          return professional
            ? professional.state === ProfessionalState.ACTIVE
            : false;
        },
        errorMessage: 'El profesional asignado no est� activo',
      },
      {
        id: 'journey_max_visits',
        name: 'M�ximo de visitas por recorrido',
        description: 'Un recorrido no puede tener m�s de 25 visitas',
        category: 'JOURNEY',
        severity: 'ERROR',
        isActive: true,
        validator: async (journey: IJourney) => {
          if (journey.estimatedVisits) {
            return journey.estimatedVisits <= 25;
          }

          const visitsCount = await VisitModel.count({
            where: {
              journeyId: journey.id,
              isActive: true,
            },
          });

          return visitsCount <= 25;
        },
        errorMessage: 'El recorrido excede el m�ximo de 25 visitas permitidas',
      },
      {
        id: 'journey_date_range',
        name: 'Rango de fechas v�lido',
        description:
          'Los recorridos solo pueden programarse hasta 30 d�as en el futuro',
        category: 'JOURNEY',
        severity: 'WARNING',
        isActive: true,
        validator: async (journey: IJourney) => {
          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + 30);
          return new Date(journey.date) <= maxDate;
        },
        errorMessage: 'El recorrido est� programado muy lejos en el futuro',
        warningMessage:
          'Se recomienda programar recorridos con m�ximo 30 d�as de anticipaci�n',
      },
      {
        id: 'journey_time_consistency',
        name: 'Consistencia de horarios',
        description: 'La hora de fin debe ser posterior a la hora de inicio',
        category: 'JOURNEY',
        severity: 'ERROR',
        isActive: true,
        validator: async (journey: IJourney) => {
          if (!journey.plannedStartTime || !journey.plannedEndTime) return true;
          return journey.plannedEndTime > journey.plannedStartTime;
        },
        errorMessage: 'La hora de fin debe ser posterior a la hora de inicio',
      },

      // ===== REGLAS DE PROFESIONAL =====
      {
        id: 'professional_concurrent_journeys',
        name: 'Recorridos concurrentes',
        description:
          'Un profesional no puede tener m�ltiples recorridos el mismo d�a',
        category: 'PROFESSIONAL',
        severity: 'ERROR',
        isActive: true,
        validator: async (journey: IJourney) => {
          const existingJourneys = await JourneyModel.count({
            where: {
              professionalId: journey.professionalId,
              date: journey.date,
              status: {
                [Op.in]: [JourneyStatus.PLANNED, JourneyStatus.IN_PROGRESS],
              },
              isActive: true,
            },
          });

          return existingJourneys === 0;
        },
        errorMessage:
          'El profesional ya tiene un recorrido programado para esta fecha',
      },
      {
        id: 'professional_weekly_hours',
        name: 'Horas semanales m�ximas',
        description: 'Un profesional no debe exceder 48 horas semanales',
        category: 'PROFESSIONAL',
        severity: 'WARNING',
        isActive: true,
        validator: async (_journey: IJourney) => {
          // Implementar l�gica para calcular horas semanales
          // Por ahora, retornar true como placeholder
          return true;
        },
        errorMessage: 'El profesional podr�a exceder las 48 horas semanales',
        warningMessage: 'Revisar carga horaria semanal del profesional',
      },

      // ===== REGLAS DE SISTEMA =====
      {
        id: 'system_data_integrity',
        name: 'Integridad de datos',
        description: 'Verificar integridad referencial entre entidades',
        category: 'SYSTEM',
        severity: 'ERROR',
        isActive: true,
        validator: async (_entity: any, _context?: IValidationContext) => {
          // Implementar verificaciones de integridad espec�ficas
          return true;
        },
        errorMessage: 'Error de integridad de datos detectado',
      },
    ];

    // Cargar reglas en memoria
    rules.forEach(rule => {
      this.businessRules.set(rule.id, rule);
    });
  }

  /**
   * Validar un paciente
   */
  static async validatePatient(
    patient: IPatient,
    context: IValidationContext
  ): Promise<IValidationResult> {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];
    const suggestions: string[] = [];

    // Obtener reglas aplicables
    const applicableRules = Array.from(this.businessRules.values()).filter(
      rule =>
        rule.category === 'PATIENT' &&
        rule.isActive &&
        !context.skipRules?.includes(rule.id)
    );

    // Ejecutar validaciones
    for (const rule of applicableRules) {
      try {
        const isValid = await rule.validator(patient, context);

        if (!isValid) {
          if (rule.severity === 'ERROR') {
            errors.push({
              field: 'patient',
              code: rule.id,
              message: rule.errorMessage,
              severity: 'HIGH',
              affectedEntities: [patient.id],
            });
          } else if (rule.severity === 'WARNING' && rule.warningMessage) {
            warnings.push({
              field: 'patient',
              code: rule.id,
              message: rule.warningMessage,
              impact: 'MODERATE',
              recommendation: `Revisar: ${rule.description}`,
            });
          }
        }
      } catch (error: any) {
        console.error(`Error ejecutando regla ${rule.id}:`, error);
        errors.push({
          field: 'validation',
          code: 'RULE_EXECUTION_ERROR',
          message: `Error ejecutando validaci�n: ${rule.name}`,
          severity: 'MEDIUM',
        });
      }
    }

    // Validaciones espec�ficas adicionales
    if (
      patient.authorizedVisitsPerMonth &&
      patient.authorizedVisitsPerMonth > 31
    ) {
      warnings.push({
        field: 'authorizedVisitsPerMonth',
        code: 'EXCESSIVE_AUTHORIZED_VISITS',
        message: 'El paciente tiene muchas visitas autorizadas por mes',
        impact: 'MINOR',
        recommendation: 'Verificar si el l�mite es correcto',
      });
    }

    // Sugerencias
    if (
      patient.state === PatientState.ACTIVE &&
      !patient.nextScheduledVisitDate
    ) {
      suggestions.push(
        'Considerar programar la pr�xima visita para este paciente activo'
      );
    }

    if (!patient.primaryProfessionalId) {
      suggestions.push(
        'Asignar un profesional primario al paciente para mejor continuidad'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      validationLevel: context.validationLevel || 'COMPREHENSIVE',
    };
  }

  /**
   * Validar una visita
   */
  static async validateVisit(
    visit: IVisit,
    context: IValidationContext
  ): Promise<IValidationResult> {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];
    const suggestions: string[] = [];

    // Obtener reglas aplicables
    const applicableRules = Array.from(this.businessRules.values()).filter(
      rule =>
        rule.category === 'VISIT' &&
        rule.isActive &&
        !context.skipRules?.includes(rule.id)
    );

    // Ejecutar validaciones de reglas
    for (const rule of applicableRules) {
      try {
        const isValid = await rule.validator(visit, context);

        if (!isValid) {
          if (rule.severity === 'ERROR') {
            errors.push({
              field: 'visit',
              code: rule.id,
              message: rule.errorMessage,
              severity: 'HIGH',
              affectedEntities: [visit.id],
            });
          } else if (rule.severity === 'WARNING' && rule.warningMessage) {
            warnings.push({
              field: 'visit',
              code: rule.id,
              message: rule.warningMessage,
              impact: 'MODERATE',
            });
          }
        }
      } catch (error: any) {
        console.error(`Error ejecutando regla ${rule.id}:`, error);
      }
    }

    // Validar paciente asociado si est� disponible
    if (context.relatedEntities?.patient) {
      const patientValidation = await this.validatePatient(
        context.relatedEntities.patient,
        { ...context, validationLevel: 'BASIC' }
      );

      errors.push(...patientValidation.errors);
      warnings.push(...patientValidation.warnings);
    }

    // Validaciones espec�ficas de visita
    if (visit.durationMinutes && visit.durationMinutes > 240) {
      warnings.push({
        field: 'durationMinutes',
        code: 'LONG_VISIT_DURATION',
        message: 'La duraci�n de la visita es muy larga (>4 horas)',
        impact: 'MODERATE',
        recommendation: 'Verificar si la duraci�n es correcta',
      });
    }

    // Sugerencias
    if (visit.status === VisitStatus.SCHEDULED && !visit.confirmationDateTime) {
      suggestions.push('Considerar confirmar la visita con el paciente');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      validationLevel: context.validationLevel || 'COMPREHENSIVE',
    };
  }

  /**
   * Validar un recorrido
   */
  static async validateJourney(
    journey: IJourney,
    context: IValidationContext
  ): Promise<IValidationResult> {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];
    const suggestions: string[] = [];

    // Obtener reglas aplicables
    const applicableRules = Array.from(this.businessRules.values()).filter(
      rule =>
        (rule.category === 'JOURNEY' || rule.category === 'PROFESSIONAL') &&
        rule.isActive &&
        !context.skipRules?.includes(rule.id)
    );

    // Ejecutar validaciones de reglas
    for (const rule of applicableRules) {
      try {
        const isValid = await rule.validator(journey, context);

        if (!isValid) {
          if (rule.severity === 'ERROR') {
            errors.push({
              field: 'journey',
              code: rule.id,
              message: rule.errorMessage,
              severity: 'HIGH',
              affectedEntities: [journey.id],
            });
          } else if (rule.severity === 'WARNING' && rule.warningMessage) {
            warnings.push({
              field: 'journey',
              code: rule.id,
              message: rule.warningMessage,
              impact: 'MODERATE',
            });
          }
        }
      } catch (error: any) {
        console.error(`Error ejecutando regla ${rule.id}:`, error);
      }
    }

    // Validaciones espec�ficas
    if (journey.totalTravelDistance && journey.totalTravelDistance > 200) {
      warnings.push({
        field: 'totalTravelDistance',
        code: 'EXCESSIVE_TRAVEL_DISTANCE',
        message: 'La distancia total del recorrido es muy alta (>200km)',
        impact: 'SIGNIFICANT',
        recommendation: 'Considerar dividir en m�ltiples recorridos',
      });
    }

    // Sugerencias
    if (journey.status === JourneyStatus.PLANNED && !journey.plannedStartTime) {
      suggestions.push(
        'Definir horario de inicio planificado para el recorrido'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      validationLevel: context.validationLevel || 'COMPREHENSIVE',
    };
  }

  /**
   * Validaci�n masiva de entidades
   */
  static async validateBulk<T>(
    entities: T[],
    validatorFunction: (
      entity: T,
      context: IValidationContext
    ) => Promise<IValidationResult>,
    context: IValidationContext
  ): Promise<IBulkValidationResult> {
    const entityResults: { [entityId: string]: IValidationResult } = {};
    const allErrors: IValidationError[] = [];
    const allWarnings: IValidationWarning[] = [];
    const allSuggestions: string[] = [];

    let validEntities = 0;
    let invalidEntities = 0;
    let criticalErrors = 0;

    // Validar cada entidad
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const entityId = (entity as any).id || `entity_${i}`;

      try {
        const result = await validatorFunction(entity, context);
        entityResults[entityId] = result;

        if (result.isValid) {
          validEntities++;
        } else {
          invalidEntities++;
        }

        // Agregar errores y warnings al total
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
        allSuggestions.push(...result.suggestions);

        // Contar errores cr�ticos
        criticalErrors += result.errors.filter(
          e => e.severity === 'CRITICAL'
        ).length;
      } catch (error: any) {
        console.error(`Error validating entity ${entityId}:`, error);
        invalidEntities++;

        const errorResult: IValidationResult = {
          isValid: false,
          errors: [
            {
              field: 'validation',
              code: 'VALIDATION_ERROR',
              message: `Error en validaci�n: ${error.message}`,
              severity: 'HIGH',
            },
          ],
          warnings: [],
          suggestions: [],
          validationLevel: context.validationLevel || 'COMPREHENSIVE',
        };

        entityResults[entityId] = errorResult;
        allErrors.push(...errorResult.errors);
      }
    }

    // Resultado general
    const overallResult: IValidationResult = {
      isValid: invalidEntities === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: Array.from(new Set(allSuggestions)), // Eliminar duplicados
      validationLevel: context.validationLevel || 'COMPREHENSIVE',
    };

    return {
      overallResult,
      entityResults,
      summary: {
        totalEntities: entities.length,
        validEntities,
        invalidEntities,
        criticalErrors,
        warnings: allWarnings.length,
      },
    };
  }

  /**
   * Validar integridad entre entidades relacionadas
   */
  static async validateEntityIntegrity(
    mainEntity: any,
    relatedEntities: { [key: string]: any },
    context: IValidationContext
  ): Promise<IValidationResult> {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];
    const suggestions: string[] = [];

    // Verificar referencias
    if (mainEntity.patientId && !relatedEntities.patient) {
      errors.push({
        field: 'patientId',
        code: 'MISSING_PATIENT_REFERENCE',
        message: 'Referencia a paciente no encontrada',
        severity: 'CRITICAL',
      });
    }

    if (mainEntity.professionalId && !relatedEntities.professional) {
      errors.push({
        field: 'professionalId',
        code: 'MISSING_PROFESSIONAL_REFERENCE',
        message: 'Referencia a profesional no encontrada',
        severity: 'CRITICAL',
      });
    }

    // Verificar estados consistentes
    if (
      relatedEntities.patient &&
      relatedEntities.patient.state === PatientState.INACTIVE
    ) {
      if (mainEntity.status === VisitStatus.SCHEDULED) {
        warnings.push({
          field: 'patient.state',
          code: 'INACTIVE_PATIENT_SCHEDULED_VISIT',
          message: 'Visita programada para paciente inactivo',
          impact: 'SIGNIFICANT',
          recommendation: 'Activar paciente o cancelar visita',
        });
      }
    }

    // Verificar capacidad y l�mites
    if (
      relatedEntities.patient &&
      relatedEntities.patient.authorizedVisitsPerMonth
    ) {
      const { authorizedVisitsPerMonth, completedVisitsThisMonth } =
        relatedEntities.patient;
      if (completedVisitsThisMonth >= authorizedVisitsPerMonth) {
        errors.push({
          field: 'patient.authorizedVisits',
          code: 'EXCEEDED_AUTHORIZED_VISITS',
          message: 'Se han agotado las visitas autorizadas del mes',
          severity: 'HIGH',
        });
      } else if (completedVisitsThisMonth >= authorizedVisitsPerMonth * 0.8) {
        warnings.push({
          field: 'patient.authorizedVisits',
          code: 'APPROACHING_VISIT_LIMIT',
          message: 'Se est� acercando al l�mite de visitas autorizadas',
          impact: 'MODERATE',
          recommendation: 'Considerar solicitar autorizaci�n adicional',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      validationLevel: context.validationLevel || 'COMPREHENSIVE',
    };
  }

  /**
   * Validar reglas de programaci�n
   */
  static async validateSchedulingRules(
    visit: IVisit,
    existingVisits: IVisit[],
    context: IValidationContext
  ): Promise<IValidationResult> {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];
    const suggestions: string[] = [];

    // Verificar conflictos de horario
    const conflictingVisits = existingVisits.filter(existingVisit => {
      const timeDiff = Math.abs(
        visit.scheduledDateTime.getTime() -
          existingVisit.scheduledDateTime.getTime()
      );
      return timeDiff < 30 * 60 * 1000; // 30 minutos
    });

    if (conflictingVisits.length > 0) {
      errors.push({
        field: 'scheduledDateTime',
        code: 'SCHEDULING_CONFLICT',
        message: 'Conflicto de horario detectado con otras visitas',
        severity: 'HIGH',
        affectedEntities: conflictingVisits.map(v => v.id),
      });
    }

    // Verificar densidad de visitas en la zona
    const sameZoneVisits = existingVisits.filter(
      v => v.patient?.zoneId === visit.patient?.zoneId
    );

    if (sameZoneVisits.length > 10) {
      warnings.push({
        field: 'scheduling',
        code: 'HIGH_ZONE_DENSITY',
        message: 'Alta densidad de visitas en la misma zona',
        impact: 'MODERATE',
        recommendation: 'Considerar optimizar la distribuci�n de visitas',
      });
    }

    // Sugerencias de optimizaci�n
    if (existingVisits.length > 0) {
      suggestions.push(
        'Considerar agrupar visitas por zona geogr�fica para optimizar tiempos'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      validationLevel: context.validationLevel || 'COMPREHENSIVE',
    };
  }

  /**
   * Obtener reglas de negocio activas
   */
  static getActiveBusinessRules(category?: string): IBusinessRule[] {
    const rules = Array.from(this.businessRules.values()).filter(
      rule => rule.isActive
    );

    if (category) {
      return rules.filter(rule => rule.category === category);
    }

    return rules;
  }

  /**
   * Activar/desactivar regla de negocio
   */
  static toggleBusinessRule(ruleId: string, isActive: boolean): boolean {
    const rule = this.businessRules.get(ruleId);
    if (rule) {
      rule.isActive = isActive;
      this.businessRules.set(ruleId, rule);
      return true;
    }
    return false;
  }

  /**
   * Obtener estad�sticas de validaci�n
   */
  static getValidationStatistics(results: IValidationResult[]): {
    totalValidations: number;
    successRate: number;
    errorsByCode: { [code: string]: number };
    warningsByCode: { [code: string]: number };
    mostCommonErrors: Array<{ code: string; count: number; message: string }>;
    mostCommonWarnings: Array<{ code: string; count: number; message: string }>;
  } {
    const totalValidations = results.length;
    const successfulValidations = results.filter(r => r.isValid).length;
    const successRate =
      totalValidations > 0
        ? (successfulValidations / totalValidations) * 100
        : 0;

    const errorsByCode: { [code: string]: number } = {};
    const warningsByCode: { [code: string]: number } = {};
    const errorMessages: { [code: string]: string } = {};
    const warningMessages: { [code: string]: string } = {};

    results.forEach(result => {
      result.errors.forEach(error => {
        errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
        errorMessages[error.code] = error.message;
      });

      result.warnings.forEach(warning => {
        warningsByCode[warning.code] = (warningsByCode[warning.code] || 0) + 1;
        warningMessages[warning.code] = warning.message;
      });
    });

    const mostCommonErrors = Object.entries(errorsByCode)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count, message: errorMessages[code] }));

    const mostCommonWarnings = Object.entries(warningsByCode)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({
        code,
        count,
        message: warningMessages[code],
      }));

    return {
      totalValidations,
      successRate,
      errorsByCode,
      warningsByCode,
      mostCommonErrors,
      mostCommonWarnings,
    };
  }
}

// Inicializar reglas de negocio al cargar el servicio
ValidationService.initializeBusinessRules();
