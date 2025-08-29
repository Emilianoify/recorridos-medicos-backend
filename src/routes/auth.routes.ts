import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from '../controllers/auth';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkToken } from '../middlewares/checkToken';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.use(checkToken, authMiddleware);
router.post('/logout', logout);
router.post('/change-password', changePassword);

export default router;
