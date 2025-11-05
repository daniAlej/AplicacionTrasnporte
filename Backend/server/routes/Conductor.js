import { Router } from 'express';
import { requireConductorAuth } from '../middlewares/authConductor.js';
import { listConductor, createConductor, updateConductor, deleteConductor,getConductorMe } from '../controllers/ConductorController.js';


const router = Router();
router.get('/', listConductor);
router.get('/me', requireConductorAuth, getConductorMe);
router.post('/', createConductor);
router.put('/:id', updateConductor);
router.delete('/:id', deleteConductor);
export default router;