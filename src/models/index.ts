import RoleModel from './role.model';
import UserModel from './user.model';
import ProfessionalModel from './professional.model';
import SpecialtyModel from './specialty.model';
import ZoneModel from './zone.model';
import FrequencyModel from './frequency.model';
import HealthcareProviderModel from './healthcareProvider.model';
import PatientModel from './patient.model';
import JourneyModel from './journey.model';
import ConfirmationStatusModel from './confirmationStatus.model';
import NotCompletedReasonModel from './notCompletedReason.model';
import RejectionReasonModel from './rejectionReasonModel';
import VisitModel from './visit.model';

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

VisitModel.belongsTo(PatientModel, {
  foreignKey: 'patientId',
  as: 'patient',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

PatientModel.hasMany(VisitModel, {
  foreignKey: 'patientId',
  as: 'visits',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// Visit -> Journey (Muchos a Uno)
VisitModel.belongsTo(JourneyModel, {
  foreignKey: 'journeyId',
  as: 'journey',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

JourneyModel.hasMany(VisitModel, {
  foreignKey: 'journeyId',
  as: 'visits',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

// Visit -> ConfirmationStatus (Muchos a Uno)
VisitModel.belongsTo(ConfirmationStatusModel, {
  foreignKey: 'confirmationStatusId',
  as: 'confirmationStatus',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

ConfirmationStatusModel.hasMany(VisitModel, {
  foreignKey: 'confirmationStatusId',
  as: 'visits',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Visit -> RejectionReason (Muchos a Uno)
VisitModel.belongsTo(RejectionReasonModel, {
  foreignKey: 'rejectionReasonId',
  as: 'rejectionReason',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

RejectionReasonModel.hasMany(VisitModel, {
  foreignKey: 'rejectionReasonId',
  as: 'visits',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Visit -> NotCompletedReason (Muchos a Uno)
VisitModel.belongsTo(NotCompletedReasonModel, {
  foreignKey: 'notCompletedReasonId',
  as: 'notCompletedReason',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

NotCompletedReasonModel.hasMany(VisitModel, {
  foreignKey: 'notCompletedReasonId',
  as: 'visits',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Visit -> User (confirmedBy)
VisitModel.belongsTo(UserModel, {
  foreignKey: 'confirmedByUserId',
  as: 'confirmedByUser',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

UserModel.hasMany(VisitModel, {
  foreignKey: 'confirmedByUserId',
  as: 'confirmedVisits',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Visit -> User (cancelledBy)
VisitModel.belongsTo(UserModel, {
  foreignKey: 'cancelledByUserId',
  as: 'cancelledByUser',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

UserModel.hasMany(VisitModel, {
  foreignKey: 'cancelledByUserId',
  as: 'cancelledVisits',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Visit -> Visit (auto-referencia para reprogramación)
VisitModel.belongsTo(VisitModel, {
  foreignKey: 'rescheduledFromVisitId',
  as: 'rescheduledFromVisit',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

VisitModel.hasOne(VisitModel, {
  foreignKey: 'rescheduledFromVisitId',
  as: 'rescheduledToVisit',
  onDelete: 'SET NULL',
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
  ConfirmationStatusModel,
  NotCompletedReasonModel,
  RejectionReasonModel,
  VisitModel,
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
  ConfirmationStatusModel,
  NotCompletedReasonModel,
  RejectionReasonModel,
  VisitModel,
};
