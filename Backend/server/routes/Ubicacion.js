import { Router } from "express";
import { getActiveUserLocations, updateUsuarioLocation } from "../controllers/UbicacionController.js";

const router = Router();

router.get('/usuarios/activos', getActiveUserLocations);
router.post('/usuario/:id', updateUsuarioLocation);

export default router;