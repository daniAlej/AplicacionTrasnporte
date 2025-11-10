import { Router } from 'express';
import { listReportes, createReporte, deleteReporte } from '../controllers/ReportesController.js';
import upload from '../middlewares/upload.js';

const router = Router();

router.get('/', listReportes);
router.post('/', upload.single('foto'), createReporte); 
router.delete('/:id', deleteReporte);

export default router;
