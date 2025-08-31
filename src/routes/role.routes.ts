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
router.patch('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);
router.patch('/roles/:id/restore', restoreRole);
export default router;
