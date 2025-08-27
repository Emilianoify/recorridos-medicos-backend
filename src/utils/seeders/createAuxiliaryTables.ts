import {
  IConfirmationStatus,
  IConfirmationStatusData,
  INotCompletedReason,
  INotCompletedReasonData,
  IRejectionReason,
  IRejectionReasonData,
} from '../../interfaces/auxiliaryTables.interface';
import {
  ConfirmationStatusModel,
  NotCompletedReasonModel,
  RejectionReasonModel,
} from '../../models';

// Datos por defecto para estados de confirmación
const defaultConfirmationStatuses: IConfirmationStatusData[] = [
  {
    name: 'Pendiente',
    description: 'Confirmación pendiente, aún no se ha contactado al paciente',
  },
  {
    name: 'Confirmada',
    description: 'Paciente confirmó la visita, proceder según planificado',
  },
  {
    name: 'Rechazada',
    description: 'Paciente rechazó la visita, requiere reprogramación',
  },
  {
    name: 'Sin Respuesta',
    description: 'No se pudo contactar al paciente o no respondió',
  },
];

// Datos por defecto para motivos de visitas no completadas
const defaultNotCompletedReasons: INotCompletedReasonData[] = [
  {
    name: 'Paciente no encontrado',
    description:
      'El paciente no se encontraba en el domicilio al momento de la visita',
    category: 'PACIENTE',
    requiresReschedule: true,
  },
  {
    name: 'Paciente internado',
    description: 'El paciente se encuentra hospitalizado',
    category: 'MEDICO',
    requiresReschedule: false,
  },
  {
    name: 'Paciente de viaje',
    description: 'El paciente se encuentra fuera de la ciudad',
    category: 'PACIENTE',
    requiresReschedule: true,
  },
  {
    name: 'Domicilio no encontrado',
    description: 'No se pudo localizar la dirección indicada',
    category: 'DOMICILIO',
    requiresReschedule: true,
  },
  {
    name: 'Problema del profesional',
    description: 'Inconveniente personal o técnico del profesional',
    category: 'PROFESIONAL',
    requiresReschedule: true,
  },
  {
    name: 'Condiciones climáticas adversas',
    description: 'Clima impide la realización segura de la visita',
    category: 'CLIMA',
    requiresReschedule: true,
  },
  {
    name: 'Razones de seguridad',
    description: 'Situación de inseguridad en la zona',
    category: 'LOGISTICO',
    requiresReschedule: true,
  },
];

// Datos por defecto para motivos de rechazo en confirmación
const defaultRejectionReasons: IRejectionReasonData[] = [
  {
    name: 'Paciente internado',
    description: 'El paciente fue hospitalizado',
    category: 'MEDICO',
    suggestedAction: 'SUSPENDER',
  },
  {
    name: 'Paciente mejorado',
    description: 'El paciente indica sentirse mejor y no necesitar la visita',
    category: 'MEDICO',
    suggestedAction: 'DERIVAR',
  },
  {
    name: 'Paciente de viaje',
    description: 'El paciente no estará disponible por viaje',
    category: 'PERSONAL',
    suggestedAction: 'REPROGRAMAR',
  },
  {
    name: 'Conflicto de horario',
    description: 'El horario propuesto no es conveniente para el paciente',
    category: 'LOGISTICO',
    suggestedAction: 'REPROGRAMAR',
  },
  {
    name: 'Familia no disponible',
    description: 'Los familiares responsables no estarán presentes',
    category: 'PERSONAL',
    suggestedAction: 'REPROGRAMAR',
  },
  {
    name: 'Paciente rechaza visita',
    description: 'El paciente expresamente no desea recibir la visita',
    category: 'PERSONAL',
    suggestedAction: 'CONTACTAR_FAMILIA',
  },
];

// Función para crear estados de confirmación
export const createDefaultConfirmationStatuses = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log(
        '🚀 Iniciando creación de estados de confirmación por defecto...\n'
      );
    }

    const createdStatuses: any[] = [];
    let newStatusesCount = 0;

    for (const statusData of defaultConfirmationStatuses) {
      // Verificar si el estado ya existe
      const existingStatus = (await ConfirmationStatusModel.findOne({
        where: { name: statusData.name },
      })) as IConfirmationStatus | null;

      if (existingStatus) {
        if (verbose) {
          console.log(
            `⚠️  Estado "${statusData.name}" ya existe con ID: ${existingStatus.id}`
          );
        }
        createdStatuses.push(existingStatus);
        continue;
      }

      // Crear el estado
      const newStatus = (await ConfirmationStatusModel.create({
        name: statusData.name,
        description: statusData.description,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Estado "${statusData.name}" creado con ID: ${newStatus.id}`
        );
      }
      createdStatuses.push(newStatus);
      newStatusesCount++;
    }

    if (!verbose && newStatusesCount > 0) {
      console.log(
        `✅ ${newStatusesCount} estados de confirmación nuevos creados automáticamente`
      );
    }

    if (verbose) {
      console.log('\n🎉 Proceso de estados de confirmación completado!');
    }
  } catch (error) {
    console.error('❌ Error creando estados de confirmación:', error);
    throw error;
  }
};

// Función para crear motivos de visitas no completadas
export const createDefaultNotCompletedReasons = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log(
        '🚀 Iniciando creación de motivos de visitas no completadas...\n'
      );
    }

    const createdReasons: any[] = [];
    let newReasonsCount = 0;

    for (const reasonData of defaultNotCompletedReasons) {
      // Verificar si el motivo ya existe
      const existingReason = (await NotCompletedReasonModel.findOne({
        where: { name: reasonData.name },
      })) as INotCompletedReason | null;

      if (existingReason) {
        if (verbose) {
          console.log(
            `⚠️  Motivo "${reasonData.name}" ya existe con ID: ${existingReason.id}`
          );
        }
        createdReasons.push(existingReason);
        continue;
      }

      // Crear el motivo
      const newReason = (await NotCompletedReasonModel.create({
        name: reasonData.name,
        description: reasonData.description,
        category: reasonData.category,
        requiresReschedule: reasonData.requiresReschedule ?? true,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Motivo "${reasonData.name}" creado con ID: ${newReason.id}`
        );
      }
      createdReasons.push(newReason);
      newReasonsCount++;
    }

    if (!verbose && newReasonsCount > 0) {
      console.log(
        `✅ ${newReasonsCount} motivos de visitas no completadas creados automáticamente`
      );
    }

    if (verbose) {
      console.log(
        '\n🎉 Proceso de motivos de visitas no completadas completado!'
      );
    }
  } catch (error) {
    console.error('❌ Error creando motivos de visitas no completadas:', error);
    throw error;
  }
};

// Función para crear motivos de rechazo
export const createDefaultRejectionReasons = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log('🚀 Iniciando creación de motivos de rechazo...\n');
    }

    const createdReasons: any[] = [];
    let newReasonsCount = 0;

    for (const reasonData of defaultRejectionReasons) {
      // Verificar si el motivo ya existe
      const existingReason = (await RejectionReasonModel.findOne({
        where: { name: reasonData.name },
      })) as IRejectionReason | null;

      if (existingReason) {
        if (verbose) {
          console.log(
            `⚠️  Motivo "${reasonData.name}" ya existe con ID: ${existingReason.id}`
          );
        }
        createdReasons.push(existingReason);
        continue;
      }

      // Crear el motivo
      const newReason = (await RejectionReasonModel.create({
        name: reasonData.name,
        description: reasonData.description,
        category: reasonData.category,
        suggestedAction: reasonData.suggestedAction,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Motivo "${reasonData.name}" creado con ID: ${newReason.id}`
        );
      }
      createdReasons.push(newReason);
      newReasonsCount++;
    }

    if (!verbose && newReasonsCount > 0) {
      console.log(
        `✅ ${newReasonsCount} motivos de rechazo creados automáticamente`
      );
    }

    if (verbose) {
      console.log('\n🎉 Proceso de motivos de rechazo completado!');
    }
  } catch (error) {
    console.error('❌ Error creando motivos de rechazo:', error);
    throw error;
  }
};

// Función principal para crear todas las tablas auxiliares
export const createAllAuxiliaryTables = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    await createDefaultConfirmationStatuses(verbose);
    await createDefaultNotCompletedReasons(verbose);
    await createDefaultRejectionReasons(verbose);

    if (!verbose) {
      console.log('✅ Tablas auxiliares creadas exitosamente');
    }
  } catch (error) {
    console.error('❌ Error creando tablas auxiliares:', error);
    throw error;
  }
};

export default createAllAuxiliaryTables;

// Exportar los datos para usar en otros lugares si es necesario
export {
  defaultConfirmationStatuses,
  defaultNotCompletedReasons,
  defaultRejectionReasons,
};
