import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { ERROR_MESSAGES } from '../constants/messages/error.messages';
import { UserState } from '../enums/UserState';
import { USER_STATE_VALUES } from '../utils/validators/enumValidators';

const UserModel = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
    corporative_email: {
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
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['username'],
      },
      {
        unique: true,
        fields: ['corporative_email'],
      },
      {
        fields: ['roleId'],
      },
      {
        fields: ['state'],
      },
      {
        fields: ['roleId', 'state'],
        name: 'idx_user_role_state',
      },
      {
        fields: ['firstname', 'lastname'],
        name: 'idx_user_fullname',
      },
      {
        fields: ['createdAt'],
        name: 'idx_user_created',
      },
      {
        fields: ['lastLogin'],
        name: 'idx_user_last_login',
      },
    ],
  }
);

export default UserModel;
