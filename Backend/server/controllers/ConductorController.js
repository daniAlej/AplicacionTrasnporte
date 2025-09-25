
import { Usuario, Role, Ruta, Parada, Conductor, Unidad } from '../models/index.js';


export const listConductor = async (req, res) => {
    const conductor = await Conductor.findAll({ include: [Unidad], order: [['id_conductor', 'DESC']] });
    res.json(conductor);
};


export const createConductor = async (req, res) => {
  try {
    const { nombre, correo, contrasena, id_unidad = null, telefono, licencia, licencia_caducidad } = req.body;

    if (!nombre || !correo || !contrasena || !id_unidad || !telefono || !licencia) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const unidad = await Unidad.findByPk(id_unidad);
    if (!unidad) return res.status(400).json({ error: 'Unidad no encontrado' });

    const c = await Conductor.create({ nombre, correo, contrasena, licencia, licencia_caducidad, telefono, id_unidad });
    res.status(201).json(c);
  } catch (e) {
    console.error(e); // 👈 así ves el error exacto en consola backend
    res.status(500).json({ error: e.message });
  }
};

export const updateConductor = async (req, res) => {
    try {
    const { id } = req.params;
    const { nombre, correo, contrasena, id_unidad, estado, telefono, licencia, licencia_caducidad } = req.body;
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