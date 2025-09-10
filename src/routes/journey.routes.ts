import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { 
  requireAnyCoordinator, 
  requireAdminRoles, 
  requireProfessional 
} from '../middlewares/checkRole';
import {
  createJourney,
  getJourneys,
  getJourneyById,
  updateJourney,
  startJourney,
  endJourney,
  deleteJourney,
  generateOptimalRoute,
  getJourneysByDate,
  getJourneysByProfessional,
} from '../controllers/journey';

const router = Router();

router.use(checkToken, authMiddleware);

// Journey queries (accessible to coordinators and professionals)
router.get('/search', requireAnyCoordinator, getJourneys);
router.get('/search/date', requireAnyCoordinator, getJourneysByDate);
router.get('/search/professional/:professionalId', requireAnyCoordinator, getJourneysByProfessional);

// Individual journey operations
router.get('/:id', requireAnyCoordinator, getJourneyById);
router.patch('/:id', requireAnyCoordinator, updateJourney);

// Journey lifecycle operations (coordinators and professionals)
router.post('/:id/start', requireAnyCoordinator, startJourney);
router.post('/:id/end', requireAnyCoordinator, endJourney);

// Route optimization (accessible to coordinators and professionals)
router.get('/:id/optimize-route', requireAnyCoordinator, generateOptimalRoute);

// Journey creation and deletion (coordinators only)
router.post('/create', requireAnyCoordinator, createJourney);
router.delete('/:id', requireAnyCoordinator, deleteJourney);

export default router;