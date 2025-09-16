import { Router } from 'express';
import roles from './roles.js';
import users from './user.js';
import rutas from './rutas.js';
import Conductor from './Conductor.js';
import Unidad from './Unidad.js';


const api = Router();
api.use('/roles', roles);
api.use('/usuarios', users);
api.use('/rutas', rutas);
api.use('/conductores', Conductor);
api.use('/unidades', Unidad);


export default api;