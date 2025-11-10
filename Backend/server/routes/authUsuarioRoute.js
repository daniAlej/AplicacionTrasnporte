import { Router } from 'express';
import { loginUsuario } from '../controllers/authUsuario.controller.js';

const router = Router();
router.post('/usuario/login', loginUsuario);

export default router;
