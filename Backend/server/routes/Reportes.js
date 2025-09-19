import { Router } from 'express';
import { listReportes, createReporte, deleteReporte } from '../controllers/ReportesController.js';
const router = Router();
router.get('/', listReportes);
router.post('/', createReporte);
router.delete('/:id', deleteReporte);
export default router;