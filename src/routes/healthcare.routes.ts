import { Router } from 'express';
import {
  getHealthcareProviders,
  getHealthcareProviderById,
  deleteHealthcareProvider,
  restoreHealthcareProvider,
  createHealthcareProvider,
  updateHealthcareProvider,
} from '../controllers/healthcareProvider';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/checkRole';

const router = Router();

router.use(checkToken, authMiddleware);

router.get('/search', getHealthcareProviders);
router.get('/search/:id', getHealthcareProviderById);
router.post('/create', requireAdmin, createHealthcareProvider);
router.patch('/:id', requireAdmin, updateHealthcareProvider);
router.delete('/:id', requireAdmin, deleteHealthcareProvider);
router.patch('/:id/restore', requireAdmin, restoreHealthcareProvider);

export default router;
