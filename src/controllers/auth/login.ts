import { Request, Response } from 'express';
import { sendInternalErrorResponse } from '../../utils/commons/responseFunctions';

interface RegisterRequest {
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password: string;
  roleId: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      firstname,
      lastname,
      corporative_email,
      password,
      roleId,
    }: RegisterRequest = req.body;
  } catch (error) {
    return sendInternalErrorResponse(res);
  }
};
