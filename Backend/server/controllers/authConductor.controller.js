import bcrypt from 'bcrypt';
import { Conductor } from '../models/index.js';
import { signConductor } from '../utils/jwt.js';
import sequelize from '../db.js';
import { verifyToken } from '../utils/jwt.js';


export async function loginConductor(req, res) {
  try {
    const { correo, contrasena } = req.body;

    const conductor = await Conductor.findOne({
      where: { correo, estado: 'activo' }
    });

    if (!conductor) return res.status(400).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(contrasena, conductor.contrasena).catch(() => false);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });

    if (Number(conductor.id_rol) !== 3) {
      return res.status(403).json({ error: 'No es un conductor válido' });
    }

    // Inferir id_ruta y placa desde Unidades:
    let id_ruta = null;
    let nombre_ruta = null;
    let placa = null;

    if (conductor.id_unidad) {
      // Obtener placa de la unidad
      const [rowsPlaca] = await sequelize.query(
        'SELECT placa FROM unidades WHERE id_unidad = ? LIMIT 1',
        { replacements: [conductor.id_unidad] }
      );
      placa = rowsPlaca?.[0]?.placa ?? null;

      // Obtener id_ruta y nombre_ruta
      const [rowsRuta] = await sequelize.query(
        'SELECT ruta.id_ruta, ruta.nombre_ruta FROM ruta JOIN unidades ON unidades.id_ruta = ruta.id_ruta WHERE unidades.id_unidad = ? LIMIT 1',
        { replacements: [conductor.id_unidad] }
      );
      id_ruta = rowsRuta?.[0]?.id_ruta ?? null;
      nombre_ruta = rowsRuta?.[0]?.nombre_ruta ?? null;
    }

    const token = signConductor({
      role: 'conductor',
      id_conductor: conductor.id_conductor,
      id_unidad: conductor.id_unidad || null,
      id_ruta: id_ruta,
      placa,
      nombre_ruta,
      id_rolConductor: conductor.id_rolConductor
    });

    return res.json({
      token,
      conductor: {
        id_conductor: conductor.id_conductor,
        id: conductor.id_conductor,  // Alias para compatibilidad
        nombre: conductor.nombre,
        correo: conductor.correo,
        id_unidad: conductor.id_unidad,
        id_ruta: id_ruta,  // ← AGREGADO
        placa,
        nombre_ruta,
        id_rolConductor: conductor.id_rolConductor
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en login' });
  }
}