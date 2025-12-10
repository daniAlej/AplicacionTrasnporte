import { Router } from 'express';
import {
    listJornadas,
    createJornada,
    deleteJornada,
    iniciarJornada,
    confirmarParada,
    finalizarJornada,
    getJornadaActiva,
    getParadasPendientes,
    verificarProximidadParada
} from '../controllers/JornadaController.js';
import { requireConductorAuth } from '../middlewares/authConductor.js';

const router = Router();
router.get('/', listJornadas);
router.post('/', createJornada);
router.post('/iniciar', requireConductorAuth, iniciarJornada);
router.post('/confirmar-parada', requireConductorAuth, confirmarParada);
router.post('/finalizar', requireConductorAuth, finalizarJornada);
router.get('/activa/:id_conductor', getJornadaActiva);
router.get('/:id_jornada/paradas-pendientes', getParadasPendientes);
router.post('/verificar-proximidad', requireConductorAuth, verificarProximidadParada);
router.delete('/:id', deleteJornada);
export default router;