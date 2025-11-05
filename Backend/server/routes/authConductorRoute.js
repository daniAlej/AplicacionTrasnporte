import { Router } from 'express';
import { loginConductor } from '../controllers/authConductor.controller.js';

const router = Router();
router.post('/conductor/login', loginConductor);

export default router;
