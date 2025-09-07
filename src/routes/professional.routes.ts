import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  requireAdminRoles,
  requireAnyCoordinator,
} from '../middlewares/checkRole';
import {
  createProfessional,
  getProfessionals,
  getProfessionalById,
  updateProfessional,
  deleteProfessional,
  restoreProfessional,
} from '../controllers/professional.ts';

const router = Router();

router.use(checkToken, authMiddleware);

// Public professional queries (accessible to coordinators and admins)
router.get('/search', requireAnyCoordinator, getProfessionals);
router.get('/search/:id', requireAnyCoordinator, getProfessionalById);

// Admin-only operations
router.use(requireAdminRoles);

router.post('/create', createProfessional);
router.patch('/:id', updateProfessional);
router.delete('/:id', deleteProfessional);
router.patch('/:id/restore', restoreProfessional);

export default router;
