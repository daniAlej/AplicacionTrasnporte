import { Router } from 'express';
import { listContratos, createContrato, updateContrato, deleteContrato } from '../controllers/ContratosController.js';
const router = Router();
router.get('/', listContratos);
router.post('/', createContrato);
router.put('/:id', updateContrato);
router.delete('/:id', deleteContrato);
export default router;