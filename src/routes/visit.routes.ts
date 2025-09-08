import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdminRoles, requireAnyCoordinator } from '../middlewares/checkRole';
import {
  createVisit,
  getVisits,
  getVisitById,
  getVisitsByJourney,
  getVisitsByPatient,
  getVisitsByStatus,
  updateVisit,
  completeVisit,
  cancelVisit,
  confirmVisit,
} from '../controllers/visit';

const router = Router();

router.use(checkToken, authMiddleware);

// Visit queries (accessible to coordinators and admins)
router.get('/search', requireAnyCoordinator, getVisits);
router.get('/search/:id', requireAnyCoordinator, getVisitById);
router.get('/by-journey/:journeyId', requireAnyCoordinator, getVisitsByJourney);
router.get('/by-patient/:patientId', requireAnyCoordinator, getVisitsByPatient);
router.get('/by-status/:status', requireAnyCoordinator, getVisitsByStatus);

// Visit operations (accessible to coordinators and admins)
router.patch('/:id/confirm', requireAnyCoordinator, confirmVisit);
router.patch('/:id/complete', requireAnyCoordinator, completeVisit);
router.patch('/:id/cancel', requireAnyCoordinator, cancelVisit);
router.patch('/:id', requireAnyCoordinator, updateVisit);

// Admin-only operations
router.use(requireAdminRoles);

router.post('/create', createVisit);

export default router;