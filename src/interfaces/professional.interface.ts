import { ProfessionalState } from '../enums/ProfessionalState';
import { ISpecialty } from './specialty.interface';

export interface IProfessional {
  id: string;
  username?: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  specialtyId: string;
  start_at?: number | null;
  finish_at?: number | null;
  state: ProfessionalState;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  specialty?: ISpecialty;
}
