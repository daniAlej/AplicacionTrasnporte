import { Router } from 'express';
import roles from './roles.js';
import users from './user.js';
import rutas from './rutas.js';
import Conductor from './Conductor.js';
import Unidad from './Unidad.js';
import Institucion from './Intitucion.js';
import Contratos from './Contratos.js';
import Jornada from './Jornada.js';
import UsoIntecion from './UsoIntencion.js';
import Reportes from './Reportes.js';
import rolesConductor from './rolesConductor.js';
import authConductorRoute from './authConductorRoute.js';


const api = Router();
api.use('/roles', roles);
api.use('/usuarios', users);
api.use('/rutas', rutas);
api.use('/conductores', Conductor);
api.use('/unidades', Unidad);
api.use('/instituciones', Institucion);
api.use('/contratos', Contratos);
api.use('/jornadas', Jornada);
api.use('/usointencion', UsoIntecion);
api.use('/reportes', Reportes);
api.use('/rolesconductor', rolesConductor);
api.use('/auth', authConductorRoute);


export default api;