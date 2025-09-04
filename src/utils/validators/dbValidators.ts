import {
  UserModel,
  RoleModel,
  SpecialtyModel,
  ZoneModel,
  FrequencyModel,
  HealthcareProviderModel,
} from '../../models';

export const existingUser = async (userId: string): Promise<boolean> => {
  try {
    const found = await UserModel.findOne({
      where: { id: userId },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating user:', error);
    return false;
  }
};

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
      where: { id: roleId },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating role:', error);
    return false;
  }
};

export const existingRoleName = async (name: string): Promise<boolean> => {
  try {
    const found = await RoleModel.findOne({
      where: { name: name },
      attributes: ['name'],
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
      where: { id: specialtyId },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating specialty:', error);
    return false;
  }
};

export const existingSpecialtyName = async (
  specialtyName: string
): Promise<boolean> => {
  try {
    const found = await SpecialtyModel.findOne({
      where: { name: specialtyName },
      attributes: ['name'],
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
      where: { id: zoneId },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating zone:', error);
    return false;
  }
};

export const existingZoneName = async (name: string): Promise<boolean> => {
  try {
    const found = await ZoneModel.findOne({
      where: { name: name },
      attributes: ['name'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating zone name:', error);
    return false;
  }
};

export const existingFrequency = async (
  frequencyId: string
): Promise<boolean> => {
  try {
    const found = await FrequencyModel.findOne({
      where: { id: frequencyId },
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
      where: { id: providerId },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    return false;
  }
};

export const existingHealthcareProviderName = async (
  name: string
): Promise<boolean> => {
  try {
    const found = await HealthcareProviderModel.findOne({
      where: { name: name },
      attributes: ['name'],
    });
    return !!found;
  } catch (error: any) {
    return false;
  }
};

export const existingHealthcareProviderCode = async (
  code: string
): Promise<boolean> => {
  try {
    const found = await HealthcareProviderModel.findOne({
      where: { code: code },
      attributes: ['code'],
    });
    return !!found;
  } catch (error: any) {
    return false;
  }
};
