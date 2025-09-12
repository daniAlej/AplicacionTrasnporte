import { Router } from 'express';
import { listRoles } from '../controllers/RolesController.js';
const router = Router();
router.get('/', listRoles);
export default router;