import { Router } from 'express';
import { listInstituciones, createInstitucion, updateInstitucion, deleteInstitucion } from '../controllers/InstitucionController.js';
const router = Router();
router.get('/', listInstituciones);
router.post('/', createInstitucion);
router.put('/:id', updateInstitucion);
router.delete('/:id', deleteInstitucion);
export default router;