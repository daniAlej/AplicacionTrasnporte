import { Router } from 'express';
import { listJornadas, createJornada, deleteJornada } from '../controllers/JornadaController.js';
const router = Router();
router.get('/', listJornadas);
router.post('/', createJornada);
router.delete('/:fecha', deleteJornada); // fecha en path YYYY-MM-DD
export default router;