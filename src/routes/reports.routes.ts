import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(checkToken, authMiddleware);

// TODO: Implement report controllers
// Routes will be added as controllers are implemented

export default router;