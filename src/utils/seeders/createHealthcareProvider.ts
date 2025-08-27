import {
  IHealthcareProvider,
  IHealthcareProviderData,
} from '../../interfaces/healthcareProvider.interface';
import { HealthcareProviderModel } from '../../models';

const defaultHealthcareProviders: IHealthcareProviderData[] = [
  {
    name: 'OSDE',
    code: 'OSDE',
  },
  {
    name: 'Swiss Medical',
    code: 'SWISS',
  },
  {
    name: 'Galeno',
    code: 'GALENO',
  },
  {
    name: 'Medicus',
    code: 'MEDICUS',
  },
  {
    name: 'IOMA',
    code: 'IOMA',
  },
  {
    name: 'PAMI',
    code: 'PAMI',
  },
  {
    name: 'Obra Social Empleados de Comercio',
    code: 'OSECAC',
  },
  {
    name: 'Obra Social de la UOM',
    code: 'UOM',
  },
  {
    name: 'Sancor Salud',
    code: 'SANCOR',
  },
  {
    name: 'Particular',
    code: 'PARTICULAR',
  },
];

export const createDefaultHealthcareProviders = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log('🚀 Iniciando creación de obras sociales por defecto...\n');
    }

    const createdProviders: any[] = [];
    let newProvidersCount = 0;

    for (const providerData of defaultHealthcareProviders) {
      // Verificar si la obra social ya existe
      const existingProvider = (await HealthcareProviderModel.findOne({
        where: { name: providerData.name },
      })) as IHealthcareProvider | null;

      if (existingProvider) {
        if (verbose) {
          console.log(
            `⚠️  Obra social "${providerData.name}" ya existe con ID: ${existingProvider.id}`
          );
        }
        createdProviders.push(existingProvider);
        continue;
      }

      // Crear la obra social
      const newProvider = (await HealthcareProviderModel.create({
        name: providerData.name,
        code: providerData.code,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Obra social "${providerData.name}" creada con ID: ${newProvider.id}`
        );
      }
      createdProviders.push(newProvider);
      newProvidersCount++;
    }

    if (!verbose && newProvidersCount > 0) {
      console.log(
        `✅ ${newProvidersCount} obras sociales nuevas creadas automáticamente`
      );
    }

    if (verbose) {
      console.log('\n🎉 Proceso de obras sociales completado!');
      console.log('\n📋 RESUMEN DE OBRAS SOCIALES:');
      console.log('='.repeat(60));

      createdProviders.forEach((provider, index) => {
        console.log(`${index + 1}. ${provider.name}`);
        console.log(`   ID: ${provider.id}`);
        console.log(`   Código: ${provider.code || 'Sin código'}`);
        console.log(`   Activo: ${provider.isActive ? 'Sí' : 'No'}`);
        console.log('-'.repeat(60));
      });
    }
  } catch (error) {
    console.error('❌ Error creando obras sociales:', error);
    throw error;
  }
};

export const deleteAllHealthcareProviders = async (): Promise<void> => {
  try {
    console.log('🗑️  Eliminando todas las obras sociales...');

    const deletedCount = await HealthcareProviderModel.destroy({
      where: {},
      force: true,
    });

    console.log(`✅ ${deletedCount} obras sociales eliminadas`);
  } catch (error) {
    console.error('❌ Error eliminando obras sociales:', error);
    throw error;
  }
};

export default createDefaultHealthcareProviders;
