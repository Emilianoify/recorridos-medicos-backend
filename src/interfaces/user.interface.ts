import { UserState } from '@/enums/UserState';
import { IRole } from './role.interface';

export interface IUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password?: string;
  roleId: string;
  lastLogin?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  state: UserState;
  role?: IRole;
}

export interface IUserSafe
  extends Omit<IUser, 'password' | 'passwordResetToken'> {}
