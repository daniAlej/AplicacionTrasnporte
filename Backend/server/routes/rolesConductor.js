import { Router } from 'express';
import {  listRolesC } from '../controllers/RolesConductorController.js';
const router = Router();
router.get('/', listRolesC);
export default router;