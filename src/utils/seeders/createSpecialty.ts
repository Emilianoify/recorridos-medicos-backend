import { ISpecialty } from '../../interfaces/specialty.interface';
import { SpecialtyModel } from '../../models';

interface SpecialtyData {
  name: string;
  description: string;
}

const defaultSpecialties: SpecialtyData[] = [
  {
    name: 'Enfermeria',
    description:
      'Atencion de enfermeria general, curaciones, control de signos vitales',
  },
  {
    name: 'Kinesiologia',
    description: 'Rehabilitacion motora, fisioterapia, ejercicios terapeuticos',
  },
  {
    name: 'Fonoaudiologia',
    description: 'Terapia del lenguaje, rehabilitacion de la comunicacion',
  },
  {
    name: 'Terapia Ocupacional',
    description: 'Rehabilitacion de actividades de la vida diaria',
  },
  {
    name: 'Nutricion',
    description: 'Asesoramiento nutricional y planificacion de dietas',
  },
  {
    name: 'Psicologia',
    description: 'Apoyo psicologico, terapia y acompanamiento emocional',
  },
  {
    name: 'Medicina General',
    description:
      'Atencion medica integral, control y seguimiento de patologias',
  },
  {
    name: 'Trabajo Social',
    description: 'Orientacion y apoyo en gestion de recursos sociales',
  },
];

export const createDefaultSpecialties = async (
  verbose: boolean = false
): Promise<void> => {
  try {
    if (verbose) {
      console.log('🚀 Iniciando creacion de especialidades por defecto...\n');
    }

    const createdSpecialties: ISpecialty[] = [];
    let newSpecialtiesCount = 0;

    for (const specialtyData of defaultSpecialties) {
      // Verificar si la especialidad ya existe
      const existingSpecialty = (await SpecialtyModel.findOne({
        where: { name: specialtyData.name },
      })) as ISpecialty | null;

      if (existingSpecialty) {
        if (verbose) {
          console.log(
            `⚠️  Especialidad "${specialtyData.name}" ya existe con ID: ${existingSpecialty.id}`
          );
        }
        createdSpecialties.push(existingSpecialty);
        continue;
      }

      // Crear la especialidad
      const newSpecialty = (await SpecialtyModel.create({
        name: specialtyData.name,
        description: specialtyData.description,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(
          `✅ Especialidad "${specialtyData.name}" creada con ID: ${newSpecialty.id}`
        );
      }
      createdSpecialties.push(newSpecialty);
      newSpecialtiesCount++;
    }

    // En modo automatico (servidor), solo mostrar si se crearon especialidades nuevas
    if (!verbose && newSpecialtiesCount > 0) {
      console.log(
        `✅ ${newSpecialtiesCount} especialidades nuevas creadas automaticamente`
      );
    }

    if (verbose) {
      console.log('\n🎉 Proceso de especialidades completado!');
      console.log('\n📋 RESUMEN DE ESPECIALIDADES:');
      console.log('='.repeat(60));

      createdSpecialties.forEach((specialty, index) => {
        console.log(`${index + 1}. ${specialty.name}`);
        console.log(`   ID: ${specialty.id}`);
        console.log(`   Descripcion: ${specialty.description}`);
        console.log(`   Activo: ${specialty.isActive ? 'Si' : 'No'}`);
        console.log('-'.repeat(60));
      });

      console.log('\n🔗 PARA TESTING - Copia estos IDs:');
      console.log('='.repeat(40));
      createdSpecialties.forEach(specialty => {
        console.log(`${specialty.name}: "${specialty.id}"`);
      });
    }
  } catch (error) {
    console.error('❌ Error creando especialidades:', error);
    throw error;
  }
};

export const deleteAllSpecialties = async (): Promise<void> => {
  try {
    console.log('🗑️  Eliminando todas las especialidades...');

    const deletedCount = await SpecialtyModel.destroy({
      where: {},
      force: true, // Hard delete, ignora paranoid
    });

    console.log(`✅ ${deletedCount} especialidades eliminadas`);
  } catch (error) {
    console.error('❌ Error eliminando especialidades:', error);
    throw error;
  }
};

export default createDefaultSpecialties;
