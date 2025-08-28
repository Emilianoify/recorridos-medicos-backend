import { Router } from 'express';
import { register } from '../controllers/auth';

const router = Router();

router.use('/register', register);

export default router;
