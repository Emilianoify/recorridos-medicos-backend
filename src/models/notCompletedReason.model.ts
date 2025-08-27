import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const NotCompletedReasonModel = sequelize.define(
  'NotCompletedReason',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 100],
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
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50],
      },
    },
    requiresReschedule: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'not_completed_reasons',
    modelName: 'NotCompletedReason',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_not_completed_reason_name_unique',
      },
      {
        fields: ['category'],
        name: 'idx_not_completed_reason_category',
      },
      {
        fields: ['requiresReschedule'],
        name: 'idx_not_completed_reason_reschedule',
      },
      {
        fields: ['isActive'],
        name: 'idx_not_completed_reason_active',
      },
    ],
  }
);

export default NotCompletedReasonModel;
