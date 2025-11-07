import { Router } from 'express';
import { listJornadas, createJornada, deleteJornada, iniciarJornada } from '../controllers/JornadaController.js';
import { requireConductorAuth } from '../middlewares/authConductor.js';
const router = Router();
router.get('/', listJornadas);
router.post('/', createJornada);
router.post('/iniciar-jornada', requireConductorAuth, iniciarJornada);
router.delete('/:fecha', deleteJornada); // fecha en path YYYY-MM-DD
export default router;