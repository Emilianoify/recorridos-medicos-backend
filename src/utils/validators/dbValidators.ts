import {
  UserModel,
  RoleModel,
  SpecialtyModel,
  ZoneModel,
  FrequencyModel,
  HealthcareProviderModel,
} from '../../models';

export const existingUsername = async (username: string): Promise<boolean> => {
  try {
    const found = await UserModel.findOne({
      where: { username },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating username:', error);
    return false;
  }
};

export const existingEmail = async (email: string): Promise<boolean> => {
  try {
    const found = await UserModel.findOne({
      where: { corporative_email: email },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating email:', error);
    return false;
  }
};

export const existingRole = async (roleId: string): Promise<boolean> => {
  try {
    const found = await RoleModel.findOne({
      where: { id: roleId, isActive: true },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating role:', error);
    return false;
  }
};

export const validateRole = async (roleId: string): Promise<boolean> => {
  return await existingRole(roleId);
};

export const existingSpecialty = async (
  specialtyId: string
): Promise<boolean> => {
  try {
    const found = await SpecialtyModel.findOne({
      where: { id: specialtyId, isActive: true },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating specialty:', error);
    return false;
  }
};

export const existingZone = async (zoneId: string): Promise<boolean> => {
  try {
    const found = await ZoneModel.findOne({
      where: { id: zoneId, isActive: true },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating zone:', error);
    return false;
  }
};

export const existingFrequency = async (
  frequencyId: string
): Promise<boolean> => {
  try {
    const found = await FrequencyModel.findOne({
      where: { id: frequencyId, isActive: true },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    return false;
  }
};

export const existingHealthcareProvider = async (
  providerId: string
): Promise<boolean> => {
  try {
    const found = await HealthcareProviderModel.findOne({
      where: { id: providerId, isActive: true },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    return false;
  }
};
