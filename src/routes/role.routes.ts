import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/checkRole';
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
  restoreRole,
} from '../controllers/role';

const router = Router();

router.use(checkToken, authMiddleware, requireAdmin);
router.get('/search', getRoles);
router.get('/search/:id', getRoleById);
router.post('/create', createRole);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);
router.patch('/:id/restore', restoreRole);
export default router;
