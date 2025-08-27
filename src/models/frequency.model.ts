import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { NextDateCalculationRule, FrequencyType } from '../enums/Frequency';
import {
  FREQUENCY_INTERVAL_VALUES,
  FREQUENCY_TYPE_VALUES,
  NEXT_CALCULATION_VALUES,
} from '../utils/validators/validators';

const FrequencyModel = sequelize.define(
  'Frequency',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },

    frequencyType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: FrequencyType.SIMPLE,
      validate: {
        isIn: [FREQUENCY_TYPE_VALUES],
      },
    },

    nextDateCalculationRule: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: NextDateCalculationRule.NEXT_BUSINESS_DAY,
      validate: {
        isIn: [NEXT_CALCULATION_VALUES],
      },
    },

    // ===== PARA FRECUENCIAS SIMPLES =====
    daysBetweenVisits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 365,
      },
    },
    visitsPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 31,
      },
    },
    intervalValue: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },

    intervalUnit: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [FREQUENCY_INTERVAL_VALUES],
      },
    },

    visitsPerDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 24,
      },
    },

    weeklyPattern: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    customSchedule: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // ===== CONFIGURACIONES ADICIONALES =====
    respectBusinessHours: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },

    allowWeekends: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    allowHolidays: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'frequencies',
    modelName: 'Frequency',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_frequency_name_unique',
      },
      {
        fields: ['frequencyType'],
        name: 'idx_frequency_type',
      },
      {
        fields: ['isActive'],
        name: 'idx_frequency_active',
      },
      {
        fields: ['daysBetweenVisits'],
        name: 'idx_frequency_days_between',
      },
      {
        fields: ['frequencyType', 'isActive'],
        name: 'idx_frequency_type_active',
      },
    ],
  }
);

export default FrequencyModel;
