import Router from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';

import { getPatients } from '../controllers/patient';

const router = Router();

router.use(checkToken, authMiddleware);

router.get('/search', getPatients);

export default router;
