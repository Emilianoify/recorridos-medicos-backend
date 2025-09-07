import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminRoles } from '../middlewares/checkRole';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  getUserProfile,
  updateUserProfile,
} from '../controllers/user';

const router = Router();

router.use(checkToken, authMiddleware);

router.get('/profile', getUserProfile);

router.patch('/profile', updateUserProfile);

router.get('/search', requireAdminRoles, getUsers);

router.get('/search/:id', requireAdminRoles, getUserById);

router.use(requireAdmin);

router.post('/create', createUser);

router.patch('/:id', updateUser);

router.delete('/:id', deleteUser);

router.patch('/:id/restore', restoreUser);

export default router;
