
import { Usuario, Role, Ruta, Parada, Conductor, Unidad, RolConductor } from '../models/index.js';


export const listConductor = async (req, res) => {
  const conductor = await Conductor.findAll({ include: [Unidad], order: [['id_conductor', 'DESC']], include: [RolConductor], order: [['id_rolConductor', 'DESC']] });
  res.json(conductor);
};


export const createConductor = async (req, res) => {
  try {
    const { nombre, correo, contrasena, id_unidad = null, telefono, licencia, licencia_caducidad, id_rolConductor } = req.body;

    if (!nombre || !correo || !contrasena || !id_unidad || !telefono || !licencia) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const unidad = await Unidad.findByPk(id_unidad);
    if (!unidad) return res.status(400).json({ error: 'Unidad no encontrado' });

    const c = await Conductor.create({ nombre, correo, contrasena, licencia, licencia_caducidad, telefono, id_unidad, id_rolConductor });
    const { contrasena: _, ...safe } = c.toJSON(); // 👈 quita la contraseña
    res.status(201).json(safe);
  } catch (e) {
    console.error(e); // 👈 así ves el error exacto en consola backend
    res.status(500).json({ error: e.message });
  }
};

export const updateConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, contrasena, id_unidad, estado, telefono, licencia, licencia_caducidad, id_rolConductor } = req.body;
    const c = await Conductor.findByPk(id);
    if (!c) return res.status(404).json({ error: 'Conductor no encontrado' });
    if (id_unidad !== undefined) {
      const u = await Unidad.findByPk(id_unidad);
      if (!u) return res.status(400).json({ error: 'Unidad no válido' });
      c.id_unidad = id_unidad;
    }
    if (nombre !== undefined) c.nombre = nombre;
    if (correo !== undefined) c.correo = correo;
    if (contrasena !== undefined) c.contrasena = contrasena; // TODO: hashear en prod
    if (id_unidad !== undefined) c.id_unidad = id_unidad;
    if (estado !== undefined) c.estado = estado;
    if (telefono !== undefined) c.telefono = telefono;
    if (licencia !== undefined) c.licencia = licencia;
    if (licencia_caducidad !== undefined) c.licencia_caducidad = licencia_caducidad;
    if (id_rolConductor !== undefined) c.id_rolConductor = id_rolConductor;

    await c.save();
    res.json(c);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const deleteConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Conductor.findByPk(id);
    if (!c) return res.status(404).json({ error: 'Conductor no encontrado' });
    //u.estado = 'inactivo'
    await c.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
// /conductor/me
export async function getConductorMe(req, res) {
  try {
    console.log("req.conductor:", req.conductor);
    const id = req.conductor.id_conductor;
    console.log("Buscando conductor con id:", id);
    const conductor = await Conductor.findOne({
      where: { id_conductor: id },
      include: [
        {
          model: Unidad,
          attributes: ['id_unidad', 'placa'],
          include: [
            {
              model: Ruta,
              attributes: ['id_ruta', 'nombre_ruta']
            }
          ]
        }
      ]
    });

    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' });

    return res.json({
      conductor: {
        id_conductor: conductor.id_conductor,
        nombre: conductor.nombre,
        correo: conductor.correo,
        rol: conductor.id_rolConductor === 1 ? 'Principal' : 'Suplente',
        unidad: conductor.Unidad
          ? {
            id_unidad: conductor.Unidad.id_unidad,
            placa: conductor.Unidad.placa,
            ruta: conductor.Unidad.ruta
              ? {
                id_ruta: conductor.Unidad.ruta.id_ruta,
                nombre_ruta: conductor.Unidad.ruta.nombre_ruta
              }
              : null
          }
          : null
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al obtener datos del conductor' });
  }
}