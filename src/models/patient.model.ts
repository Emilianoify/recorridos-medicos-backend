import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { ContactMethod } from '../enums/ContactMethod';
import {
  CONTACT_METHOD_VALUES,
  PATIENT_STATE_VALUES,
} from '../utils/validators/validators';
import { PatientState } from '../enums/PatientState';

const PatientModel = sequelize.define(
  'Patient',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // ===== INFORMACIÓN PERSONAL =====
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [2, 200],
        notEmpty: true,
      },
    },

    healthcareId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        len: [3, 30],
        notEmpty: true,
      },
    },

    healthcareProviderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'healthcare_providers',
        key: 'id',
      },
    },
    // ===== UBICACIÓN =====
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [5, 500],
        notEmpty: true,
      },
    },

    locality: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },

    zoneId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'zones',
        key: 'id',
      },
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [8, 20],
      },
    },

    emergencyPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [8, 20],
      },
    },

    // ===== ESTADO DEL PACIENTE =====
    state: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: PatientState.ACTIVE,
      validate: {
        isIn: [PATIENT_STATE_VALUES],
      },
    },

    // ===== AUTORIZACIÓN Y LÍMITES =====
    lastAuthorizationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    authorizedVisitsPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 31,
      },
    },

    completedVisitsThisMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    frequencyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'frequencies',
        key: 'id',
      },
    },

    primaryProfessionalId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'professionals',
        key: 'id',
      },
    },

    // ===== FECHAS IMPORTANTES =====
    lastVisitDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    nextScheduledVisitDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },

    medicalObservations: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },

    requiresConfirmation: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },

    preferredContactMethod: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ContactMethod.PHONE,
      validate: {
        isIn: [CONTACT_METHOD_VALUES],
      },
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'patients',
    modelName: 'Patient',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['healthcareId', 'healthcareProviderId'],
        name: 'idx_patient_healthcare_id_provider',
      },
      {
        fields: ['healthcareProviderId'],
        name: 'idx_patient_healthcare_provider',
      },
      {
        fields: ['state'],
        name: 'idx_patient_state',
      },
      {
        fields: ['zoneId'],
        name: 'idx_patient_zone',
      },
      {
        fields: ['frequencyId'],
        name: 'idx_patient_frequency',
      },
      {
        fields: ['primaryProfessionalId'],
        name: 'idx_patient_professional',
      },
      {
        fields: ['fullName'],
        name: 'idx_patient_name',
      },
      {
        fields: ['locality'],
        name: 'idx_patient_locality',
      },
      {
        fields: ['nextScheduledVisitDate'],
        name: 'idx_patient_next_visit',
      },
      {
        fields: ['lastVisitDate'],
        name: 'idx_patient_last_visit',
      },
      {
        fields: ['state', 'isActive'],
        name: 'idx_patient_state_active',
      },
      {
        fields: ['zoneId', 'state'],
        name: 'idx_patient_zone_state',
      },
      {
        fields: ['primaryProfessionalId', 'state'],
        name: 'idx_patient_professional_state',
      },
      {
        fields: ['requiresConfirmation', 'nextScheduledVisitDate'],
        name: 'idx_patient_confirmation_next',
      },
    ],
  }
);

export default PatientModel;
