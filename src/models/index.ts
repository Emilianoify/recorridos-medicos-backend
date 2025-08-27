import RoleModel from './role.model';
import UserModel from './user.model';
import ProfessionalModel from './professional.model';
import SpecialtyModel from './specialty.model';
import FrequencyModel from './frequency.model';

UserModel.belongsTo(RoleModel, {
  foreignKey: 'roleId',
  as: 'role',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

RoleModel.hasMany(UserModel, {
  foreignKey: 'roleId',
  as: 'users',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

ProfessionalModel.belongsTo(SpecialtyModel, {
  foreignKey: 'specialtyId',
  as: 'specialty',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

SpecialtyModel.hasMany(ProfessionalModel, {
  foreignKey: 'specialtyId',
  as: 'professionals',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

export {
  RoleModel,
  UserModel,
  ProfessionalModel,
  SpecialtyModel,
  FrequencyModel,
};
export default {
  RoleModel,
  UserModel,
  ProfessionalModel,
  SpecialtyModel,
  FrequencyModel,
};
