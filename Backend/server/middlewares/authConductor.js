import { verifyToken } from '../utils/jwt.js';

export function requireConductorAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const data = verifyToken(token);

    if (data.role !== 'conductor') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    req.conductor = data; // { id_conductor, id_unidad, id_ruta, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'No autenticado' });
  }
}