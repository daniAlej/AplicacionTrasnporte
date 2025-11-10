import { verifyToken } from '../utils/jwt.js';

export function requireUsuarioAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const data = verifyToken(token);

    if (data.role !== 'usuario') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    req.usuario = data; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'No autenticado' });
  }
}
