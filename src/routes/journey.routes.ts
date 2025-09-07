import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAnyCoordinator } from '../middlewares/checkRole';
import {
  createJourney,
  getJourneys,
  startJourney,
} from '../controllers/journey';

const router = Router();

router.use(checkToken, authMiddleware);

// Journey queries (accessible to coordinators and professionals)
router.get('/search', requireAnyCoordinator, getJourneys);

// Journey creation (coordinators only)
router.post('/create', requireAnyCoordinator, createJourney);
router.post('/:id/start', requireAnyCoordinator, startJourney);

export default router;