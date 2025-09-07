import { Request } from 'express';
import { IUserSafe } from './user.interface';

export interface JwtPayload {
  id: string;
  username: string;
  roleId: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: IUserSafe;
  tokenPayload?: JwtPayload;
  rawToken?: string;
  userPermissions?: string[];
}
