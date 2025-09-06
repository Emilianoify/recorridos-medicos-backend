import { AuditAction, AuditEntity, ChangeReason } from '../../enums/Audit';
import { ContactMethod } from '../../enums/ContactMethod';
import {
  FrequencyInterval,
  FrequencyType,
  NextDateCalculationRule,
  WeekDay,
} from '../../enums/Frequency';
import { Country, HolidaySource, HolidayType } from '../../enums/Holiday';
import { JourneyStatus } from '../../enums/JourneyStatus';
import { PatientState } from '../../enums/PatientState';
import { UserState } from '../../enums/UserState';
import { ConfirmationMethod, VisitStatus } from '../../enums/Visits';

export const USER_STATE_VALUES = Object.values(UserState);
export const NEXT_CALCULATION_VALUES = Object.values(NextDateCalculationRule);
export const WEEKDAY_VALUES = Object.values(WeekDay);
export const FREQUENCY_TYPE_VALUES = Object.values(FrequencyType);
export const FREQUENCY_INTERVAL_VALUES = Object.values(FrequencyInterval);
export const CONTACT_METHOD_VALUES = Object.values(ContactMethod);
export const PATIENT_STATE_VALUES = Object.values(PatientState);
export const JOURNEY_STATUS_VALUES = Object.values(JourneyStatus);
export const COUNTRY_VALUES = Object.values(Country);
export const HOLIDAY_SOURCE_VALUES = Object.values(HolidaySource);
export const HOLIDAY_TYPE_VALUES = Object.values(HolidayType);
export const AUDIT_ENTITY_VALUES = Object.values(AuditEntity);
export const CHANGE_REASON_VALUES = Object.values(ChangeReason);
export const AUDIT_ACTION_VALUES = Object.values(AuditAction);
export const VISIT_STATUS_VALUES = Object.values(VisitStatus);
export const CONFIRMATION_METHOD_VALUES = Object.values(ConfirmationMethod);
