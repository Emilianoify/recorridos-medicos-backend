import RoleModel from './role.model';
import UserModel from './user.model';
import ProfessionalModel from './professional.model';
import SpecialtyModel from './specialty.model';
import ZoneModel from './zone.model';
import FrequencyModel from './frequency.model';
import HealthcareProviderModel from './healthcareProvider.model';
import PatientModel from './patient.model';
import JourneyModel from './journey.model';

UserModel.belongsTo(RoleModel, {
  foreignKey: 'roleId',
  as: 'role',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

RoleModel.hasMany(UserModel, {
  foreignKey: 'roleId',
  as: 'users',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

ProfessionalModel.belongsTo(SpecialtyModel, {
  foreignKey: 'specialtyId',
  as: 'specialty',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

SpecialtyModel.hasMany(ProfessionalModel, {
  foreignKey: 'specialtyId',
  as: 'professionals',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

PatientModel.belongsTo(ZoneModel, {
  foreignKey: 'zoneId',
  as: 'zone',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

ZoneModel.hasMany(PatientModel, {
  foreignKey: 'zoneId',
  as: 'patients',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

PatientModel.belongsTo(FrequencyModel, {
  foreignKey: 'frequencyId',
  as: 'frequency',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

FrequencyModel.hasMany(PatientModel, {
  foreignKey: 'frequencyId',
  as: 'patients',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

PatientModel.belongsTo(ProfessionalModel, {
  foreignKey: 'primaryProfessionalId',
  as: 'primaryProfessional',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

ProfessionalModel.hasMany(PatientModel, {
  foreignKey: 'primaryProfessionalId',
  as: 'primaryPatients',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

PatientModel.belongsTo(HealthcareProviderModel, {
  foreignKey: 'healthcareProviderId',
  as: 'healthcareProvider',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

HealthcareProviderModel.hasMany(PatientModel, {
  foreignKey: 'healthcareProviderId',
  as: 'patients',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

JourneyModel.belongsTo(ProfessionalModel, {
  foreignKey: 'professionalId',
  as: 'professional',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

ProfessionalModel.hasMany(JourneyModel, {
  foreignKey: 'professionalId',
  as: 'journeys',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

JourneyModel.belongsTo(ZoneModel, {
  foreignKey: 'zoneId',
  as: 'zone',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

ZoneModel.hasMany(JourneyModel, {
  foreignKey: 'zoneId',
  as: 'journeys',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

export {
  RoleModel,
  UserModel,
  ProfessionalModel,
  SpecialtyModel,
  ZoneModel,
  FrequencyModel,
  HealthcareProviderModel,
  PatientModel,
  JourneyModel,
};

export default {
  RoleModel,
  UserModel,
  ProfessionalModel,
  SpecialtyModel,
  ZoneModel,
  FrequencyModel,
  HealthcareProviderModel,
  PatientModel,
  JourneyModel,
};
