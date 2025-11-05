import { Usuario, Role, Ruta, Parada } from '../models/index.js';


export const listUsers = async (req, res) => {
  const users = await Usuario.findAll({ include: [Role, Ruta, Parada], order: [['id_usuario', 'DESC']] });
  res.json(users);
};


export const createUser = async (req, res) => {
  try {
    const { nombre, correo, contrasena, id_rol, id_ruta = null, id_parada = null, telefono } = req.body;

    if (!nombre || !correo || !contrasena || !id_rol || !telefono) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const role = await Role.findByPk(id_rol);
    if (!role) return res.status(400).json({ error: 'Rol no encontrado' });

    const u = await Usuario.create({ nombre, correo, contrasena, id_rol, id_ruta, id_parada, telefono });
    res.status(201).json(u);
  } catch (e) {
    console.error(e); // 👈 así ves el error exacto en consola backend
    res.status(500).json({ error: e.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, contrasena, id_rol, id_ruta, id_parada, estado } = req.body;
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (id_rol !== undefined) {
      const r = await Role.findByPk(id_rol);
      if (!r) return res.status(400).json({ error: 'Rol no válido' });
      u.id_rol = id_rol;
    }
    if (nombre !== undefined) u.nombre = nombre;
    if (correo !== undefined) u.correo = correo;
    if (contrasena !== undefined) u.contrasena = contrasena; // TODO: hashear en prod
    if (id_ruta !== undefined) u.id_ruta = id_ruta;
    if (id_parada !== undefined) u.id_parada = id_parada;
    if (estado !== undefined) u.estado = estado;

    await u.save();
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    u.estado = 'inactivo'
    await u.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    u.estado = u.estado === 'activo' ? 'inactivo' : 'activo';
    await u.save();
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
