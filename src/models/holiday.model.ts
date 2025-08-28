import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { HolidayType, HolidaySource, Country } from '../enums/Holiday';
import {
  COUNTRY_VALUES,
  HOLIDAY_SOURCE_VALUES,
  HOLIDAY_TYPE_VALUES,
} from '../utils/validators/enumValidators';

const HolidayModel = sequelize.define(
  'Holiday',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // ===== INFORMACIÓN BÁSICA =====
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        len: [2, 150],
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

    // ===== CLASIFICACIÓN =====
    country: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: Country.ARGENTINA,
      validate: {
        isIn: [COUNTRY_VALUES],
      },
    },

    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: HolidayType.NATIONAL,
      validate: {
        isIn: [HOLIDAY_TYPE_VALUES],
      },
    },

    source: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: HolidaySource.API,
      validate: {
        isIn: [HOLIDAY_SOURCE_VALUES],
      },
    },

    // ===== CONFIGURACIÓN RECURRENCIA =====
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    recurringDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 31,
      },
    },

    recurringMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12,
      },
    },

    // ===== CONTROL EMPRESARIAL =====
    allowWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    // ===== INFORMACIÓN ADICIONAL =====
    externalId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    lastSyncDate: {
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
    tableName: 'holidays',
    modelName: 'Holiday',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['date'],
        name: 'idx_holiday_date',
      },
      {
        fields: ['country'],
        name: 'idx_holiday_country',
      },
      {
        fields: ['type'],
        name: 'idx_holiday_type',
      },
      {
        fields: ['source'],
        name: 'idx_holiday_source',
      },
      {
        fields: ['date', 'country'],
        name: 'idx_holiday_date_country',
      },
      {
        fields: ['isRecurring', 'recurringMonth', 'recurringDay'],
        name: 'idx_holiday_recurring',
      },
      {
        fields: ['allowWork', 'isActive'],
        name: 'idx_holiday_work_active',
      },
      {
        unique: true,
        fields: ['date', 'country', 'name'],
        name: 'idx_holiday_date_country_name_unique',
      },
    ],
  }
);

export default HolidayModel;
