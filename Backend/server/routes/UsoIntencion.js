import { Router } from 'express';
import {
    listUsos,
    createUso,
    updateUso,
    deleteUso,
    verificarProximidadUnidad,
    verificarProximidadUsuario,
    obtenerUsosConProximidad
} from '../controllers/UsoIntencion.js';
//import { authConductor } from '../middleware/authConductor.js';
import { requireConductorAuth } from '../middlewares/authConductor.js'
const router = Router();

// Rutas básicas CRUD
router.get('/', listUsos);
router.post('/', createUso);
router.put('/:id', updateUso);
router.delete('/:id', deleteUso);

// Rutas de proximidad
// POST /api/uso-intencion/verificar-proximidad-unidad
// Verifica la proximidad de la unidad a las paradas de los usuarios
// Requiere autenticación de conductor
router.post('/verificar-proximidad-unidad', requireConductorAuth, verificarProximidadUnidad);

// POST /api/uso-intencion/verificar-proximidad-usuario/:id_usuario
// Verifica la proximidad del usuario a la unidad y confirma automáticamente si está a < 100m
router.post('/verificar-proximidad-usuario/:id_usuario', verificarProximidadUsuario);

// GET /api/uso-intencion/con-proximidad/:id_usuario?latitud=X&longitud=Y
// Obtiene los usos de un usuario con información de distancia a la unidad
router.get('/con-proximidad/:id_usuario', obtenerUsosConProximidad);

export default router;