import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/db';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { UserState } from '../enums/UserState';
import { USER_STATE_VALUES } from '../utils/validators/enumValidators';

const ProfessionalModel = sequelize.define(
  'Professional',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: ERROR_MESSAGES.AUTH.INVALID_EMAIL,
        },
        len: [5, 255],
      },
    },
    specialtyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'specialties',
        key: 'id',
      },
    },
    start_at: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 2359, // Formato HHMM (23:59)
      },
    },
    finish_at: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 2359, // Formato HHMM (23:59)
      },
    },
    state: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: UserState.ACTIVE,
      validate: {
        isIn: [USER_STATE_VALUES],
      },
    },
  },
  {
    tableName: 'professionals',
    modelName: 'Professional',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['username'],
        where: {
          username: {
            [Op.ne]: null,
          },
        },
      },
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['specialtyId'],
        name: 'idx_professional_specialty',
      },
      {
        fields: ['state'],
        name: 'idx_professional_state',
      },
      {
        fields: ['firstname', 'lastname'],
        name: 'idx_professional_fullname',
      },
      {
        fields: ['start_at', 'finish_at'],
        name: 'idx_professional_schedule',
      },
    ],
  }
);

export default ProfessionalModel;
