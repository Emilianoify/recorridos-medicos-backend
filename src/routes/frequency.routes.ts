import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdminRoles, requireAnyCoordinator } from '../middlewares/checkRole';
import {
  createFrequency,
  getFrequencies,
  getFrequencyById,
  updateFrequency,
  deleteFrequency,
  restoreFrequency,
} from '../controllers/frequency';

const router = Router();

router.use(checkToken, authMiddleware);

// Frequency queries (accessible to coordinators and admins)
router.get('/search', requireAnyCoordinator, getFrequencies);
router.get('/search/:id', requireAnyCoordinator, getFrequencyById);

// Admin-only operations
router.use(requireAdminRoles);

router.post('/create', createFrequency);
router.patch('/:id', updateFrequency);
router.delete('/:id', deleteFrequency);
router.patch('/:id/restore', restoreFrequency);

export default router;