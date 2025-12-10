import { UsoIntencion, Usuario, Unidad, Jornada, Parada, Ruta, Conductor } from '../models/index.js';

/**
 * Función auxiliar para calcular la distancia entre dos puntos geográficos
 * usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} - Distancia en metros
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

// Constantes de proximidad
const DISTANCIA_ALERTA = 10000; // metros - Alerta cuando la unidad se acerca a la parada
const DISTANCIA_CONFIRMACION = 100; // metros - Confirma que el usuario usó la unidad

export const listUsos = async (req, res) => {
    try {
        const data = await UsoIntencion.findAll({
            include: [{
                model: Usuario, attributes: ['id_usuario', 'nombre', 'correo'],
                include: [{ model: Parada, attributes: ['id_parada', 'nombre_parada'] }, { model: Ruta, attributes: ['id_ruta', 'nombre_ruta'] }]
            },
            {
                model: Jornada, attributes: ['id_jornada', 'fecha', 'id_unidad'],
                include: [{ model: Unidad, attributes: ['id_unidad', 'placa'] }]
            }], order: [['id_uso', 'DESC']]
        });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createUso = async (req, res) => {
    try {
        const { id_usuario, id_jornada, indicado = true, confirmado = false } = req.body; // id_jornada = 'YYYY-MM-DD'
        const u = await UsoIntencion.create({ id_usuario, id_jornada, indicado, confirmado });
        res.status(201).json(u);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateUso = async (req, res) => {
    try {
        const u = await UsoIntencion.findByPk(req.params.id);
        if (!u) return res.status(404).json({ error: 'UsoIntencion no encontrado' });
        Object.assign(u, req.body);
        await u.save();
        res.json(u);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteUso = async (req, res) => {
    try {
        const u = await UsoIntencion.findByPk(req.params.id);
        if (!u) return res.status(404).json({ error: 'UsoIntencion no encontrado' });
        await u.destroy();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * Verifica la proximidad de la unidad a las paradas de los usuarios
 * y envía notificaciones cuando está cerca (< 200m)
 * Endpoint: POST /api/usointencion/verificar-proximidad-unidad
 * Requiere: id_conductor en el token de autenticación
 * Body: { latitud, longitud }
 */
export const verificarProximidadUnidad = async (req, res) => {
    try {
        const { id_conductor } = req.conductor; // Asume que tienes middleware de autenticación
        const { latitud, longitud } = req.body;

        if (!latitud || !longitud) {
            return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
        }

        // Obtener la jornada activa del conductor
        const jornadaActiva = await Jornada.findOne({
            where: {
                id_conductor,
                estado: 'en_curso'
            },
            include: [{ model: Unidad }]
        });

        if (!jornadaActiva) {
            return res.json({
                mensaje: 'No hay jornada activa',
                usuariosCercanos: []
            });
        }

        // Buscar todos los UsoIntencion para esta jornada que no han sido confirmados
        const usosNoConfirmados = await UsoIntencion.findAll({
            where: {
                id_jornada: jornadaActiva.id_jornada,
                confirmado: false
            },
            include: [{
                model: Usuario,
                include: [{
                    model: Parada,
                    attributes: ['id_parada', 'nombre_parada', 'lat', 'lng']
                }]
            }]
        });

        console.log('🔍 DIAGNÓSTICO DE PROXIMIDAD:');
        console.log(`📍 Ubicación del conductor: lat=${latitud}, lng=${longitud}`);
        console.log(`🚌 Jornada activa: ID=${jornadaActiva.id_jornada}`);
        console.log(`👥 Usos no confirmados encontrados: ${usosNoConfirmados.length}`);

        const usuariosCercanos = [];
        const notificaciones = [];

        // Verificar la distancia para cada usuario
        for (const uso of usosNoConfirmados) {
            console.log(`\n--- Procesando uso ID: ${uso.id_uso} ---`);
            console.log(`Usuario: ${uso.Usuario?.nombre || 'Sin nombre'} (ID: ${uso.id_usuario})`);

            const parada = uso.Usuario?.Parada;

            if (!parada) {
                console.log('❌ Usuario sin parada asignada');
                continue;
            }

            if (!parada.lat || !parada.lng) {
                console.log(`❌ Parada "${parada.nombre_parada}" sin coordenadas (lat: ${parada.lat}, lng: ${parada.lng})`);
                continue;
            }

            console.log(`📍 Parada: "${parada.nombre_parada}" (ID: ${parada.id_parada})`);
            console.log(`   Coordenadas: lat=${parada.lat}, lng=${parada.lng}`);

            const distancia = calcularDistancia(
                latitud,
                longitud,
                parada.lat,
                parada.lng
            );

            console.log(`📏 Distancia calculada: ${Math.round(distancia)} metros`);
            console.log(`🎯 Umbral de alerta: ${DISTANCIA_ALERTA} metros`);

            // Si la unidad está a menos de 200m de la parada del usuario
            if (distancia <= DISTANCIA_ALERTA) {
                console.log(`✅ Usuario DENTRO del rango de alerta!`);
                usuariosCercanos.push({
                    id_uso: uso.id_uso,
                    id_usuario: uso.id_usuario,
                    nombre_usuario: uso.Usuario.nombre,
                    nombre_parada: parada.nombre_parada,
                    distancia: Math.round(distancia),
                    requiereNotificacion: distancia <= DISTANCIA_ALERTA
                });

                notificaciones.push({
                    idUsuario: uso.id_usuario,
                    mensaje: `La unidad está a ${Math.round(distancia)} metros de tu parada`,
                    tipo: 'proximidad_unidad'
                });
            } else {
                console.log(`❌ Usuario FUERA del rango de alerta (${Math.round(distancia)}m > ${DISTANCIA_ALERTA}m)`);
            }
        }

        console.log(`\n📊 RESUMEN: ${usuariosCercanos.length} usuarios cercanos detectados\n`);

        // Emitir evento de WebSocket para notificaciones en tiempo real
        if (req.io && notificaciones.length > 0) {
            notificaciones.forEach(notif => {
                req.io.emit(`notificacion_usuario_${notif.idUsuario}`, {
                    mensaje: notif.mensaje,
                    tipo: notif.tipo,
                    timestamp: new Date()
                });
            });
        }

        res.json({
            mensaje: 'Verificación de proximidad completada',
            usuariosCercanos,
            totalUsuariosCercanos: usuariosCercanos.length,
            notificacionesEnviadas: notificaciones.length
        });

    } catch (e) {
        console.error('Error en verificarProximidadUnidad:', e);
        res.status(500).json({ error: e.message });
    }
};

/**
 * Verifica la proximidad del usuario a la unidad y confirma automáticamente
 * el uso si está a menos de 100 metros
 * Endpoint: POST /api/usointencion/verificar-proximidad-usuario/:id_usuario
 * Body: { latitud, longitud, id_jornada }
 */
export const verificarProximidadUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const { latitud, longitud, id_jornada } = req.body;

        if (!latitud || !longitud) {
            return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
        }

        // Buscar el UsoIntencion del usuario para esta jornada
        const uso = await UsoIntencion.findOne({
            where: {
                id_usuario,
                id_jornada,
                confirmado: false // Solo considerar usos no confirmados
            },
            include: [{
                model: Jornada,
                include: [{
                    model: Conductor,
                    attributes: ['id_conductor', 'latitud_actual', 'longitud_actual']
                }]
            }]
        });

        if (!uso) {
            return res.json({
                mensaje: 'No se encontró uso de intención pendiente para esta jornada',
                confirmado: false
            });
        }

        const conductor = uso.Jornada?.Conductor;

        if (!conductor || !conductor.latitud_actual || !conductor.longitud_actual) {
            return res.json({
                mensaje: 'No se pudo obtener la ubicación actual de la unidad',
                confirmado: false
            });
        }

        // Calcular distancia entre el usuario y la unidad
        const distancia = calcularDistancia(
            latitud,
            longitud,
            conductor.latitud_actual,
            conductor.longitud_actual
        );

        let confirmado = false;
        let mensaje = `Estás a ${Math.round(distancia)} metros de la unidad`;

        // Si el usuario está a menos de 100m de la unidad, confirmar automáticamente
        if (distancia <= DISTANCIA_CONFIRMACION) {
            uso.confirmado = true;
            await uso.save();
            confirmado = true;
            mensaje = 'Uso confirmado automáticamente. ¡Estás muy cerca de la unidad!';

            // Emitir evento de confirmación por WebSocket
            if (req.io) {
                req.io.emit(`confirmacion_uso_${id_usuario}`, {
                    id_uso: uso.id_uso,
                    id_jornada,
                    distancia: Math.round(distancia),
                    timestamp: new Date()
                });
            }
        }

        res.json({
            mensaje,
            confirmado,
            distancia: Math.round(distancia),
            id_uso: uso.id_uso,
            dentroDelRango: distancia <= DISTANCIA_CONFIRMACION,
            ubicacionUnidad: {
                latitud: conductor.latitud_actual,
                longitud: conductor.longitud_actual
            }
        });

    } catch (e) {
        console.error('Error en verificarProximidadUsuario:', e);
        res.status(500).json({ error: e.message });
    }
};

/**
 * Obtiene usos de intención con información de proximidad
 * Endpoint: GET /api/usointencion/con-proximidad/:id_usuario
 */
export const obtenerUsosConProximidad = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const { latitud, longitud } = req.query;

        const usos = await UsoIntencion.findAll({
            where: { id_usuario },
            include: [{
                model: Usuario,
                include: [{ model: Parada }]
            }, {
                model: Jornada,
                include: [{
                    model: Conductor,
                    attributes: ['id_conductor', 'nombre', 'latitud_actual', 'longitud_actual']
                }]
            }],
            order: [['id_uso', 'DESC']]
        });

        // Si se proporcionan coordenadas, calcular distancias
        if (latitud && longitud) {
            const usosConDistancia = usos.map(uso => {
                const conductor = uso.Jornada?.Conductor;
                let distanciaAUnidad = null;

                if (conductor?.latitud_actual && conductor?.longitud_actual) {
                    distanciaAUnidad = Math.round(
                        calcularDistancia(
                            parseFloat(latitud),
                            parseFloat(longitud),
                            conductor.latitud_actual,
                            conductor.longitud_actual
                        )
                    );
                }

                return {
                    ...uso.toJSON(),
                    distanciaAUnidad,
                    puedeConfirmar: distanciaAUnidad && distanciaAUnidad <= DISTANCIA_CONFIRMACION
                };
            });

            return res.json(usosConDistancia);
        }

        res.json(usos);

    } catch (e) {
        console.error('Error en obtenerUsosConProximidad:', e);
        res.status(500).json({ error: e.message });
    }
};