import { Router } from 'express';
import { requireConductorAuth } from '../middlewares/authConductor.js';
import { listConductor, createConductor, updateConductor, deleteConductor,getConductorMe } from '../controllers/ConductorController.js';
import { updateConductorLocation, getActiveConductorLocations } from '../controllers/UbicacionController.js';

const router = Router();
router.get('/', listConductor);
router.get('/me', requireConductorAuth, getConductorMe);
router.get('/locations/active', getActiveConductorLocations);
router.post('/', createConductor);
router.post('/location', requireConductorAuth, updateConductorLocation);
router.put('/:id', updateConductor);
router.delete('/:id', deleteConductor);
export default router;