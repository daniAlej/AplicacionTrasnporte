import { Conductor, Usuario, Unidad, Jornada, UsoIntencion, Parada } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Función auxiliar para calcular la distancia entre dos puntos geográficos
 * usando la fórmula de Haversine
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

// Controlador para actualizar la ubicación de un conductor
export const updateConductorLocation = async (req, res) => {
  try {
    const { id_conductor } = req.conductor;
    const { latitud, longitud } = req.body;



    const conductor = await Conductor.findByPk(id_conductor, {
      include: [{ model: Unidad, attributes: ['id_ruta'] }]
    });

    if (!conductor) {
      console.error('❌ Conductor no encontrado:', id_conductor);
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }



    // Verificar si hay jornada activa
    const jornadaActiva = await Jornada.findOne({
      where: {
        id_conductor,
        estado: { [Op.in]: ['pendiente', 'en_curso'] }
      }
    });

    let jornadaCompletada = false;
    if (!jornadaActiva) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const jornadaDelDia = await Jornada.findOne({
        where: {
          id_conductor,
          fecha: { [Op.gte]: today },
          estado: 'completada'
        }
      });

      if (jornadaDelDia) {
        jornadaCompletada = true;
      }
    }

    // ACTUALIZAR UBICACIÓN
    conductor.latitud_actual = latitud;
    conductor.longitud_actual = longitud;
    conductor.ultima_actualizacion_ubicacion = new Date();


    // GUARDAR EN BASE DE DATOS
    await conductor.save();


    // VERIFICAR QUE SE GUARDÓ
    const conductorActualizado = await Conductor.findByPk(id_conductor);

    // ==================== VERIFICACIÓN DE PROXIMIDAD AUTOMÁTICA ====================
    let notificacionesEnviadas = 0;
    let usuariosNotificados = [];

    if (jornadaActiva) {
      try {
        // Buscar todos los UsoIntencion para esta jornada que no han sido confirmados
        const usosNoConfirmados = await UsoIntencion.findAll({
          where: {
            id_jornada: jornadaActiva.id_jornada,
            confirmado: false
          },
          include: [{
            model: Usuario,
            attributes: ['id_usuario', 'nombre', 'correo'],
            include: [{
              model: Parada,
              attributes: ['id_parada', 'nombre_parada', 'lat', 'lng']
            }]
          }]
        });

        // Verificar distancia a cada parada
        for (const uso of usosNoConfirmados) {
          const parada = uso.Usuario?.Parada;

          if (!parada || !parada.lat || !parada.lng) {
            continue;
          }

          const distancia = calcularDistancia(
            latitud,
            longitud,
            parada.lat,
            parada.lng
          );

          // Si la unidad está a menos de 200m de la parada, enviar notificación
          if (distancia <= 200) {
            const notificacion = {
              idUsuario: uso.id_usuario,
              nombreUsuario: uso.Usuario.nombre,
              parada: parada.nombre_parada,
              distancia: Math.round(distancia),
              mensaje: `La unidad está a ${Math.round(distancia)} metros de tu parada (${parada.nombre_parada})`
            };

            usuariosNotificados.push(notificacion);

            // Emitir notificación por WebSocket
            if (req.io) {
              req.io.emit(`notificacion_usuario_${uso.id_usuario}`, {
                mensaje: notificacion.mensaje,
                tipo: 'proximidad_unidad',
                distancia: Math.round(distancia),
                parada: parada.nombre_parada,
                timestamp: new Date()
              });
              notificacionesEnviadas++;
            }

            console.log(`📢 Notificación enviada a usuario ${uso.id_usuario}: ${notificacion.mensaje}`);
          }
        }
      } catch (error) {
        console.error('Error en verificación de proximidad automática:', error);
      }
    }
    // ============================================================================

    // Emitir la actualización a través de WebSockets
    const payload = {
      id_conductor: conductor.id_conductor,
      latitud,
      longitud,
      id_ruta: conductor.Unidad?.id_ruta,
      notificacionesEnviadas,
      usuariosNotificados: usuariosNotificados.length
    };

    const target = conductor.Unidad?.id_ruta ? `route_${conductor.Unidad.id_ruta}` : 'general';
    req.io.emit('conductorLocationUpdate', payload);


    res.json({
      message: 'Ubicación del conductor actualizada',
      latitud,
      longitud,
      jornadaActiva: !!jornadaActiva,
      jornadaCompletada,
      // Información de notificaciones
      notificacionesEnviadas,
      usuariosNotificados,
      // AGREGAR ESTOS CAMPOS PARA DEBUGGING
      latitud_guardada: conductorActualizado.latitud_actual,
      longitud_guardada: conductorActualizado.longitud_actual
    });
  } catch (e) {

    console.error('Error completo:', e);
    console.error('Stack:', e.stack);
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