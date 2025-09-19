import { Router } from 'express';
import { listUsos, createUso, updateUso, deleteUso } from '../controllers/UsoIntencion.js';
const router = Router();
router.get('/', listUsos);
router.post('/', createUso);
router.put('/:id', updateUso);
router.delete('/:id', deleteUso);
export default router;