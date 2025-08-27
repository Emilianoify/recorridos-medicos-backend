import { IHoliday, IHolidayData } from '../../interfaces/holiday.interface';
import { HolidayModel } from '../../models';
import { HolidayType, HolidaySource, Country } from '../../enums/Holiday';

// Feriados fijos recurrentes de Argentina (base mínima)
const defaultHolidays: IHolidayData[] = [
  {
    date: new Date(2024, 0, 1), // 1 de enero
    name: 'Año Nuevo',
    description: 'Primer día del año',
    country: Country.ARGENTINA,
    type: HolidayType.NATIONAL,
    source: HolidaySource.MANUAL,
    isRecurring: true,
    recurringDay: 1,
    recurringMonth: 1,
    allowWork: false,
  },
  {
    date: new Date(2024, 4, 1), // 1 de mayo
    name: 'Día del Trabajador',
    description: 'Día Internacional del Trabajador',
    country: Country.ARGENTINA,
    type: HolidayType.NATIONAL,
    source: HolidaySource.MANUAL,
    isRecurring: true,
    recurringDay: 1,
    recurringMonth: 5,
    allowWork: false,
  },
  {
    date: new Date(2024, 4, 25), // 25 de mayo
    name: 'Revolución de Mayo',
    description: '25 de Mayo de 1810',
    country: Country.ARGENTINA,
    type: HolidayType.NATIONAL,
    source: HolidaySource.MANUAL,
    isRecurring: true,
    recurringDay: 25,
    recurringMonth: 5,
    allowWork: false,
  },
  {
    date: new Date(2024, 6, 9), // 9 de julio
    name: 'Día de la Independencia',
    description: 'Independencia de Argentina - 9 de Julio de 1816',
    country: Country.ARGENTINA,
    type: HolidayType.NATIONAL,
    source: HolidaySource.MANUAL,
    isRecurring: true,
    recurringDay: 9,
    recurringMonth: 7,
    allowWork: false,
  },
  {
    date: new Date(2024, 11, 25), // 25 de diciembre
    name: 'Navidad',
    description: 'Natividad del Señor',
    country: Country.ARGENTINA,
    type: HolidayType.NATIONAL,
    source: HolidaySource.MANUAL,
    isRecurring: true,
    recurringDay: 25,
    recurringMonth: 12,
    allowWork: false,
  },
];

export const createDefaultHolidays = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log('🚀 Iniciando creación de feriados por defecto...\n');
    }

    const createdHolidays: any[] = [];
    let newHolidaysCount = 0;

    for (const holidayData of defaultHolidays) {
      // Verificar si el feriado ya existe
      const existingHoliday = (await HolidayModel.findOne({
        where: {
          name: holidayData.name,
          country: holidayData.country,
        },
      })) as IHoliday | null;

      if (existingHoliday) {
        if (verbose) {
          console.log(
            `⚠️  Feriado "${holidayData.name}" ya existe con ID: ${existingHoliday.id}`
          );
        }
        createdHolidays.push(existingHoliday);
        continue;
      }

      // Crear el feriado
      const newHoliday = (await HolidayModel.create({
        date: holidayData.date,
        name: holidayData.name,
        description: holidayData.description,
        country: holidayData.country,
        type: holidayData.type,
        source: holidayData.source,
        isRecurring: holidayData.isRecurring,
        recurringDay: holidayData.recurringDay,
        recurringMonth: holidayData.recurringMonth,
        allowWork: holidayData.allowWork ?? false,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Feriado "${holidayData.name}" creado con ID: ${newHoliday.id}`
        );
      }
      createdHolidays.push(newHoliday);
      newHolidaysCount++;
    }

    if (!verbose && newHolidaysCount > 0) {
      console.log(
        `✅ ${newHolidaysCount} feriados nuevos creados automáticamente`
      );
    }

    if (verbose) {
      console.log('\n🎉 Proceso de feriados completado!');
      console.log('\n📋 RESUMEN DE FERIADOS:');
      console.log('='.repeat(60));

      createdHolidays.forEach((holiday, index) => {
        console.log(`${index + 1}. ${holiday.name}`);
        console.log(`   ID: ${holiday.id}`);
        console.log(`   Fecha: ${holiday.date.toISOString().split('T')[0]}`);
        console.log(`   Recurrente: ${holiday.isRecurring ? 'Sí' : 'No'}`);
        console.log(`   Permite trabajo: ${holiday.allowWork ? 'Sí' : 'No'}`);
        console.log('-'.repeat(60));
      });

      console.log('\n💡 RECOMENDACIÓN:');
      console.log(
        'Ejecuta la sincronización con API para obtener feriados completos:'
      );
      console.log('await HolidayService.syncNationalHolidays(2024);');
    }
  } catch (error) {
    console.error('❌ Error creando feriados:', error);
    throw error;
  }
};

export default createDefaultHolidays;
