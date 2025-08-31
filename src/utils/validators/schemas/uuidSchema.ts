import { z } from 'zod';

export const isValidUUID = (uuid: string): boolean => {
  const uuidSchema = z.string().uuid();
  try {
    uuidSchema.parse(uuid);
    return true;
  } catch {
    return false;
  }
};
