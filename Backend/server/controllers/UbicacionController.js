import { Conductor, Usuario, Unidad, Jornada } from '../models/index.js';
import { Op } from 'sequelize';

// Controlador para actualizar la ubicación de un conductor
export const updateConductorLocation = async (req, res) => {
  try {
    const { id_conductor } = req.conductor;
    const { latitud, longitud } = req.body;

    const conductor = await Conductor.findByPk(id_conductor, {
      include: [{ model: Unidad, attributes: ['id_ruta'] }]
    });

    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    conductor.latitud_actual = latitud;
    conductor.longitud_actual = longitud;
    conductor.ultima_actualizacion_ubicacion = new Date();
    await conductor.save();

    // Emitir la actualización a través de WebSockets
    const payload = {
      id_conductor: conductor.id_conductor,
      latitud,
      longitud,
      id_ruta: conductor.Unidad?.id_ruta // Incluir el id_ruta si existe
    };

    // Emitir a todos los clientes o a una sala específica si la ruta existe
    const target = conductor.Unidad?.id_ruta ? `route_${conductor.Unidad.id_ruta}` : 'general';
    req.io.emit('conductorLocationUpdate', payload);

    res.json({ message: 'Ubicación del conductor actualizada', latitud, longitud });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// Controlador para actualizar la ubicación de un usuario
export const updateUsuarioLocation = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { latitud, longitud } = req.body;

    const usuario = await Usuario.findByPk(id_usuario, {
      attributes: ['id_usuario', 'latitud_actual', 'longitud_actual', 'ultima_actualizacion_ubicacion', 'id_ruta']
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    usuario.latitud_actual = latitud;
    usuario.longitud_actual = longitud;
    usuario.ultima_actualizacion_ubicacion = new Date();
    await usuario.save();

    // Emitir la actualización a través de WebSockets
    const payload = {
      id_usuario: usuario.id_usuario,
      latitud,
      longitud,
      id_ruta: usuario.id_ruta
    };

    const target = usuario.id_ruta ? `route_${usuario.id_ruta}` : 'general';
    req.io.emit('userLocationUpdate', payload);

    res.json({ message: 'Ubicación del usuario actualizada', latitud, longitud });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// Controlador para obtener las ubicaciones actuales de todos los conductores activos
export const getActiveConductorLocations = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jornadas = await Jornada.findAll({
      where: {
        fecha: {
          [Op.gte]: today
        }
      },
      attributes: ['id_unidad']
    });

    const activeUnidadIds = jornadas.map(j => j.id_unidad);

    const conductores = await Conductor.findAll({
      where: {
        id_unidad: {
          [Op.in]: activeUnidadIds
        },
        latitud_actual: { [Op.ne]: null }
      },
      attributes: ['id_conductor', 'nombre', 'latitud_actual', 'longitud_actual', 'ultima_actualizacion_ubicacion'],
      include: [{
        model: Unidad,
        attributes: ['id_unidad', 'placa', 'id_ruta']
      }]
    });
    res.json(conductores);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// Controlador para obtener las ubicaciones actuales de todos los usuarios activos
export const getActiveUserLocations = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { estado: 'activo', latitud_actual: { [Usuario.sequelize.Op.ne]: null } },
      attributes: ['id_usuario', 'nombre', 'latitud_actual', 'longitud_actual', 'ultima_actualizacion_ubicacion']
    });
    res.json(usuarios);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};