import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { VisitStatus } from '../enums/Visits';

const VisitModel = sequelize.define(
  'Visit',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // ===== RELACIONES PRINCIPALES =====
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },

    journeyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'journeys',
        key: 'id',
      },
    },

    // ===== INFORMACIÓN BÁSICA =====
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: VisitStatus.SCHEDULED,
      validate: {
        isIn: [Object.values(VisitStatus)],
      },
    },

    scheduledDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    orderInJourney: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50,
      },
    },

    // ===== CONFIRMACIÓN =====
    confirmationStatusId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'confirmation_statuses',
        key: 'id',
      },
    },

    confirmationDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    confirmationMethod: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['PHONE', 'WHATSAPP', 'EMAIL', 'SMS', 'IN_PERSON']],
      },
    },

    confirmedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    // ===== REALIZACIÓN DE LA VISITA =====
    completedDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 480, // 8 horas máximo
      },
    },

    // ===== MOTIVOS (cuando no se completa) =====
    rejectionReasonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'rejection_reasons',
        key: 'id',
      },
    },

    notCompletedReasonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'not_completed_reasons',
        key: 'id',
      },
    },

    // ===== REPROGRAMACIÓN =====
    rescheduledFromVisitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'visits',
        key: 'id',
      },
    },

    rescheduledToVisitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'visits',
        key: 'id',
      },
    },

    // ===== GEOLOCALIZACIÓN (futuro) =====
    checkInLocation: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    checkOutLocation: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // ===== OBSERVACIONES =====
    professionalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },

    coordinatorNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },

    // ===== AUDITORÍA =====
    cancelledByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    cancelledDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ===== CONFIGURACIONES =====
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'visits',
    modelName: 'Visit',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['patientId'],
        name: 'idx_visit_patient',
      },
      {
        fields: ['journeyId'],
        name: 'idx_visit_journey',
      },
      {
        fields: ['status'],
        name: 'idx_visit_status',
      },
      {
        fields: ['scheduledDateTime'],
        name: 'idx_visit_scheduled_date',
      },
      {
        fields: ['patientId', 'scheduledDateTime'],
        name: 'idx_visit_patient_date',
      },
      {
        fields: ['journeyId', 'orderInJourney'],
        name: 'idx_visit_journey_order',
      },
      {
        fields: ['status', 'scheduledDateTime'],
        name: 'idx_visit_status_date',
      },
      {
        fields: ['confirmationStatusId'],
        name: 'idx_visit_confirmation_status',
      },
      {
        fields: ['rescheduledFromVisitId'],
        name: 'idx_visit_rescheduled_from',
      },
      {
        fields: ['patientId', 'status', 'isActive'],
        name: 'idx_visit_patient_status_active',
      },
    ],
  }
);

export default VisitModel;
