import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { JourneyStatus } from '../enums/JourneyStatus';
import { JOURNEY_STATUS_VALUES } from '../utils/validators/enumValidators';
const JourneyModel = sequelize.define(
  'Journey',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // ===== ASIGNACIÓN BÁSICA =====
    professionalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'professionals',
        key: 'id',
      },
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    zoneId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'zones',
        key: 'id',
      },
    },

    // ===== ESTADO DEL RECORRIDO =====
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: JourneyStatus.PLANNED,
      validate: {
        isIn: [JOURNEY_STATUS_VALUES],
      },
    },

    // ===== HORARIOS PLANIFICADOS =====
    plannedStartTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    plannedEndTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    // ===== HORARIOS REALES =====
    actualStartTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    actualEndTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    // ===== INFORMACIÓN ADICIONAL =====
    estimatedVisits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 50,
      },
    },

    completedVisits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    totalTravelDistance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    observations: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },

    // ===== CONFIGURACIONES =====
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'journeys',
    modelName: 'Journey',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['professionalId'],
        name: 'idx_journey_professional',
      },
      {
        fields: ['date'],
        name: 'idx_journey_date',
      },
      {
        fields: ['zoneId'],
        name: 'idx_journey_zone',
      },
      {
        fields: ['status'],
        name: 'idx_journey_status',
      },
      {
        fields: ['professionalId', 'date'],
        name: 'idx_journey_professional_date',
      },
      {
        fields: ['date', 'zoneId'],
        name: 'idx_journey_date_zone',
      },
      {
        fields: ['status', 'date'],
        name: 'idx_journey_status_date',
      },
      {
        unique: true,
        fields: ['professionalId', 'date', 'zoneId'],
        name: 'idx_journey_professional_date_zone_unique',
      },
    ],
  }
);

export default JourneyModel;
