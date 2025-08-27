import { DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { ChangeReason } from '../enums/Audit';
import {
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_VALUES,
  CHANGE_REASON_VALUES,
} from '../utils/validators/validators';

const VisitChangeAuditModel = sequelize.define(
  'VisitChangeAudit',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // ===== IDENTIFICACIÓN DEL CAMBIO =====
    entityType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [AUDIT_ENTITY_VALUES],
      },
    },

    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [AUDIT_ACTION_VALUES],
      },
    },

    // ===== INFORMACIÓN DEL CAMBIO =====
    fieldName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ===== CONTEXTO =====
    changeReason: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ChangeReason.USER_REQUEST,
      validate: {
        isIn: [CHANGE_REASON_VALUES],
      },
    },

    changeDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },

    // ===== AUDITORÍA =====
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    // ===== INFORMACIÓN ADICIONAL =====
    relatedEntityType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [AUDIT_ENTITY_VALUES],
      },
    },

    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // ===== TIMESTAMP =====
    changeDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // ===== CONFIGURACIONES =====
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: 'visit_change_audits',
    modelName: 'VisitChangeAudit',
    timestamps: false,
    paranoid: false,
    indexes: [
      {
        fields: ['entityType', 'entityId'],
        name: 'idx_audit_entity',
      },
      {
        fields: ['action'],
        name: 'idx_audit_action',
      },
      {
        fields: ['userId'],
        name: 'idx_audit_user',
      },
      {
        fields: ['changeDateTime'],
        name: 'idx_audit_datetime',
      },
      {
        fields: ['entityType', 'entityId', 'changeDateTime'],
        name: 'idx_audit_entity_datetime',
      },
      {
        fields: ['changeReason'],
        name: 'idx_audit_reason',
      },
      {
        fields: ['relatedEntityType', 'relatedEntityId'],
        name: 'idx_audit_related_entity',
      },
      {
        fields: ['fieldName'],
        name: 'idx_audit_field',
      },
    ],
  }
);

export default VisitChangeAuditModel;
