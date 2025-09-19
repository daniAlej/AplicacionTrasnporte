import { Router } from 'express';
import { listUsers, createUser, updateUser, deleteUser,updateUserStatus } from '../controllers/UsuarioController.js';


const router = Router();
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id', updateUserStatus);
router.delete('/:id', deleteUser);
export default router;