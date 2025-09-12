import { Router } from 'express';
import roles from './roles.js';
import users from './user.js';
import rutas from './rutas.js';


const api = Router();
api.use('/roles', roles);
api.use('/usuarios', users);
api.use('/rutas', rutas);


export default api;