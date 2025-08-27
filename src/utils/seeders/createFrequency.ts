import {
  FrequencyData,
  IFrequency,
} from '../../interfaces/frequency.interface';
import { FrequencyModel } from '../../models';
import {
  NextDateCalculationRule,
  FrequencyType,
  FrequencyInterval,
  WeekDay,
} from '../../enums/Frequency';

const defaultFrequencies: FrequencyData[] = [
  // ===== FRECUENCIAS SIMPLES =====
  {
    name: 'Semanal',
    description: 'Visitas cada 7 días como mínimo',
    frequencyType: FrequencyType.SIMPLE,
    nextDateCalculationRule: NextDateCalculationRule.NEXT_BUSINESS_DAY,
    daysBetweenVisits: 7,
    visitsPerMonth: 4,
  },
  {
    name: 'Quincenal',
    description: 'Visitas cada 14 días, si cae mismo mes +7 días más',
    frequencyType: FrequencyType.SIMPLE,
    nextDateCalculationRule: NextDateCalculationRule.SMART_FREQUENCY,
    daysBetweenVisits: 14,
    visitsPerMonth: 2,
  },
  {
    name: 'Mensual',
    description: 'Visitas cada 28 días, si cae mismo mes +7 días más',
    frequencyType: FrequencyType.SIMPLE,
    nextDateCalculationRule: NextDateCalculationRule.SMART_FREQUENCY,
    daysBetweenVisits: 28,
    visitsPerMonth: 1,
  },
  {
    name: 'Diaria',
    description: 'Visitas diarias para casos especiales',
    frequencyType: FrequencyType.SIMPLE,
    nextDateCalculationRule: NextDateCalculationRule.NEXT_BUSINESS_DAY,
    daysBetweenVisits: 1,
    visitsPerMonth: 30,
  },

  // ===== FRECUENCIAS COMPLEJAS =====
  {
    name: 'Enfermería cada 8 horas',
    description: 'Enfermería prestacional: 3 visitas diarias cada 8 horas',
    frequencyType: FrequencyType.HOURLY,
    nextDateCalculationRule: NextDateCalculationRule.HOURLY_PATTERN,
    intervalValue: 8,
    intervalUnit: FrequencyInterval.HOURS,
    visitsPerDay: 3,
    customSchedule: {
      scheduleType: 'FIXED_HOURS',
      fixedTimes: ['08:00', '16:00', '00:00'],
    },
    respectBusinessHours: false,
    allowWeekends: true,
    allowHolidays: true,
  },
  {
    name: 'Kinesiología 2x día',
    description: 'Kinesiología: 2 visitas por día con intervalo flexible',
    frequencyType: FrequencyType.DAILY_MULTIPLE,
    nextDateCalculationRule: NextDateCalculationRule.DAILY_MULTIPLE,
    visitsPerDay: 2,
    customSchedule: {
      scheduleType: 'FLEXIBLE_INTERVALS',
      startTime: '09:00',
      intervalHours: 6,
    },
  },
  {
    name: 'Lunes-Miércoles-Viernes',
    description: 'Patrón semanal específico para rehabilitación',
    frequencyType: FrequencyType.WEEKLY_PATTERN,
    nextDateCalculationRule: NextDateCalculationRule.WEEKLY_PATTERN,
    weeklyPattern: [WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY],
    visitsPerMonth: 12,
  },
];

export const createDefaultFrequencies = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log('🚀 Iniciando creación de frecuencias por defecto...\n');
    }

    const createdFrequencies: any[] = [];
    let newFrequenciesCount = 0;

    for (const frequencyData of defaultFrequencies) {
      // Verificar si la frecuencia ya existe
      const existingFrequency = (await FrequencyModel.findOne({
        where: { name: frequencyData.name },
      })) as IFrequency | null;

      if (existingFrequency) {
        if (verbose) {
          console.log(
            `⚠️  Frecuencia "${frequencyData.name}" ya existe con ID: ${existingFrequency.id}`
          );
        }
        createdFrequencies.push(existingFrequency);
        continue;
      }

      // Crear la frecuencia
      const newFrequency = (await FrequencyModel.create({
        name: frequencyData.name,
        description: frequencyData.description,
        daysBetweenVisits: frequencyData.daysBetweenVisits,
        visitsPerMonth: frequencyData.visitsPerMonth,
        nextDateCalculationRule: frequencyData.nextDateCalculationRule,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Frecuencia "${frequencyData.name}" creada con ID: ${newFrequency.id}`
        );
      }
      createdFrequencies.push(newFrequency);
      newFrequenciesCount++;
    }

    if (!verbose && newFrequenciesCount > 0) {
      console.log(
        `✅ ${newFrequenciesCount} frecuencias nuevas creadas automáticamente`
      );
    }

    if (verbose) {
      console.log('\n🎉 Proceso de frecuencias completado!');
      console.log('\n📋 RESUMEN DE FRECUENCIAS:');
      console.log('='.repeat(60));

      createdFrequencies.forEach((frequency, index) => {
        console.log(`${index + 1}. ${frequency.name}`);
        console.log(`   ID: ${frequency.id}`);
        console.log(`   Días entre visitas: ${frequency.daysBetweenVisits}`);
        console.log(
          `   Visitas por mes: ${frequency.visitsPerMonth || 'Sin límite'}`
        );
        console.log(
          `   Regla de cálculo: ${frequency.nextDateCalculationRule}`
        );
        console.log('-'.repeat(60));
      });
    }
  } catch (error) {
    console.error('❌ Error creando frecuencias:', error);
    throw error;
  }
};

export default createDefaultFrequencies;
