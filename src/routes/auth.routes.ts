import { Router } from 'express';
import { login, register } from '../controllers/auth';

const router = Router();

router.use('/register', register);
router.post('/login', login);

export default router;
