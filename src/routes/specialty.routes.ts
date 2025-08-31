import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdminRoles } from '../middlewares/checkRole';
import {
  createSpecialty,
  deleteSpecialty,
  getSpecialties,
  getSpecialtyById,
  restoreSpecialty,
  updateSpecialty,
} from '../controllers/specialty';

const router = Router();

router.use(checkToken, authMiddleware, requireAdminRoles);

router.get('/search', getSpecialties);
router.get('/search/:id', getSpecialtyById);
router.post('/create', createSpecialty);
router.patch('/:id', updateSpecialty);
router.delete('/:id', deleteSpecialty);
router.patch('/:id/restore', restoreSpecialty);
export default router;
