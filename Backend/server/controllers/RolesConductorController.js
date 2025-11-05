import { RolConductor } from '../models/index.js';

export const listRolesC = async (req, res) => {
  try {
    const rolesC = await RolConductor.findAll({ order: [['id_rolConductor', 'ASC']] }); // 👈 corregido
    res.json(rolesC);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};
