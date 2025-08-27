import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const SpecialtyModel = sequelize.define(
  'Specialty',
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'specialties',
    modelName: 'Specialty',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_specialty_name_unique',
      },
      {
        fields: ['isActive'],
        name: 'idx_specialty_active',
      },
      {
        fields: ['name', 'isActive'],
        name: 'idx_specialty_name_active',
      },
    ],
  }
);

export default SpecialtyModel;
