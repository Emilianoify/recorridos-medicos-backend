import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const ConfirmationStatusModel = sequelize.define(
  'ConfirmationStatus',
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'confirmation_statuses',
    modelName: 'ConfirmationStatus',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_confirmation_status_name_unique',
      },
      {
        fields: ['isActive'],
        name: 'idx_confirmation_status_active',
      },
    ],
  }
);

export default ConfirmationStatusModel;
