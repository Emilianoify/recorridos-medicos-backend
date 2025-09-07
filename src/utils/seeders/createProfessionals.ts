import { ProfessionalModel, SpecialtyModel } from '../../models';
import { ProfessionalState } from '../../enums/ProfessionalState';
import { ISpecialty } from '../../interfaces/specialty.interface';

const createDefaultProfessionals = async (): Promise<void> => {
  try {
    console.log('👩‍⚕️ Creando profesionales por defecto...');

    // Buscar especialidades existentes
    const medicinaGeneralResult = await SpecialtyModel.findOne({ 
      where: { name: 'Medicina General' }
    });
    const medicinaGeneral = medicinaGeneralResult?.toJSON() as ISpecialty | null;
    
    const enfermeriaResult = await SpecialtyModel.findOne({ 
      where: { name: 'Enfermería' }
    });
    const enfermeria = enfermeriaResult?.toJSON() as ISpecialty | null;
    
    const kinesiologiaResult = await SpecialtyModel.findOne({ 
      where: { name: 'Kinesiología' }
    });
    const kinesiologia = kinesiologiaResult?.toJSON() as ISpecialty | null;
    
    const fonoaudiologiaResult = await SpecialtyModel.findOne({ 
      where: { name: 'Fonoaudiología' }
    });
    const fonoaudiologia = fonoaudiologiaResult?.toJSON() as ISpecialty | null;

    if (!medicinaGeneral || !enfermeria || !kinesiologia || !fonoaudiologia) {
      console.log('⚠️  Especialidades no encontradas. Ejecuta primero createSpecialty');
      return;
    }

    const defaultProfessionals = [
      {
        firstName: 'Dr. Carlos',
        lastName: 'Martínez',
        username: 'cmartinez',
        email: 'cmartinez@recorridos.com',
        phone: '+541123456789',
        specialtyId: medicinaGeneral!.id,
        licenseNumber: 'MN12345',
        scheduleStart: '08:00',
        scheduleEnd: '17:00',
        state: ProfessionalState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Dra. Ana',
        lastName: 'González',
        username: 'agonzalez',
        email: 'agonzalez@recorridos.com',
        phone: '+541123456790',
        specialtyId: medicinaGeneral!.id,
        licenseNumber: 'MN12346',
        scheduleStart: '07:30',
        scheduleEnd: '16:30',
        state: ProfessionalState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Lic. María',
        lastName: 'Fernández',
        username: 'mfernandez',
        email: 'mfernandez@recorridos.com',
        phone: '+541123456791',
        specialtyId: enfermeria!.id,
        licenseNumber: 'ENF001',
        scheduleStart: '09:00',
        scheduleEnd: '18:00',
        state: ProfessionalState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Lic. Pedro',
        lastName: 'Rodríguez',
        username: 'prodriguez',
        email: 'prodriguez@recorridos.com',
        phone: '+541123456792',
        specialtyId: enfermeria!.id,
        licenseNumber: 'ENF002',
        scheduleStart: '08:30',
        scheduleEnd: '17:30',
        state: ProfessionalState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Lic. Laura',
        lastName: 'Sánchez',
        username: 'lsanchez',
        email: 'lsanchez@recorridos.com',
        phone: '+541123456793',
        specialtyId: kinesiologia!.id,
        licenseNumber: 'KIN001',
        scheduleStart: '10:00',
        scheduleEnd: '19:00',
        state: ProfessionalState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Lic. Roberto',
        lastName: 'López',
        username: 'rlopez',
        email: 'rlopez@recorridos.com',
        phone: '+541123456794',
        specialtyId: fonoaudiologia!.id,
        licenseNumber: 'FONO001',
        scheduleStart: '08:00',
        scheduleEnd: '15:00',
        state: ProfessionalState.ACTIVE,
        isActive: true,
      },
    ];

    for (const professionalData of defaultProfessionals) {
      const existingProfessional = await ProfessionalModel.findOne({
        where: { username: professionalData.username },
      });

      if (!existingProfessional) {
        await ProfessionalModel.create(professionalData);
        console.log(`✅ Profesional "${professionalData.firstName} ${professionalData.lastName}" creado correctamente`);
      } else {
        console.log(`ℹ️  Profesional "${professionalData.username}" ya existe, omitiendo...`);
      }
    }

    console.log('✅ Proceso de creación de profesionales completado');
  } catch (error) {
    console.error('❌ Error al crear profesionales por defecto:', error);
    throw error;
  }
};

export default createDefaultProfessionals;