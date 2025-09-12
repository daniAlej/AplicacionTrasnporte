import { Router } from 'express';
import { listRutas, getRuta, createRuta, updateRuta, deleteRuta, listParadasByRuta } from '../controllers/routesController.js';


const router = Router();
router.get('/', listRutas);
router.get('/:id', getRuta);
router.get('/:id/paradas', listParadasByRuta);
router.post('/', createRuta);
router.put('/:id', updateRuta);
router.delete('/:id', deleteRuta);
export default router;