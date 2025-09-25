import { Usuario, Role, Ruta, Parada, Unidad } from '../models/index.js';


export const listUnidad = async (req, res) => {
    const unidad = await Unidad.findAll({ include: [Ruta], order: [['id_unidad', 'DESC']] });
    res.json(unidad);
};


export const createUnidad = async (req, res) => {
  try {
    const { placa, matricula, matricula_caducidad, modelo, capacidad, id_ruta = null} = req.body;

    if (!placa || !modelo || !capacidad  ) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    

    const u = await Unidad.create({ placa, matricula, matricula_caducidad, modelo, capacidad, id_ruta });
    res.status(201).json(u);
  } catch (e) {
    console.error(e); // 👈 así ves el error exacto en consola backend
    res.status(500).json({ error: e.message });
  }
};

export const updateUnidad = async (req, res) => {
    try {
    const { id } = req.params;
    const { placa,matricula,matricula_caducidad, modelo, capacidad, estado, id_ruta } = req.body;
    const u = await Unidad.findByPk(id);
    if (!u) return res.status(404).json({ error: 'Unidad no encontrado' });
    if (id_ruta !== undefined) {
        const r = await Ruta.findByPk(id_ruta);
        if (!r) return res.status(400).json({ error: 'Ruta no válido' });
        u.id_ruta = id_ruta;
    }
    if (placa !== undefined) u.placa = placa;
    if (matricula !== undefined) u.matricula = matricula;
    if (matricula_caducidad !== undefined) u.matricula_caducidad = matricula_caducidad;
    if (modelo !== undefined) u.modelo = modelo;
    if (capacidad !== undefined) u.capacidad = capacidad; // TODO: hashear en prod
    if (id_ruta !== undefined) u.id_ruta = id_ruta;
    if (estado !== undefined) u.estado = estado;

    await u.save();
    res.json(u);
    } catch (e) {
    res.status(500).json({ error: e.message });
    }
};


export const deleteUnidad = async (req, res) => {
    try {
        const { id } = req.params;
        const u = await Unidad.findByPk(id);
        if (!u) return res.status(404).json({ error: 'Unidad no encontrado' });
        //u.estado = 'inactivo'
        await u.destroy();
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};