import {
  UserModel,
  RoleModel,
  SpecialtyModel,
  ZoneModel,
  FrequencyModel,
  HealthcareProviderModel,
  ProfessionalModel,
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
    const [userFound, professionalFound] = await Promise.all([
      UserModel.findOne({
        where: { username: username },
        attributes: ['id'],
      }),
      ProfessionalModel.findOne({
        where: { username: username },
        attributes: ['id'],
      }),
    ]);
    return !!(userFound || professionalFound);
  } catch (error: any) {
    console.error('Error validating username:', error);
    return false;
  }
};

export const existingEmail = async (email: string): Promise<boolean> => {
  try {
    const [userFound, professionalFound] = await Promise.all([
      UserModel.findOne({
        where: { corporative_email: email },
        attributes: ['id'],
      }),
      ProfessionalModel.findOne({
        where: { email: email },
        attributes: ['id'],
      }),
    ]);

    return !!(userFound || professionalFound);
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
  try {
    const role = await RoleModel.findOne({
      where: { id: roleId, isActive: true },
      attributes: ['id'],
    });
    return !!role;
  } catch (error: any) {
    console.error('Error validating active role:', error);
    return false;
  }
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

/**
 * Valida que una especialidad exista Y esté activa
 */
export const isSpecialtyActiveAndExists = async (
  specialtyId: string
): Promise<boolean> => {
  try {
    const specialty = await SpecialtyModel.findOne({
      where: { id: specialtyId, isActive: true },
      attributes: ['id'],
    });
    return !!specialty;
  } catch (error: any) {
    console.error('Error validating active specialty:', error);
    return false;
  }
};

/**
 * Valida que un email no esté en uso en la tabla de profesionales
 */
export const existingProfessionalEmail = async (
  email: string
): Promise<boolean> => {
  try {
    const found = await ProfessionalModel.findOne({
      where: { email: email },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating professional email:', error);
    return false;
  }
};

/**
 * Valida que un username no esté en uso en la tabla de profesionales
 */
export const existingProfessionalUsername = async (
  username: string
): Promise<boolean> => {
  try {
    const found = await ProfessionalModel.findOne({
      where: { username: username },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating professional username:', error);
    return false;
  }
};

/**
 * Valida que un professional exista
 */
export const existingProfessional = async (
  professionalId: string
): Promise<boolean> => {
  try {
    const found = await ProfessionalModel.findOne({
      where: { id: professionalId },
      attributes: ['id'],
    });
    return !!found;
  } catch (error: any) {
    console.error('Error validating professional:', error);
    return false;
  }
};
