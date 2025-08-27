import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const RejectionReasonModel = sequelize.define(
  'RejectionReason',
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
    suggestedAction: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [2, 100],
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'rejection_reasons',
    modelName: 'RejectionReason',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_rejection_reason_name_unique',
      },
      {
        fields: ['category'],
        name: 'idx_rejection_reason_category',
      },
      {
        fields: ['suggestedAction'],
        name: 'idx_rejection_reason_action',
      },
      {
        fields: ['isActive'],
        name: 'idx_rejection_reason_active',
      },
    ],
  }
);

export default RejectionReasonModel;
