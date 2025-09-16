import { Router } from 'express';
import { listConductor, createConductor, updateConductor, deleteConductor } from '../controllers/ConductorController.js';


const router = Router();
router.get('/', listConductor);
router.post('/', createConductor);
router.put('/:id', updateConductor);
router.delete('/:id', deleteConductor);
export default router;