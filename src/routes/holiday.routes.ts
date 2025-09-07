import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  getHolidays,
  isWorkingDay,
} from '../controllers/holiday';

const router = Router();

router.use(checkToken, authMiddleware);

// Holiday queries (accessible to all authenticated users)
router.get('/search', getHolidays);
router.post('/check-working-day', isWorkingDay);

export default router;