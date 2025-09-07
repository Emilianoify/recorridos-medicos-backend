import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/checkRole';
import {
  getAuditTrail,
} from '../controllers/audit';

const router = Router();

router.use(checkToken, authMiddleware);

// Admin-only audit access
router.use(requireAdmin);

router.get('/trail', getAuditTrail);

export default router;