import {
  FrequencyInterval,
  FrequencyType,
  NextDateCalculationRule,
  WeekDay,
} from '../../enums/Frequency';
import { UserState } from '../../enums/UserState';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // Mínimo 8 caracteres, al menos 1 mayúscula y 1 número
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const isValidUsername = (username: string): boolean => {
  // Solo letras, números y guiones bajos, 3-50 caracteres
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};

export const USER_STATE_VALUES = Object.values(UserState);
export const NEXT_CALCULATION_VALUES = Object.values(NextDateCalculationRule);
export const WEEKDAY_VALUES = Object.values(WeekDay);
export const FREQUENCY_TYPE_VALUES = Object.values(FrequencyType);
export const FREQUENCY_INTERVAL_VALUES = Object.values(FrequencyInterval);
