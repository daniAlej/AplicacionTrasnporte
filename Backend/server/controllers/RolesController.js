import { Role } from '../models/index.js';

export const listRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['id_rol', 'ASC']] }); // 👈 corregido
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};
