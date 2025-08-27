import { DataTypes } from 'sequelize';
import sequelize from '../config/db';

const ZoneModel = sequelize.define(
  'Zone',
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
    polygonCoordinates: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'zones',
    modelName: 'Zone',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        name: 'idx_zona_name_unique',
      },
      {
        fields: ['isActive'],
        name: 'idx_zona_active',
      },
      {
        fields: ['name', 'isActive'],
        name: 'idx_zona_name_active',
      },
    ],
  }
);

export default ZoneModel;
