import { Router } from 'express';
import { listUnidad, createUnidad, updateUnidad, deleteUnidad } from '../controllers/UnidadController.js';


const router = Router();
router.get('/', listUnidad);
router.post('/', createUnidad);
router.put('/:id', updateUnidad);
router.delete('/:id', deleteUnidad);
export default router;