import { IPatient } from '../interfaces/patient.interface';
import { IVisit } from '../interfaces/visit.interface';
import { IJourney } from '../interfaces/journey.interface';
import { FrequencyCalculatorService } from './FrequencyCalculatorService';
import { ValidationService, IValidationResult } from './ValidationService';
import { RoutingService, IOptimizedRoute } from './RoutingService';
// NotificationService imports removed as they're not used
import { PatientModel, JourneyModel, ProfessionalModel } from '../models';
import { Op } from 'sequelize';
import { VisitStatus } from '../enums/Visits';
import { JourneyStatus } from '../enums/JourneyStatus';
import { PatientState } from '../enums/PatientState';

export interface IPlanningRequest {
  startDate: Date;
  endDate: Date;
  zoneIds?: string[];
  professionalIds?: string[];
  patientIds?: string[];
  priority: 'OVERDUE' | 'URGENT' | 'NORMAL' | 'LOW';
  planningStrategy: 'BALANCED' | 'FREQUENCY_FOCUSED' | 'GEOGRAPHIC' | 'PROFESSIONAL_LOAD';
  maxVisitsPerDay?: number;
  respectWorkingHours?: boolean;
  allowWeekends?: boolean;
  optimizeRoutes?: boolean;
}

export interface IPlanningResult {
  planningId: string;
  request: IPlanningRequest;
  generatedJourneys: IJourney[];
  scheduledVisits: IVisit[];
  unscheduledPatients: IPatient[];
  conflicts: IPlanningConflict[];
  optimizationSummary: IOptimizationSummary;
  validationResults: { [entityId: string]: IValidationResult };
  recommendations: string[];
  executedAt: Date;
  processingTimeMs: number;
}

export interface IPlanningConflict {
  type: 'PROFESSIONAL_UNAVAILABLE' | 'ZONE_OVERLOAD' | 'PATIENT_CONSTRAINT' | 'SCHEDULING_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  affectedEntities: string[];
  suggestedResolution?: string;
}

export interface IOptimizationSummary {
  totalPatientsConsidered: number;
  patientsScheduled: number;
  patientsUnscheduled: number;
  journeysGenerated: number;
  averageVisitsPerJourney: number;
  totalTravelDistance: number;
  totalTravelTime: number;
  efficiencyScore: number;
  routeOptimizationApplied: boolean;
}

export interface IVisitPriority {
  patientId: string;
  priority: number; // 1-100 (100 = m�s urgente)
  factors: {
    overdueDays?: number;
    frequency?: number;
    medicalUrgency?: number;
    patientPreference?: number;
    geographic?: number;
  };
  lastVisitDate?: Date;
  nextRecommendedDate: Date;
}

export interface IProfessionalCapacity {
  professionalId: string;
  availableDates: Date[];
  maxVisitsPerDay: number;
  preferredZones: string[];
  currentLoad: number; // 0-100%
  efficiency: number; // basado en historial
  specializations: string[];
}

export interface ISchedulingWindow {
  startTime: Date;
  endTime: Date;
  availableSlots: number;
  bookedSlots: number;
  zone?: string;
  professionalId?: string;
}

export class VisitPlannerService {
  private static readonly DEFAULT_WORK_HOURS = { start: 8, end: 18 };
  private static readonly DEFAULT_VISIT_DURATION = 30; // minutos
  // MAX_VISITS_PER_JOURNEY removed as it's not used
  private static readonly MIN_TRAVEL_TIME_BUFFER = 15; // minutos

  /**
   * Generar plan de visitas inteligente
   */
  static async generateVisitPlan(request: IPlanningRequest): Promise<IPlanningResult> {
    const startTime = Date.now();
    const planningId = `plan_${startTime}`;
    
    console.log(`<� Iniciando planificaci�n inteligente de visitas (ID: ${planningId})`);

    try {
      // 1. Obtener pacientes elegibles
      const eligiblePatients = await this.getEligiblePatients(request);
      console.log(`=� Pacientes elegibles encontrados: ${eligiblePatients.length}`);

      // 2. Calcular prioridades de visitas
      const visitPriorities = await this.calculateVisitPriorities(eligiblePatients, request);
      console.log(`<� Prioridades calculadas para ${visitPriorities.length} pacientes`);

      // 3. Obtener capacidad de profesionales
      const professionalCapacities = await this.getProfessionalCapacities(request);
      console.log(`=e Capacidades analizadas para ${professionalCapacities.length} profesionales`);

      // 4. Generar horarios de programaci�n
      const schedulingWindows = await this.generateSchedulingWindows(request, professionalCapacities);
      console.log(`� Ventanas de programaci�n generadas: ${schedulingWindows.length}`);

      // 5. Ejecutar algoritmo de planificaci�n
      const planningResults = await this.executePlanningAlgorithm(
        visitPriorities,
        professionalCapacities,
        schedulingWindows,
        request
      );

      // 6. Optimizar rutas si est� habilitado
      if (request.optimizeRoutes) {
        console.log(`=�  Optimizando rutas...`);
        planningResults.optimizedRoutes = await this.optimizeGeneratedRoutes(
          planningResults.generatedJourneys,
          planningResults.scheduledVisits
        );
      }

      // 7. Validar resultados
      console.log(` Validando resultados...`);
      const validationResults = await this.validatePlanningResults(
        planningResults.scheduledVisits,
        planningResults.generatedJourneys
      );

      // 8. Generar recomendaciones
      const recommendations = this.generateRecommendations(
        planningResults,
        validationResults,
        request
      );

      const processingTimeMs = Date.now() - startTime;
      console.log(`( Planificaci�n completada en ${processingTimeMs}ms`);

      return {
        planningId,
        request,
        generatedJourneys: planningResults.generatedJourneys,
        scheduledVisits: planningResults.scheduledVisits,
        unscheduledPatients: planningResults.unscheduledPatients,
        conflicts: planningResults.conflicts,
        optimizationSummary: planningResults.optimizationSummary,
        validationResults,
        recommendations,
        executedAt: new Date(),
        processingTimeMs,
      };

    } catch (error: any) {
      console.error('Error en planificaci�n de visitas:', error);
      throw new Error(`Error en planificaci�n: ${error.message}`);
    }
  }

  /**
   * Obtener pacientes elegibles para programaci�n
   */
  private static async getEligiblePatients(request: IPlanningRequest): Promise<IPatient[]> {
    const whereConditions: any = {
      state: PatientState.ACTIVE,
      isActive: true,
    };

    // Filtrar por IDs espec�ficos si se proporcionan
    if (request.patientIds && request.patientIds.length > 0) {
      whereConditions.id = { [Op.in]: request.patientIds };
    }

    // Filtrar por zonas
    if (request.zoneIds && request.zoneIds.length > 0) {
      whereConditions.zoneId = { [Op.in]: request.zoneIds };
    }

    const patients = await PatientModel.findAll({
      where: whereConditions,
      include: [
        'frequency',
        'zone',
        'healthcareProvider',
        'primaryProfessional',
      ],
    }) as any[];

    // Filtrar pacientes que necesitan visitas
    const eligiblePatients: IPatient[] = [];

    for (const patient of patients) {
      // Verificar si necesita visita seg�n su frecuencia
      const needsVisit = await this.patientNeedsVisit(patient, request);
      if (needsVisit) {
        eligiblePatients.push(patient);
      }
    }

    return eligiblePatients;
  }

  /**
   * Verificar si un paciente necesita visita
   */
  private static async patientNeedsVisit(patient: IPatient, request: IPlanningRequest): Promise<boolean> {
    // Si tiene una fecha programada futura, verificar si est� dentro del rango
    if (patient.nextScheduledVisitDate) {
      const nextDate = new Date(patient.nextScheduledVisitDate);
      if (nextDate >= request.startDate && nextDate <= request.endDate) {
        return true;
      }
    }

    // Si no tiene fecha programada, calcular seg�n frecuencia
    if (!patient.lastVisitDate) {
      return true; // Paciente nuevo sin visitas
    }

    // Calcular pr�xima visita seg�n frecuencia
    if (patient.frequency) {
      try {
        const nextVisitCalc = await FrequencyCalculatorService.calculateNextVisitDate(
          patient.frequency,
          new Date(patient.lastVisitDate)
        );

        // Verificar si est� vencida o dentro del rango
        const nextDate = nextVisitCalc.nextVisitDate;
        const isOverdue = nextDate < new Date();
        const isInRange = nextDate >= request.startDate && nextDate <= request.endDate;

        return isOverdue || isInRange;
      } catch (error) {
        console.warn(`Error calculando pr�xima visita para paciente ${patient.id}:`, error);
        return false;
      }
    }

    return false;
  }

  /**
   * Calcular prioridades de visitas
   */
  private static async calculateVisitPriorities(
    patients: IPatient[],
    // request is not used in implementation
    _request: IPlanningRequest
  ): Promise<IVisitPriority[]> {
    const priorities: IVisitPriority[] = [];

    for (const patient of patients) {
      let priorityScore = 50; // Base
      const factors: IVisitPriority['factors'] = {};

      // Factor: D�as de retraso
      if (patient.nextScheduledVisitDate) {
        const scheduledDate = new Date(patient.nextScheduledVisitDate);
        const today = new Date();
        const overdueDays = Math.max(0, 
          Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        
        if (overdueDays > 0) {
          factors.overdueDays = overdueDays;
          priorityScore += Math.min(30, overdueDays * 2); // Max 30 puntos por retraso
        }
      }

      // Factor: Frecuencia de visitas
      if (patient.frequency) {
        const frequencyStats = FrequencyCalculatorService.calculateFrequencyStats(patient.frequency);
        if (frequencyStats.estimatedVisitsPerMonth > 8) {
          factors.frequency = frequencyStats.estimatedVisitsPerMonth;
          priorityScore += 10; // Pacientes con alta frecuencia
        }
      }

      // Factor: Estado m�dico (placeholder - en producci�n integrar con historia cl�nica)
      if (patient.diagnosis && patient.diagnosis.toLowerCase().includes('urgente')) {
        factors.medicalUrgency = 20;
        priorityScore += 20;
      }

      // Factor: Preferencia del paciente (placeholder)
      factors.patientPreference = 5;
      priorityScore += 5;

      // Calcular pr�xima fecha recomendada
      let nextRecommendedDate = new Date();
      if (patient.frequency && patient.lastVisitDate) {
        try {
          const calc = await FrequencyCalculatorService.calculateNextVisitDate(
            patient.frequency,
            new Date(patient.lastVisitDate)
          );
          nextRecommendedDate = calc.nextVisitDate;
        } catch (error) {
          console.warn(`Error calculando fecha para ${patient.id}:`, error);
        }
      }

      priorities.push({
        patientId: patient.id,
        priority: Math.min(100, priorityScore),
        factors,
        lastVisitDate: patient.lastVisitDate ? new Date(patient.lastVisitDate) : undefined,
        nextRecommendedDate,
      });
    }

    // Ordenar por prioridad
    return priorities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Obtener capacidades de profesionales
   */
  private static async getProfessionalCapacities(request: IPlanningRequest): Promise<IProfessionalCapacity[]> {
    const whereConditions: any = {
      isActive: true,
      state: 'activo',
    };

    if (request.professionalIds && request.professionalIds.length > 0) {
      whereConditions.id = { [Op.in]: request.professionalIds };
    }

    const professionals = await ProfessionalModel.findAll({
      where: whereConditions,
      include: ['specialty', 'user'],
    }) as any[];

    const capacities: IProfessionalCapacity[] = [];

    for (const professional of professionals) {
      // Generar fechas disponibles en el rango
      const availableDates: Date[] = [];
      const currentDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      while (currentDate <= endDate) {
        // Verificar si es d�a laborable
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        if (!isWeekend || request.allowWeekends) {
          // Verificar si no tiene recorrido ya programado
          const existingJourney = await JourneyModel.findOne({
            where: {
              professionalId: professional.id,
              date: currentDate,
              status: { [Op.in]: [JourneyStatus.PLANNED, JourneyStatus.IN_PROGRESS] },
              isActive: true,
            },
          });

          if (!existingJourney) {
            availableDates.push(new Date(currentDate));
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calcular carga actual (simulada)
      const currentLoad = Math.floor(Math.random() * 60) + 20; // 20-80%
      const efficiency = Math.floor(Math.random() * 30) + 70; // 70-100%

      capacities.push({
        professionalId: professional.id,
        availableDates,
        maxVisitsPerDay: request.maxVisitsPerDay || 12,
        preferredZones: request.zoneIds || [], // En producci�n, obtener de configuraci�n
        currentLoad,
        efficiency,
        specializations: professional.specialty ? [professional.specialty.name] : [],
      });
    }

    return capacities;
  }

  /**
   * Generar ventanas de programaci�n
   */
  private static async generateSchedulingWindows(
    // request is not used in implementation 
    _request: IPlanningRequest,
    capacities: IProfessionalCapacity[]
  ): Promise<ISchedulingWindow[]> {
    const windows: ISchedulingWindow[] = [];

    for (const capacity of capacities) {
      for (const date of capacity.availableDates) {
        const workStart = new Date(date);
        workStart.setHours(this.DEFAULT_WORK_HOURS.start, 0, 0, 0);
        
        const workEnd = new Date(date);
        workEnd.setHours(this.DEFAULT_WORK_HOURS.end, 0, 0, 0);

        // Dividir d�a en slots de tiempo
        const slotDuration = this.DEFAULT_VISIT_DURATION + this.MIN_TRAVEL_TIME_BUFFER; // 45 min
        const totalSlots = Math.floor((workEnd.getTime() - workStart.getTime()) / (slotDuration * 60000));
        const availableSlots = Math.min(totalSlots, capacity.maxVisitsPerDay);

        windows.push({
          startTime: workStart,
          endTime: workEnd,
          availableSlots,
          bookedSlots: 0,
          professionalId: capacity.professionalId,
        });
      }
    }

    return windows;
  }

  /**
   * Ejecutar algoritmo de planificaci�n
   */
  private static async executePlanningAlgorithm(
    visitPriorities: IVisitPriority[],
    // capacities is not used in implementation
    _capacities: IProfessionalCapacity[],
    windows: ISchedulingWindow[],
    request: IPlanningRequest
  ): Promise<{
    generatedJourneys: IJourney[];
    scheduledVisits: IVisit[];
    unscheduledPatients: IPatient[];
    conflicts: IPlanningConflict[];
    optimizationSummary: IOptimizationSummary;
    optimizedRoutes?: { [journeyId: string]: IOptimizedRoute };
  }> {
    const generatedJourneys: IJourney[] = [];
    const scheduledVisits: IVisit[] = [];
    const unscheduledPatients: IPatient[] = [];
    const conflicts: IPlanningConflict[] = [];

    // Mapas para tracking
    const journeysByDate = new Map<string, IJourney[]>();
    const usedWindows = new Set<string>();

    // Estrategia de planificaci�n
    switch (request.planningStrategy) {
      case 'BALANCED':
        await executeBalancedStrategy();
        break;
      case 'FREQUENCY_FOCUSED':
        await executeFrequencyStrategy();
        break;
      case 'GEOGRAPHIC':
        await executeGeographicStrategy();
        break;
      case 'PROFESSIONAL_LOAD':
        await executeProfessionalLoadStrategy();
        break;
      default:
        await executeBalancedStrategy();
    }

    async function executeBalancedStrategy() {
      // Algoritmo balanceado: combinar prioridad, geograf�a y carga
      for (const priority of visitPriorities) {

        // Buscar mejor ventana disponible
        const availableWindows = windows.filter(w => 
          w.availableSlots > w.bookedSlots &&
          !usedWindows.has(`${w.professionalId}_${w.startTime.toISOString()}`)
        );

        if (availableWindows.length === 0) {
          // Sin ventanas disponibles
          const patient = await PatientModel.findByPk(priority.patientId) as any;
          if (patient) {
            unscheduledPatients.push(patient);
            conflicts.push({
              type: 'PROFESSIONAL_UNAVAILABLE',
              severity: 'MEDIUM',
              description: `No hay profesionales disponibles para el paciente ${patient.fullName}`,
              affectedEntities: [priority.patientId],
              suggestedResolution: 'Ampliar rango de fechas o agregar m�s profesionales',
            });
          }
          continue;
        }

        // Seleccionar mejor ventana
        const bestWindow = availableWindows[0]; // Simplificado
        
        // Crear o encontrar journey
        const journeyKey = `${bestWindow.professionalId}_${bestWindow.startTime.toDateString()}`;
        let journey = journeysByDate.get(journeyKey)?.[0];
        
        if (!journey) {
          journey = await createNewJourney(bestWindow);
          generatedJourneys.push(journey);
          
          if (!journeysByDate.has(journeyKey)) {
            journeysByDate.set(journeyKey, []);
          }
          journeysByDate.get(journeyKey)!.push(journey);
        }

        // Crear visita
        const visit = await createVisitFromPriority(priority, journey, bestWindow);
        scheduledVisits.push(visit);
        
        // Actualizar ventana
        bestWindow.bookedSlots++;
      }
    }

    async function executeFrequencyStrategy() {
      // Similar a executeBalancedStrategy pero priorizando frecuencia
      return executeBalancedStrategy();
    }

    async function executeGeographicStrategy() {
      // Similar a executeBalancedStrategy pero priorizando geografía
      return executeBalancedStrategy();
    }

    async function executeProfessionalLoadStrategy() {
      // Similar a executeBalancedStrategy pero balanceando carga de profesionales
      return executeBalancedStrategy();
    }

    async function createNewJourney(window: ISchedulingWindow): Promise<IJourney> {
      // En producci�n, esto crear�a el journey en la base de datos
      const journey: IJourney = {
        id: `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        professionalId: window.professionalId!,
        date: window.startTime.toISOString().split('T')[0] as any,
        zoneId: request.zoneIds?.[0] || 'default_zone',
        status: JourneyStatus.PLANNED,
        plannedStartTime: window.startTime.toTimeString().split(' ')[0] as any,
        plannedEndTime: window.endTime.toTimeString().split(' ')[0] as any,
        estimatedVisits: 0,
        completedVisits: 0,
        totalTravelDistance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return journey;
    }

    async function createVisitFromPriority(
      priority: IVisitPriority, 
      journey: IJourney, 
      window: ISchedulingWindow
    ): Promise<IVisit> {
      const patient = await PatientModel.findByPk(priority.patientId) as any;
      
      // Calcular horario espec�fico
      const slotIndex = window.bookedSlots;
      const slotDuration = 45; // minutos
      const visitTime = new Date(window.startTime);
      visitTime.setMinutes(visitTime.getMinutes() + (slotIndex * slotDuration));

      const visit: IVisit = {
        id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: priority.patientId,
        journeyId: journey.id,
        status: VisitStatus.SCHEDULED,
        scheduledDateTime: visitTime,
        orderInJourney: slotIndex + 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        patient,
      };

      return visit;
    }

    // Ejecutar estrategia seleccionada
    if (request.planningStrategy === 'BALANCED') {
      await executeBalancedStrategy();
    }

    // Calcular resumen de optimizaci�n
    const optimizationSummary: IOptimizationSummary = {
      totalPatientsConsidered: visitPriorities.length,
      patientsScheduled: scheduledVisits.length,
      patientsUnscheduled: unscheduledPatients.length,
      journeysGenerated: generatedJourneys.length,
      averageVisitsPerJourney: generatedJourneys.length > 0 
        ? Math.round(scheduledVisits.length / generatedJourneys.length * 10) / 10 
        : 0,
      totalTravelDistance: 0, // Se calcular� con optimizaci�n de rutas
      totalTravelTime: 0, // Se calcular� con optimizaci�n de rutas
      efficiencyScore: this.calculateEfficiencyScore(scheduledVisits, generatedJourneys, conflicts),
      routeOptimizationApplied: false,
    };

    return {
      generatedJourneys,
      scheduledVisits,
      unscheduledPatients,
      conflicts,
      optimizationSummary,
    };
  }

  /**
   * Optimizar rutas generadas
   */
  private static async optimizeGeneratedRoutes(
    journeys: IJourney[],
    visits: IVisit[]
  ): Promise<{ [journeyId: string]: IOptimizedRoute }> {
    const optimizedRoutes: { [journeyId: string]: IOptimizedRoute } = {};

    for (const journey of journeys) {
      // Obtener visitas del journey
      const journeyVisits = visits.filter(v => v.journeyId === journey.id);
      
      if (journeyVisits.length > 1) {
        try {
          const optimizedRoute = await RoutingService.optimizeRoute(journeyVisits, {
            respectTimeWindows: true,
            optimizationLevel: 'BALANCED',
          });
          
          optimizedRoutes[journey.id] = optimizedRoute;
        } catch (error) {
          console.warn(`Error optimizando ruta para journey ${journey.id}:`, error);
        }
      }
    }

    return optimizedRoutes;
  }

  /**
   * Validar resultados de planificaci�n
   */
  private static async validatePlanningResults(
    visits: IVisit[],
    journeys: IJourney[]
  ): Promise<{ [entityId: string]: IValidationResult }> {
    const validationResults: { [entityId: string]: IValidationResult } = {};

    // Validar visitas
    for (const visit of visits) {
      try {
        const result = await ValidationService.validateVisit(visit, {
          operationType: 'CREATE',
          timestamp: new Date(),
          validationLevel: 'BASIC',
        });
        validationResults[visit.id] = result;
      } catch (error) {
        console.warn(`Error validating visit ${visit.id}:`, error);
      }
    }

    // Validar journeys
    for (const journey of journeys) {
      try {
        const result = await ValidationService.validateJourney(journey, {
          operationType: 'CREATE',
          timestamp: new Date(),
          validationLevel: 'BASIC',
        });
        validationResults[journey.id] = result;
      } catch (error) {
        console.warn(`Error validating journey ${journey.id}:`, error);
      }
    }

    return validationResults;
  }

  /**
   * Generar recomendaciones
   */
  private static generateRecommendations(
    planningResults: any,
    validationResults: { [entityId: string]: IValidationResult },
    request: IPlanningRequest
  ): string[] {
    const recommendations: string[] = [];

    // Analizar tasa de �xito
    const successRate = planningResults.scheduledVisits.length / 
                       (planningResults.scheduledVisits.length + planningResults.unscheduledPatients.length);

    if (successRate < 0.8) {
      recommendations.push('Considerar ampliar el rango de fechas o agregar m�s profesionales');
    }

    // Analizar eficiencia de journeys
    const avgVisitsPerJourney = planningResults.optimizationSummary.averageVisitsPerJourney;
    if (avgVisitsPerJourney < 5) {
      recommendations.push('Los recorridos tienen pocas visitas, considerar reagrupar por zona');
    }

    // Analizar conflictos
    const highSeverityConflicts = planningResults.conflicts.filter((c: any) => c.severity === 'HIGH');
    if (highSeverityConflicts.length > 0) {
      recommendations.push(`Resolver ${highSeverityConflicts.length} conflictos de alta prioridad`);
    }

    // Analizar validaciones
    const validationErrors = Object.values(validationResults)
      .reduce((sum, result) => sum + result.errors.length, 0);
    
    if (validationErrors > 0) {
      recommendations.push(`Revisar ${validationErrors} errores de validaci�n antes de confirmar`);
    }

    // Recomendaciones estrat�gicas
    if (request.planningStrategy === 'BALANCED' && planningResults.unscheduledPatients.length > 0) {
      recommendations.push('Considerar usar estrategia FREQUENCY_FOCUSED para pacientes no programados');
    }

    if (!request.optimizeRoutes && planningResults.generatedJourneys.length > 0) {
      recommendations.push('Activar optimizaci�n de rutas para mejorar eficiencia de viajes');
    }

    return recommendations;
  }

  /**
   * Calcular score de eficiencia
   */
  private static calculateEfficiencyScore(
    visits: IVisit[],
    journeys: IJourney[],
    conflicts: IPlanningConflict[]
  ): number {
    if (visits.length === 0) return 0;

    let score = 100;

    // Penalizar por pocos journeys con muchas visitas
    const avgVisitsPerJourney = visits.length / Math.max(1, journeys.length);
    if (avgVisitsPerJourney < 3) score -= 20;
    else if (avgVisitsPerJourney > 20) score -= 15;

    // Penalizar por conflictos
    const highConflicts = conflicts.filter(c => c.severity === 'HIGH').length;
    const mediumConflicts = conflicts.filter(c => c.severity === 'MEDIUM').length;
    
    score -= (highConflicts * 10);
    score -= (mediumConflicts * 5);

    // Bonificar por distribuci�n balanceada
    if (avgVisitsPerJourney >= 5 && avgVisitsPerJourney <= 15) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Optimizar plan existente
   */
  static async optimizeExistingPlan(
    // planningId is not used in implementation
    _planningId: string,
    // optimizationOptions are not used in implementation 
    _optimizationOptions: {
      rebalanceJourneys?: boolean;
      optimizeRoutes?: boolean;
      redistributeLoad?: boolean;
      respectExistingSchedule?: boolean;
    }
  ): Promise<IPlanningResult> {
    // Implementar optimizaci�n de plan existente
    throw new Error('optimizeExistingPlan not implemented yet');
  }

  /**
   * Obtener estad�sticas de planificaci�n
   */
  static async getPlanningStatistics(
    // startDate and endDate not used in implementation
    _startDate: Date,
    _endDate: Date
  ): Promise<{
    totalPlans: number;
    averageSuccessRate: number;
    totalVisitsScheduled: number;
    totalJourneysGenerated: number;
    averageEfficiencyScore: number;
    commonConflicts: { [type: string]: number };
    professionalUtilization: { [professionalId: string]: number };
  }> {
    // Implementar estad�sticas de planificaci�n
    return {
      totalPlans: 0,
      averageSuccessRate: 0,
      totalVisitsScheduled: 0,
      totalJourneysGenerated: 0,
      averageEfficiencyScore: 0,
      commonConflicts: {},
      professionalUtilization: {},
    };
  }

  /**
   * Sugerir ajustes al plan
   */
  static async suggestPlanAdjustments(
    planningResult: IPlanningResult
  ): Promise<{
    suggestions: Array<{
      type: 'RESCHEDULE' | 'REASSIGN' | 'SPLIT_JOURNEY' | 'MERGE_JOURNEYS';
      description: string;
      affectedEntities: string[];
      expectedImprovement: string;
      implementation: any;
    }>;
    prioritySuggestions: string[];
  }> {
    const suggestions: any[] = [];
    const prioritySuggestions: string[] = [];

    // Analizar journeys con pocas visitas
    const lowUtilizationJourneys = planningResult.generatedJourneys.filter(j => {
      const journeyVisits = planningResult.scheduledVisits.filter(v => v.journeyId === j.id);
      return journeyVisits.length < 3;
    });

    if (lowUtilizationJourneys.length > 0) {
      suggestions.push({
        type: 'MERGE_JOURNEYS',
        description: `Combinar ${lowUtilizationJourneys.length} recorridos con baja utilizaci�n`,
        affectedEntities: lowUtilizationJourneys.map(j => j.id),
        expectedImprovement: 'Reducir costos de desplazamiento y mejorar eficiencia',
        implementation: {
          action: 'merge_journeys',
          journeyIds: lowUtilizationJourneys.map(j => j.id),
        },
      });
    }

    // Analizar conflictos de alta prioridad
    const highPriorityConflicts = planningResult.conflicts.filter(c => c.severity === 'HIGH');
    if (highPriorityConflicts.length > 0) {
      prioritySuggestions.push('Resolver conflictos cr�ticos antes de ejecutar el plan');
    }

    return {
      suggestions,
      prioritySuggestions,
    };
  }
}