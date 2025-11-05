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

    // Si todavía no has migrado a hash, usa comparación directa temporalmente:
    // const ok = contrasena === conductor.contrasena;

    const ok = await bcrypt.compare(contrasena, conductor.contrasena).catch(() => false);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });

    if (Number(conductor.id_rol) !== 3) {
      return res.status(403).json({ error: 'No es un conductor válido' });
    }

    // (Opcional) inferir id_ruta desde Unidades:
    let id_ruta = null;
    let nombre_ruta = null;
    let placa = null;
    if (conductor.id_unidad) {
      const [rows] = await sequelize.query(
        ' select placa from unidades join conductores on unidades.id_unidad = conductores.id_unidad where conductores.id_unidad=? limit 1',
        { replacements: [conductor.id_unidad] }
      );

      placa = rows?.[0]?.placa ?? null;

    }
    if (conductor.id_unidad) {
      const [rows] = await sequelize.query(
        ' select nombre_ruta from ruta join unidades on unidades.id_ruta = ruta.id_ruta where unidades.id_unidad = ? limit 1',
        { replacements: [conductor.id_unidad] }
      );

      nombre_ruta = rows?.[0]?.nombre_ruta ?? null;

    }

    const token = signConductor({
      role: 'conductor',
      id_conductor: conductor.id_conductor,
      id_unidad: conductor.id_unidad || null,
      placa,
      nombre_ruta,
      id_rolConductor: conductor.id_rolConductor
    });

    return res.json({
      token,
      conductor: {
        id_conductor: conductor.id_conductor,
        nombre: conductor.nombre,
        correo: conductor.correo,
        id_unidad: conductor.id_unidad,
        placa,
        nombre_ruta,
        id_rolConductor: conductor.id_rolConductor
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en login' });
  }
};
