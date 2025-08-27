import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/db';

const HealthcareProviderModel = sequelize.define(
  'HealthcareProvider',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 150],
        notEmpty: true,
      },
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [2, 20],
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'healthcare_providers',
    modelName: 'HealthcareProvider',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_healthcare_provider_name_unique',
      },
      {
        unique: true,
        fields: ['code'],
        where: {
          code: {
            [Op.ne]: null,
          },
        },
        name: 'idx_healthcare_provider_code_unique',
      },
      {
        fields: ['isActive'],
        name: 'idx_healthcare_provider_active',
      },
      {
        fields: ['name', 'isActive'],
        name: 'idx_healthcare_provider_name_active',
      },
    ],
  }
);

export default HealthcareProviderModel;
