import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdminRoles, requireAnyCoordinator } from '../middlewares/checkRole';
import {
  getZones,
  getZoneById,
  createZone,
  deleteZone,
  restoreZone,
  updateZone,
  getZoneCoordinates,
} from '../controllers/zone';

const router = Router();

router.use(checkToken, authMiddleware);

// Zone queries (accessible to coordinators and admins)
router.get('/search', requireAnyCoordinator, getZones);
router.get('/search/:id', requireAnyCoordinator, getZoneById);
router.get('/:id/coordinates', requireAnyCoordinator, getZoneCoordinates);

// Admin-only operations
router.use(requireAdminRoles);

router.post('/create', createZone);
router.patch('/:id', updateZone);
router.delete('/:id', deleteZone);
router.patch('/:id/restore', restoreZone);

export default router;