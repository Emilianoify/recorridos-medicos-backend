import {
  PatientModel,
  ZoneModel,
  FrequencyModel,
  HealthcareProviderModel,
  ProfessionalModel,
} from '../../models';
import { PatientState } from '../../enums/PatientState';
import { ContactMethod } from '../../enums/ContactMethod';
import { ProfessionalState } from '../../enums/ProfessionalState';
import { IZone } from '../../interfaces/zone.interface';
import { IFrequency } from '../../interfaces/frequency.interface';
import { IHealthcareProvider } from '../../interfaces/healthcareProvider.interface';
import { IProfessional } from '../../interfaces/professional.interface';

const createDefaultPatients = async (): Promise<void> => {
  try {
    console.log('🏥 Creando pacientes por defecto...');

    // Buscar entidades relacionadas
    const zonesResult = await ZoneModel.findAll({ 
      where: { isActive: true }
    });
    const zones = zonesResult.map(zone => zone.toJSON() as IZone);
    
    const frequenciesResult = await FrequencyModel.findAll({
      where: { isActive: true }
    });
    const frequencies = frequenciesResult.map(freq => freq.toJSON() as IFrequency);
    
    const healthcareProvidersResult = await HealthcareProviderModel.findAll({
      where: { isActive: true }
    });
    const healthcareProviders = healthcareProvidersResult.map(hp => hp.toJSON() as IHealthcareProvider);
    
    const professionalsResult = await ProfessionalModel.findAll({
      where: { state: ProfessionalState.ACTIVE }
    });
    const professionals = professionalsResult.map(prof => prof.toJSON() as IProfessional);

    if (!zones.length || !frequencies.length || !healthcareProviders.length) {
      console.log(
        '⚠️  Entidades relacionadas no encontradas. Ejecuta primero los seeders correspondientes'
      );
      return;
    }

    const defaultPatients = [
      {
        fullName: 'María Elena Rodríguez',
        healthcareId: 'OSDE001234',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Av. Corrientes 1234, Piso 5, Depto B',
        locality: 'Balvanera',
        zoneId: zones[0].id, // Centro
        phone: '+541134567890',
        emergencyPhone: '+541134567891',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-01-01',
        authorizedVisitsPerMonth: 4,
        completedVisitsThisMonth: 2,
        frequencyId: frequencies[0].id,
        primaryProfessionalId: professionals[0]?.id,
        diagnosis: 'Hipertensión arterial controlada, seguimiento domiciliario',
        medicalObservations:
          'Paciente colaboradora, requiere control de presión arterial semanal',
        requiresConfirmation: true,
        preferredContactMethod: ContactMethod.PHONE,
        isActive: true,
      },
      {
        fullName: 'José Antonio Pérez',
        healthcareId: 'SWISS002345',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Scalabrini Ortiz 2890, 1er Piso',
        locality: 'Palermo',
        zoneId: zones[1]?.id || zones[0].id, // Zona Norte
        phone: '+541145678901',
        emergencyPhone: '+541145678902',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-01-15',
        authorizedVisitsPerMonth: 8,
        completedVisitsThisMonth: 1,
        frequencyId: frequencies[1]?.id || frequencies[0].id,
        primaryProfessionalId: professionals[1]?.id,
        diagnosis: 'Diabetes tipo 2, control glucémico',
        medicalObservations:
          'Aplicación de insulina diaria, control de glucemia',
        requiresConfirmation: true,
        preferredContactMethod: ContactMethod.WHATSAPP,
        isActive: true,
      },
      {
        fullName: 'Carmen Beatriz López',
        healthcareId: 'GALENO003456',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Av. Rivadavia 8750, Casa',
        locality: 'Caballito',
        zoneId: zones[2]?.id || zones[0].id, // Zona Oeste
        phone: '+541156789012',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-02-01',
        authorizedVisitsPerMonth: 2,
        completedVisitsThisMonth: 0,
        frequencyId: frequencies[0].id,
        primaryProfessionalId: professionals[2]?.id,
        diagnosis: 'Rehabilitación post-quirúrgica de cadera',
        medicalObservations: 'Sesiones de kinesiología, movilidad limitada',
        requiresConfirmation: false,
        preferredContactMethod: ContactMethod.PHONE,
        isActive: true,
      },
      {
        fullName: 'Roberto Carlos Morales',
        healthcareId: 'IOMA004567',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Defensa 567, PB',
        locality: 'San Telmo',
        zoneId: zones[3]?.id || zones[0].id, // Zona Sur
        phone: '+541167890123',
        emergencyPhone: '+541167890124',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-01-20',
        authorizedVisitsPerMonth: 12,
        completedVisitsThisMonth: 3,
        frequencyId: frequencies[2]?.id || frequencies[0].id,
        primaryProfessionalId: professionals[0]?.id,
        diagnosis: 'EPOC estadio moderado, oxigenoterapia domiciliaria',
        medicalObservations:
          'Paciente con oxygen concentrador, control respiratorio diario',
        requiresConfirmation: true,
        preferredContactMethod: ContactMethod.PHONE,
        isActive: true,
      },
      {
        fullName: 'Ana María Fernández',
        healthcareId: 'MEDICUS005678',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Av. Maipú 1100, Torre 2, Piso 8',
        locality: 'Vicente López',
        zoneId: zones[4]?.id || zones[0].id, // GBA Norte
        phone: '+541178901234',
        emergencyPhone: '+541178901235',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-02-10',
        authorizedVisitsPerMonth: 6,
        completedVisitsThisMonth: 1,
        frequencyId: frequencies[1]?.id || frequencies[0].id,
        primaryProfessionalId: professionals[3]?.id,
        diagnosis: 'Cuidados paliativos, manejo del dolor',
        medicalObservations:
          'Paciente con dolor oncológico controlado, medicación específica',
        requiresConfirmation: true,
        preferredContactMethod: ContactMethod.PHONE,
        isActive: true,
      },
      {
        fullName: 'Luis Alberto Suárez',
        healthcareId: 'ACCORD006789',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Hipólito Yrigoyen 2500',
        locality: 'Quilmes',
        zoneId: zones[5]?.id || zones[0].id, // GBA Sur
        phone: '+541189012345',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-01-25',
        authorizedVisitsPerMonth: 4,
        completedVisitsThisMonth: 2,
        frequencyId: frequencies[0].id,
        primaryProfessionalId: professionals[4]?.id,
        diagnosis: 'Rehabilitación neurológica post-ACV',
        medicalObservations: 'Terapia de rehabilitación motora, logopedia',
        requiresConfirmation: false,
        preferredContactMethod: ContactMethod.PHONE,
        isActive: true,
      },
      {
        fullName: 'Elena Patricia García',
        healthcareId: 'FEDERADA007890',
        healthcareProviderId: healthcareProviders[0].id,
        address: 'Av. Cabildo 3200, Piso 4',
        locality: 'Belgrano',
        zoneId: zones[1]?.id || zones[0].id, // Zona Norte
        phone: '+541190123456',
        emergencyPhone: '+541190123457',
        state: PatientState.ACTIVE,
        lastAuthorizationDate: '2024-02-05',
        authorizedVisitsPerMonth: 8,
        completedVisitsThisMonth: 0,
        frequencyId: frequencies[2]?.id || frequencies[0].id,
        primaryProfessionalId: professionals[5]?.id,
        diagnosis: 'Trastorno del lenguaje, afasia post-traumática',
        medicalObservations: 'Sesiones de fonoaudiología, evolución favorable',
        requiresConfirmation: true,
        preferredContactMethod: ContactMethod.WHATSAPP,
        isActive: true,
      },
    ];

    for (const patientData of defaultPatients) {
      const existingPatient = await PatientModel.findOne({
        where: { healthcareId: patientData.healthcareId },
      });

      if (!existingPatient) {
        await PatientModel.create(patientData);
        console.log(
          `✅ Paciente "${patientData.fullName}" creado correctamente`
        );
      } else {
        console.log(
          `ℹ️  Paciente con ID "${patientData.healthcareId}" ya existe, omitiendo...`
        );
      }
    }

    console.log('✅ Proceso de creación de pacientes completado');
  } catch (error) {
    console.error('❌ Error al crear pacientes por defecto:', error);
    throw error;
  }
};

export default createDefaultPatients;
